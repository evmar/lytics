import { Tables } from "./table";

const SCHEMA = { 'time': 'num', 'path': 'str', 'ref': 'str' } as const;

async function main() {
  const tables = await Tables.load(SCHEMA, "tab");
  console.log(tables);
  console.log(tables.tables.path.top(20));

  for (let i = 0; i < 10; i++) {
    console.log('row', i, tables.tables.time.str(i), tables.tables.path.str(i), tables.tables.ref.str(i));
  }
}

main().catch(err => console.log(err));