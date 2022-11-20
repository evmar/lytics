import { Table } from "./table";

const SCHEMA = { 'time': 'num', 'path': 'str', 'ref': 'str' } as const;

async function main() {
  const tables = await Table.load(SCHEMA, "tab");
  console.log(tables);
  console.log(tables.columns.path.top(20));

  console.log(tables.columns.ref.top(20));

  for (let i = 0; i < 10; i++) {
    console.log('row', i, tables.columns.time.str(i), tables.columns.path.str(i), tables.columns.ref.str(i));
  }
}

main().catch(err => console.log(err));