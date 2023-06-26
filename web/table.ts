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
            cols[name] = NumCol.decode(raw, meta.rows, asc);
            break;
          case 'str':
            cols[name] = StrCol.decode(raw, meta.rows, asc);
            break;
          case 'date':
            cols[name] = DateCol.decode(raw, meta.rows, asc);
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

/** Given a map of value=>count, return an Array of the top n [value, count] pairs based on count. */
export function top(counts: Map<number, number>, n: number): Array<{ value: number, count: number }> {
  const top = [];
  for (const [value, count] of counts.entries()) {
    top.push({ value, count });
  }
  top.sort(({ count: a }, { count: b }) => b - a);
  return top.slice(0, n);
}

function readVarInts(raw: ArrayBuffer, count: number): [Uint32Array, number] {
  const values = new Uint32Array(count);
  const view = new DataView(raw);
  let ofs = 0;
  for (let i = 0; i < count; i++) {
    let n = 0;
    for (let shift = 0; ; shift += 7) {
      let b = view.getUint8(ofs++);
      n |= (b & 0x7F) << shift;
      if (!(b & 0x80)) break;
    }
    values[i] = n;
  }
  return [values, ofs];
}

abstract class Col<Decoded> {
  /** Decode varints from an ArrayBuffer, returning the values and the end offset. */
  static decodeRaw(raw: ArrayBuffer, rows: number, asc: boolean): [Uint32Array, number] {
    const [arr, ofs] = readVarInts(raw, rows);
    if (asc) {
      for (let i = 1; i < arr.length; i++) {
        arr[i] += arr[i - 1];
      }
    }
    return [arr, ofs];
  }

  constructor(readonly arr: Uint32Array, readonly rows: number) { }

  raw(row: number): number {
    return this.arr[row];
  }

  str(row: number): string | null {
    return (this.decode(this.raw(row)) ?? '[null]').toString();
  }

  abstract decode(value: number): Decoded;
}

class NumCol extends Col<number> {
  static decode(raw: ArrayBuffer, rows: number, asc: boolean): NumCol {
    const [arr,] = Col.decodeRaw(raw, rows, asc);
    return new NumCol(arr, rows);
  }

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

  matchNone(): this {
    const set = (this.query.bitset ??= new BitSet());
    for (let i = 0; i < this.col.arr.length; i++) {
      set.add(i);
    }
    return this;
  }

  filterRaw(query: number): this {
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

  /** Count the values, returning a map of value=>count. */
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
  static decode(raw: ArrayBuffer, rows: number, asc: boolean): StrCol {
    const [arr, ofs] = Col.decodeRaw(raw, rows, asc);
    const json = new TextDecoder().decode(new DataView(raw, ofs));
    const strTab = JSON.parse(json);
    strTab[0] = null;
    return new StrCol(arr, rows, strTab);
  }

  constructor(arr: Uint32Array, rows: number, readonly strTab: Array<string | null>) {
    super(arr, rows);
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

  filter(query: string): this {
    const enc = this.col.encode(query);
    if (!enc) return this.matchNone();
    return super.filterRaw(enc);
  }

  /** Filter this column by selecting values for which the function returns true. */
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
  static decode(raw: ArrayBuffer, rows: number, asc: boolean): DateCol {
    if (!asc) {
      throw new Error('date column must be ascending');
    }
    const [arr,] = Col.decodeRaw(raw, rows, asc);
    return new DateCol(arr, rows);
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

  /** Filter this query by a min/max range. */
  range(min: Date, max: Date): this {
    return this.rawRange(this.col.encode(min), this.col.encode(max));
  }
}

type QueryType<T> = T extends 'num' ? NumQuery : T extends 'str' ? StrQuery : T extends 'date' ? DateQuery : never;

/** A filtered subset of a table. */
export class Query<S> {
  constructor(readonly tab: Table<S>,
    /** set[i] is 1 when the ith row is *excluded*; this makes the set operations simpler. */
    public bitset?: BitSet) {
  }

  /** Select a column for filtering. */
  col<col extends keyof S>(colName: col): QueryType<S[col]> {
    return this.tab.columns[colName].query(this) as any;
  }

  /** Clone this query, allowing further filtering without mutating the original query. */
  clone(): Query<S> {
    return new Query(this.tab, this.bitset?.clone());
  }
}