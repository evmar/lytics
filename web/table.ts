import { TypedFastBitSet as BitSet } from './TypedFastBitSet';

interface ColMeta {
  type: string;
}
interface Meta {
  rows: number;
  cols: { [name: string]: ColMeta };
}

type ColumnType<T> = T extends 'num' ? NumCol : T extends 'str' ? StrCol : T extends 'date' ? DateCol : never;
type SchemaCols<S> = {
  [col in keyof S]: ColumnType<S[col]>;
}

async function loadCheckMeta<S extends { [col: string]: string }>(schema: S, root: string): Promise<Meta> {
  const path = `${root}/meta`;
  const req = await fetch(path);
  if (!req.ok) {
    throw new Error(`load ${path} failed`);
  }
  const meta: Meta = await req.json();

  const cols: { [name: string]: unknown } = {};
  const loads: Array<Promise<void>> = [];
  for (let [name, type] of Object.entries(schema)) {
    const tmeta = meta.cols[name];
    if (!tmeta) {
      throw new Error(`missing column ${name} in meta`);
    }
    if (type === 'date') type = 'num';
    if (tmeta.type !== type) {
      throw new Error(`column ${name}: expected ${type}, got ${tmeta.type}`);
    }
  }
  return meta;
}

export class Table<S> {
  private constructor(readonly rows: number, readonly columns: SchemaCols<S>) { }

  static async load<S extends { [col: string]: string }>(schema: S, root: string): Promise<Table<S>> {
    const meta = await loadCheckMeta(schema, root);
    const cols: { [name: string]: unknown } = {};
    const loads: Array<Promise<void>> = [];
    for (const [name, type] of Object.entries(schema)) {
      const path = `${root}/${name}`;
      loads.push((async () => {
        const req = await fetch(path);
        if (!req.ok) {
          throw new Error(`load ${path} failed`);
        }
        const raw = await req.arrayBuffer();
        switch (type) {
          case 'num':
            cols[name] = new NumCol(raw, meta.rows);
            break;
          case 'str':
            cols[name] = new StrCol(raw, meta.rows);
            break;
          case 'date':
            cols[name] = new DateCol(raw, meta.rows);
            break;
          default:
            throw new Error(`unhandled type ${type}`);
        }
      })());
    }
    await Promise.all(loads);
    return new Table(meta.rows, cols as SchemaCols<S>);
  }

  query(): Query<S> {
    return new Query(this);
  }
}

export function top(counts: Map<number, number>, n: number): Array<{ value: number, count: number }> {
  const top = [];
  for (const [value, count] of counts.entries()) {
    top.push({ value, count });
  }
  top.sort(({ count: a }, { count: b }) => b - a);
  return top.slice(0, n);
}

class NumCol {
  readonly arr: Uint32Array;
  constructor(raw: ArrayBuffer, readonly rows: number) {
    this.arr = new Uint32Array(raw);
  }

  raw(row: number): number {
    return this.arr[row];
  }

  str(row: number): string | null {
    return this.raw(row).toString();
  }

  query(bitset: BitSet): NumQuery {
    return new NumQuery(this, bitset);
  }
}

class NumQuery {
  constructor(protected col: NumCol, readonly bitset: BitSet) { }

  filter(query: number): this {
    const set = new BitSet();
    for (let i = 0; i < this.col.arr.length; i++) {
      if (!this.bitset.has(i)) continue;
      const val = this.col.arr[i];
      if (val === query) set.add(i);
    }
    this.bitset.intersection(set);
    return this;
  }

  range(min: number, max: number): this {
    const set = new BitSet();
    for (let i = 0; i < this.col.arr.length; i++) {
      if (!this.bitset.has(i)) continue;
      const val = this.col.arr[i];
      if (val > min && val < max) set.add(i);
    }
    this.bitset.intersection(set);
    return this;
  }

  count(): Map<number, number> {
    const counts = new Map<number, number>();
    for (let i = 0; i < this.col.arr.length; i++) {
      if (!this.bitset.has(i)) continue;
      const val = this.col.arr[i];
      counts.set(val, (counts.get(val) ?? 0) + 1);
    }
    return counts;
  }
}

class StrCol extends NumCol {
  readonly strTab: Array<string | null>;
  constructor(raw: ArrayBuffer, rows: number) {
    const arr = new Uint32Array(raw.slice(0, 4 * rows));
    const json = new TextDecoder().decode(new DataView(raw, arr.byteLength));
    super(arr, rows);
    this.strTab = JSON.parse(json);
    this.strTab[0] = null;
  }

  decode(value: number): string | null {
    return this.strTab[value];
  }
  encode(value: string): number | null {
    const idx = this.strTab.findIndex((str) => str === value);
    if (idx < 0) return null;
    return idx;
  }

  str(row: number): string | null {
    return this.decode(this.raw(row));
  }

  query(bitset: BitSet): StrQuery {
    return new StrQuery(this, bitset);
  }
}

class StrQuery extends NumQuery {
  constructor(protected col: StrCol, bitset: BitSet) { super(col, bitset); }

  filter(query: string | number): this {
    if (typeof query === 'string') {
      const q = this.col.encode(query);
      if (!q) throw new Error('todo');
      query = q;
    }
    return super.filter(query);
  }

  filterFn(f: (value: string | null) => boolean): this {
    const set = new BitSet();
    const cache = new Map<number, boolean>();
    for (let i = 0; i < this.col.arr.length; i++) {
      if (!this.bitset.has(i)) continue;
      const val = this.col.arr[i];
      let keep = cache.get(val);
      if (keep === undefined) {
        keep = f(this.col.decode(val));
        cache.set(val, keep);
      }
      if (keep) {
        set.add(i);
      }
    }
    this.bitset.intersection(set);
    return this;
  }
}

class DateCol extends NumCol {
  constructor(raw: ArrayBuffer, readonly rows: number) {
    super(raw, rows);
    // TODO: this.checkSorted();
  }

  private check() {
    let last = 0;
    for (let i = 0; i < this.arr.length; i++) {
      const val = this.arr[i];
      if (val < last) throw new Error(`date column not sorted at entry ${i}: ${last} vs ${val}`);
      last = val;
    }
  }

  query(bitset: BitSet): DateQuery {
    return new DateQuery(this, bitset);
  }

  str(row: number): string {
    return this.decode(this.raw(row)).toString();
  }

  decode(value: number): Date {
    return new Date(value * 1000);
  }
}

class DateQuery extends NumQuery {
  range(min: Date | number, max: Date | number): this {
    if (typeof min !== 'number') min = min.valueOf() / 1000;
    if (typeof max !== 'number') max = max.valueOf() / 1000;
    return super.range(min, max);
  }
}

type QueryType<T> = T extends 'num' ? NumQuery : T extends 'str' ? StrQuery : T extends 'date' ? DateQuery : never;

export class Query<S> {
  public bitset: BitSet;
  constructor(readonly tab: Table<S>) {
    this.bitset = new BitSet();
    this.bitset.addRange(0, tab.rows);
  }

  col<col extends keyof S>(colName: col): QueryType<S[col]> {
    return this.tab.columns[colName].query(this.bitset) as any;
  }
}