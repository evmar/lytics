import * as table from "./table";

const SCHEMA = { 'time': 'date', 'path': 'str', 'ref': 'str' } as const;

async function main() {
  const tab = await table.Table.load(SCHEMA, "tab");
  console.log(tab);

  for (let i = 0; i < 10; i++) {
    console.log('row', i, tab.columns.time.str(i), tab.columns.path.str(i), tab.columns.ref.str(i));
  }

  console.log(
    table.top(tab.query().col('path').count(), 20)
      .map(({ value, count }) => ({ value: tab.columns.path.decode(value), count }))
  );

  const query = tab.query();
  query.col('path').filter('/software/blog/2022/01/rethinking-errors.html');
  console.log(Array.from(query.bitset).length);
  const t = table.top(query.col('ref').count(), 20)
    .map(({ value, count }) => ({ value: tab.columns.ref.decode(value), count }))
  console.log(t);

  {
    const query = tab.query().col('time').range(new Date(2022, 7), new Date(2022, 12));
    console.log('range', Array.from(query.bitset).length);
  }
}

main().catch(err => console.log(err));