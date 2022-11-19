
interface TableMeta {
  type: string;
}
interface Meta {
  rows: number;
  tables: { [name: string]: TableMeta };
}

class Tables {
  private constructor(readonly rows: number, readonly tables: { [name: string]: unknown }) { }

  static async load(root: string): Promise<Tables> {
    const path = `${root}/meta`;
    const req = await fetch(path);
    if (!req.ok) {
      throw new Error(`load ${path} failed`);
    }
    const meta: Meta = await req.json();

    const tables: { [name: string]: unknown } = {};
    const loads: Array<Promise<void>> = [];
    for (const [name, tmeta] of Object.entries(meta.tables)) {
      const path = `${root}/${name}`;
      switch (tmeta.type) {
        case 'num':
          loads.push((async () => { tables[name] = await NumTable.load(path, meta.rows); })());
          break;
        case 'str':
          loads.push((async () => { tables[name] = await StrTable.load(path, meta.rows); })());
          break;
        default:
          throw new Error(`unknown table type ${JSON.stringify(tmeta.type)}`);
      }
    }
    await Promise.all(loads);
    return new Tables(meta.rows, tables);
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

  top(n: number): Array<{ value: string, count: number }> {
    const top = [];
    for (const { value, count } of this.numTab.top(n)) {
      top.push({ value: this.strs[value], count });
    }
    return top;
  }
}

async function main() {
  const tables = await Tables.load("tab");
  console.log(tables);
  const paths = tables.tables['path'] as StrTable;
  console.log(paths.top(20));
}

main().catch(err => console.log(err));