import { Tables } from "./table";

const SCHEMA = { 'date': 'num', 'path': 'str' } as const;

async function main() {
  const tables = await Tables.load(SCHEMA, "tab");
  console.log(tables);
  console.log(tables.tables.path.top(20));
}

main().catch(err => console.log(err));