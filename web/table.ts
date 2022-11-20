import { TypedFastBitSet as BitSet } from './TypedFastBitSet';

interface ColMeta {
  type: string;
}
interface Meta {
  rows: number;
  cols: { [name: string]: ColMeta };
}

type SchemaCol<T> = T extends 'num' ? NumCol : T extends 'str' ? StrCol : never;
type SchemaCols<S> = {
  [col in keyof S]: SchemaCol<S[col]>;
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
}

export function count(xs: Iterable<number>): Map<number, number> {
  const counts = new Map<number, number>();
  for (const value of xs) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
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
  *raws(filter: BitSet): Iterable<number> {
    for (const val of filter) {
      yield this.arr[val];
    }
  }

  str(row: number): string {
    return this.raw(row).toString();
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

  str(row: number): string {
    return this.decode(this.raw(row));
  }
  *strs(filter: BitSet): Iterable<string> {
    for (const val of filter) {
      yield this.str(val);
    }
  }

  eq(str: string): BitSet {
    const set = new BitSet();
    for (let i = 0; i < this.arr.length; i++) {
      const val = this.arr[i];
      if (this.strTab[val] === str) {
        set.add(i);
      }
    }
    return set;
  }
}