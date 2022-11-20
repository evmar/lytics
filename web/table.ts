
interface TableMeta {
  type: string;
}
interface Meta {
  rows: number;
  tables: { [name: string]: TableMeta };
}

type SchemaTable<T> = T extends 'num' ? NumTable : T extends 'str' ? StrTable : never;
type SchemaTables<S> = {
  [table in keyof S]: SchemaTable<S[table]>;
}

async function loadCheckMeta<S extends { [table: string]: string }>(schema: S, root: string): Promise<Meta> {
  const path = `${root}/meta`;
  const req = await fetch(path);
  if (!req.ok) {
    throw new Error(`load ${path} failed`);
  }
  const meta: Meta = await req.json();

  const tables: { [name: string]: unknown } = {};
  const loads: Array<Promise<void>> = [];
  for (const [name, type] of Object.entries(schema)) {
    const tmeta = meta.tables[name];
    if (!tmeta) {
      throw new Error(`missing table ${name} in meta`);
    }
    if (tmeta.type !== type) {
      throw new Error(`table ${name}: expected ${type}, got ${tmeta.type}`);
    }
  }
  return meta;
}

export class Tables<S> {
  private constructor(readonly rows: number, readonly tables: SchemaTables<S>) { }

  static async load<S extends { [table: string]: string }>(schema: S, root: string): Promise<Tables<S>> {
    const meta = await loadCheckMeta(schema, root);
    const tables: { [name: string]: unknown } = {};
    const loads: Array<Promise<void>> = [];
    for (const [name, type] of Object.entries(schema)) {
      const path = `${root}/${name}`;
      switch (type) {
        case 'num':
          loads.push((async () => { tables[name] = await NumTable.load(path, meta.rows); })());
          break;
        case 'str':
          loads.push((async () => { tables[name] = await StrTable.load(path, meta.rows); })());
          break;
      }
    }
    await Promise.all(loads);
    return new Tables(meta.rows, tables as SchemaTables<S>);
  }
}

class NumTable {
  constructor(readonly tab: Uint32Array, readonly rows: number) { }
  static async load(path: string, rows: number): Promise<NumTable> {
    const req = await fetch(path);
    if (!req.ok) {
      throw new Error(`load ${path} failed`);
    }
    const raw = await req.arrayBuffer();
    return new NumTable(new Uint32Array(raw), rows);
  }

  raw(row: number): number {
    return this.tab[row];
  }

  str(row: number): string {
    return this.raw(row).toString();
  }

  count(): Map<number, number> {
    const counts = new Map<number, number>();
    for (const value of this.tab) {
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

class StrTable {
  constructor(readonly numTab: NumTable, readonly strs: string[]) { }

  static async load(path: string, rows: number): Promise<StrTable> {
    const req = await fetch(path);
    if (!req.ok) {
      throw new Error(`load ${path} failed`);
    }
    const raw = await req.arrayBuffer();
    const numTab = new NumTable(new Uint32Array(raw.slice(0, 4 * rows)), rows);
    const json = new TextDecoder().decode(new DataView(raw, numTab.tab.byteLength));
    const strings = JSON.parse(json);
    return new StrTable(numTab, strings);
  }

  raw(row: number): number {
    return this.numTab.raw(row);
  }

  str(row: number): string {
    return this.strs[this.raw(row)];
  }

  top(n: number): Array<{ value: string, count: number }> {
    const top = [];
    for (const { value, count } of this.numTab.top(n)) {
      top.push({ value: this.strs[value], count });
    }
    return top;
  }
}
