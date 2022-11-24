import * as table from "./table";
import * as d3 from 'd3';

const SCHEMA = { 'time': 'date', 'path': 'str', 'ref': 'str' } as const;

function render(query: table.Query<typeof SCHEMA>) {
  const margin = { top: 10, right: 30, bottom: 30, left: 60 };
  const width = 600;
  const height = 200;

  const svg = d3.select('#viz').append('svg')
    .attr('width', margin.left + width + margin.right)
    .attr('height', margin.top + height + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const dates = query.col('time').values();

  const x = d3.scaleUtc()
    .domain(d3.extent(dates) as [Date, Date])
    .range([0, width])
    .nice();
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  const bin = d3.bin<Date, Date>()
    (dates);
  const y = d3.scaleLinear()
    .domain([0, d3.max(bin, (d) => d.length)!])
    .range([height, 0]);

  svg.append('g')
    .call(d3.axisLeft(y));

  svg.selectAll('#line')
    .data([bin])
    .join('path')
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', d3.line<d3.Bin<Date, Date>>()
      .x(d => x(d.x0!))
      .y(d => y(d.length))
    );

  const htable = d3.select('#viz').append('table');
  const top = table.top(query.col('path').count(), 20);
  const rows = htable.selectAll('tr')
    .data(top)
    .join('tr');
  const tds = rows.selectAll('td')
    .data(d => [query.tab.columns.path.decode(d.value), d.count])
    .join('td')
    .text(d => d);
}

function measure<T>(name: string, f: () => T): T {
  const start = performance.mark(name + '-start').name;
  const ret = f();
  const end = performance.mark(name + '-end').name;
  performance.measure(name, start, end);
  return ret;
}

async function main() {
  const tab = await table.Table.load(SCHEMA, 'tab');

  for (let i = 0; i < 3; i++) {
    console.log('row', i, tab.columns.time.str(i), tab.columns.path.str(i), tab.columns.ref.str(i));
  }

  {

    const query = tab.query();
    query.col('path').filter('/software/blog/2022/01/rethinking-errors.html');
    console.log(Array.from(query.bitset).length);
    const t = table.top(query.col('ref').count(), 20)
      .map(({ value, count }) => ({ value: tab.columns.ref.decode(value), count }))
    console.log(t);
  }

  const query = measure('main', () => {
    const query = tab.query();
    measure('time', () => query.col('time').range(new Date(2022, 7), new Date(2022, 12)));
    measure('path', () => query.col('path').filterFn2((path) => {
      return !!(path && (path.endsWith('/') || path.endsWith('.html')));
    }));
    return query;
  });

  measure('render', () => {
    render(query);
  });
}

main().catch(err => console.log(err));