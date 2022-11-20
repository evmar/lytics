import * as table from "./table";

const SCHEMA = { 'time': 'num', 'path': 'str', 'ref': 'str' } as const;

async function main() {
  const tab = await table.Table.load(SCHEMA, "tab");
  console.log(tab);

  for (let i = 0; i < 10; i++) {
    console.log('row', i, tab.columns.time.str(i), tab.columns.path.str(i), tab.columns.ref.str(i));
  }

  console.log(
    table.top(table.count(tab.columns.path.arr), 20)
      .map(({ value, count }) => ({ value: tab.columns.path.decode(value), count }))
  );

  const q = tab.columns.path.eq('/software/blog/2022/01/rethinking-errors.html');
  console.log(Array.from(q).length);
  const t = table.top(table.count(tab.columns.ref.raws(q)), 20)
    .map(({ value, count }) => ({ value: tab.columns.ref.decode(value), count }))
  console.log(t);
}

main().catch(err => console.log(err));