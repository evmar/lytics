
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

  count(): Map<number, number> {
    const counts = new Map<number, number>();
    for (const value of this.arr) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return counts;
  }

  top(n: number): Array<{ value: number, count: number }> {
    const top = [];
    for (const [value, count] of this.count().entries()) {
      top.push({ value, count });
    }
    top.sort(({ count: a }, { count: b }) => b - a);
    return top.slice(0, n);
  }
}

class StrCol {
  constructor(readonly numCol: NumCol, readonly strs: string[]) { }

  static async load(path: string, rows: number): Promise<StrCol> {
    const req = await fetch(path);
    if (!req.ok) {
      throw new Error(`load ${path} failed`);
    }
    const raw = await req.arrayBuffer();
    const numCol = new NumCol(new Uint32Array(raw.slice(0, 4 * rows)), rows);
    const json = new TextDecoder().decode(new DataView(raw, numCol.arr.byteLength));
    const strings = JSON.parse(json);
    strings[0] = null;
    return new StrCol(numCol, strings);
  }

  raw(row: number): number {
    return this.numCol.raw(row);
  }

  str(row: number): string {
    return this.strs[this.raw(row)];
  }

  top(n: number): Array<{ value: string, count: number }> {
    const top = [];
    for (const { value, count } of this.numCol.top(n)) {
      top.push({ value: this.strs[value], count });
    }
    return top;
  }
}
