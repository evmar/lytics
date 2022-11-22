import { TypedFastBitSet as BitSet } from './TypedFastBitSet';

interface ColMeta {
  type: string;
}
interface Meta {
  rows: number;
  cols: { [name: string]: ColMeta };
}

type ColumnType<T> = T extends 'num' ? NumCol : T extends 'str' ? StrCol : never;
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
  for (const [name, type] of Object.entries(schema)) {
    const tmeta = meta.cols[name];
    if (!tmeta) {
      throw new Error(`missing column ${name} in meta`);
    }
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
      switch (type) {
        case 'num':
          loads.push((async () => { cols[name] = await NumCol.load(path, meta.rows); })());
          break;
        case 'str':
          loads.push((async () => { cols[name] = await StrCol.load(path, meta.rows); })());
          break;
      }
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
  constructor(readonly arr: Uint32Array, readonly rows: number) { }
  static async load(path: string, rows: number): Promise<NumCol> {
    const req = await fetch(path);
    if (!req.ok) {
      throw new Error(`load ${path} failed`);
    }
    const raw = await req.arrayBuffer();
    return new NumCol(new Uint32Array(raw), rows);
  }

  raw(row: number): number {
    return this.arr[row];
  }

  str(row: number): string {
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
  constructor(arr: Uint32Array, rows: number, readonly strTab: string[]) { super(arr, rows); }

  static async load(path: string, rows: number): Promise<StrCol> {
    const req = await fetch(path);
    if (!req.ok) {
      throw new Error(`load ${path} failed`);
    }
    const raw = await req.arrayBuffer();
    const arr = new Uint32Array(raw.slice(0, 4 * rows));
    const json = new TextDecoder().decode(new DataView(raw, arr.byteLength));
    const strTab = JSON.parse(json);
    strTab[0] = null;
    return new StrCol(arr, rows, strTab);
  }

  decode(value: number): string {
    return this.strTab[value];
  }
  encode(value: string): number | null {
    const idx = this.strTab.findIndex((str) => str === value);
    if (idx < 0) return null;
    return idx;
  }

  str(row: number): string {
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
}

type QueryType<T> = T extends 'num' ? NumQuery : T extends 'str' ? StrQuery : never;

export class Query<S> {
  public bitset: BitSet;
  constructor(private tab: Table<S>) {
    this.bitset = new BitSet();
    this.bitset.addRange(0, tab.rows);
  }

  col<col extends keyof S>(colName: col): QueryType<S[col]> {
    return this.tab.columns[colName].query(this.bitset) as any;
  }
}