import { TypedFastBitSet as BitSet } from './TypedFastBitSet';

interface ColMeta {
  type: string;
  [key: string]: unknown;
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
      const path = `${root}/${name}.js`;
      loads.push((async () => {
        const req = await fetch(path);
        if (!req.ok) {
          throw new Error(`load ${path} failed`);
        }
        const raw = await req.arrayBuffer();
        const asc = !!meta.cols[name]['asc'];
        switch (type) {
          case 'num':
            cols[name] = new NumCol(raw, meta.rows, asc);
            break;
          case 'str':
            cols[name] = new StrCol(raw, meta.rows);
            break;
          case 'date':
            cols[name] = new DateCol(raw, meta.rows, asc);
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

abstract class Col<Decoded> {
  readonly arr: Uint32Array;
  constructor(raw: ArrayBuffer, readonly rows: number, asc: boolean) {
    this.arr = new Uint32Array(raw);
    if (asc) {
      for (let i = 1; i < this.arr.length; i++) {
        this.arr[i] += this.arr[i - 1];
      }
    }
  }

  raw(row: number): number {
    return this.arr[row];
  }

  str(row: number): string | null {
    return (this.decode(this.raw(row)) ?? '[null]').toString();
  }

  abstract decode(value: number): Decoded;
}

class NumCol extends Col<number> {
  query(query: Query<unknown>): NumQuery {
    return new NumQuery(this, query);
  }

  decode(value: number): number {
    return value;
  }
}

class BaseQuery<Decoded> {
  constructor(protected col: Col<Decoded>, readonly query: Query<unknown>) { }

  rawValues(): number[] {
    const values = [];
    const set = this.query.bitset;
    for (let i = 0; i < this.col.arr.length; i++) {
      if (set?.has(i)) continue;
      const val = this.col.arr[i];
      values.push(val);
    }
    return values;
  }

  values(): Decoded[] {
    return this.rawValues().map((val) => this.col.decode(val));
  }

  filter(query: number): this {
    const set = (this.query.bitset ??= new BitSet());
    for (let i = 0; i < this.col.arr.length; i++) {
      const val = this.col.arr[i];
      if (val !== query) set.add(i);
    }
    return this;
  }

  rawRange(min: number, max: number): this {
    const set = (this.query.bitset ??= new BitSet());
    for (let i = 0; i < this.col.arr.length; i++) {
      const val = this.col.arr[i];
      if (val < min || val > max) set.add(i);
    }
    return this;
  }

  count(): Map<number, number> {
    const set = this.query.bitset;
    const counts = new Map<number, number>();
    for (let i = 0; i < this.col.arr.length; i++) {
      if (set?.has(i)) continue;
      const val = this.col.arr[i];
      counts.set(val, (counts.get(val) ?? 0) + 1);
    }
    return counts;
  }
}

class NumQuery extends BaseQuery<number> {
}

class StrCol extends Col<string | null> {
  readonly strTab: Array<string | null>;
  constructor(raw: ArrayBuffer, rows: number) {
    const arr = new Uint32Array(raw.slice(0, 4 * rows));
    const json = new TextDecoder().decode(new DataView(raw, arr.byteLength));
    super(arr, rows, false);
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

  query(query: Query<unknown>): StrQuery {
    return new StrQuery(this, query);
  }
}

export class StrQuery extends BaseQuery<string | null> {
  constructor(readonly col: StrCol, query: Query<unknown>) { super(col, query); }

  filter(query: string | number): this {
    if (typeof query === 'string') {
      const q = this.col.encode(query);
      if (!q) throw new Error('todo');
      query = q;
    }
    return super.filter(query);
  }

  filterFn(f: (value: string | null) => boolean): this {
    const str = this.col.strTab.map((str) => f(str));

    const set = (this.query.bitset ??= new BitSet());
    for (let i = 0; i < this.col.arr.length; i++) {
      const val = this.col.arr[i];
      if (!str[val]) set.add(i);
    }
    return this;
  }
}

class DateCol extends Col<Date> {
  constructor(raw: ArrayBuffer, readonly rows: number, asc: boolean) {
    super(raw, rows, asc);
    if (!asc) {
      throw new Error('date column must be ascending');
    }
  }

  query(query: Query<unknown>): DateQuery {
    return new DateQuery(this, query);
  }

  encode(value: Date): number {
    return value.valueOf() / 1000;
  }
  decode(value: number): Date {
    return new Date(value * 1000);
  }
}

class DateQuery extends BaseQuery<Date> {
  constructor(protected col: DateCol, query: Query<unknown>) { super(col, query); }

  rawRange(min: number, max: number): this {
    const set = (this.query.bitset ??= new BitSet());
    // Rely on the fact that the column is ordered to bulk set all the relevant bits.
    let minIndex = 0;
    let maxIndex: number | undefined;
    for (let i = 0; i < this.col.arr.length; i++) {
      const val = this.col.arr[i];
      if (val < min) minIndex = i;
      if (maxIndex === undefined && val > max) maxIndex = i;
    }
    set.addRange(0, minIndex);
    if (maxIndex) set.addRange(maxIndex, this.col.arr.length);
    return this;
  }

  range(min: Date, max: Date): this {
    return this.rawRange(this.col.encode(min), this.col.encode(max));
  }
}

type QueryType<T> = T extends 'num' ? NumQuery : T extends 'str' ? StrQuery : T extends 'date' ? DateQuery : never;

export class Query<S> {
  constructor(readonly tab: Table<S>,
    /** set[i] is 1 when the ith row is *excluded*; this makes the set operations simpler. */
    public bitset?: BitSet) {
  }

  col<col extends keyof S>(colName: col): QueryType<S[col]> {
    return this.tab.columns[colName].query(this) as any;
  }

  clone(): Query<S> {
    return new Query(this.tab, this.bitset?.clone());
  }
}