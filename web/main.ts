import * as table from "./table";
import * as d3 from 'd3';

const SCHEMA = { 'time': 'date', 'path': 'str', 'ref': 'str', 'ua': 'str' } as const;

const palette = ['#22A39F', '#222222', '#434242', '#F3EFE0'];

function render(query: table.Query<typeof SCHEMA>) {
  const margin = { top: 10, right: 30, bottom: 20, left: 60 };
  const width = 600;
  const height = 150;

  const svg = d3.select('body').append('svg')
    .attr('id', 'viz')
    .attr('width', margin.left + width + margin.right)
    .attr('height', margin.top + height + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const datesRaw = measure('values', () => query.col('time').values());

  // Bucket timestamps by date.
  // A quick benchmark found this faster than using d3.timeDay.
  // Note: we don't use d3.bin both for performance and because we don't want
  // autocomputed bin boundaries.
  // TODO: try precomputing the bucket limits as numbers, so we do
  // O(number of buckets) date computations rather than O(number of entries).
  const dates = measure('byDate', () => {
    const bucket: (date: Date) => string = (date) => `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
    //-${date.getUTCDate()}`;
    const byDate = new Map<string, number>();
    for (const date of datesRaw) {
      const stamp = bucket(date);
      byDate.set(stamp, (byDate.get(stamp) ?? 0) + 1);
    }
    return Array.from(byDate.entries()).map(([stamp, count]) => ({ date: new Date(stamp), count }));
  });
  console.log(`${datesRaw.length} => ${dates.length} values`);

  const x = d3.scaleUtc()
    .domain(d3.extent(dates, d => d.date) as [Date, Date])
    .range([0, width])
    .nice();
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  const y = d3.scaleLinear()
    .domain([0, d3.max(dates, d => d.count)!])
    .range([height, 0]);
  svg.append('g')
    .call(d3.axisLeft(y).ticks(4))
    .call(g => g.select('.domain').remove())

  const barWidth = x(dates[1].date) - x(dates[0].date) + 0.5;
  svg.selectAll('#line')
    .data(dates)
    .join('rect')
    .attr('fill', palette[0])
    .attr('x', d => x(d.date))
    .attr('width', d => barWidth)
    .attr('y', d => y(d.count))
    .attr('height', d => y(0) - y(d.count));

  const htable = d3.select('body').append('section').append('table');
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

function isNotBot(ua: string): boolean {
  // XXX too hacky to use
  if (!ua) return true;
  switch (ua) {
    case 'NextCloud-News/1.0':
    case 'pageCheck.py/0.4':
    case 'The Knowledge AI':
      return false;
  }
  if (ua.includes('Bot') || ua.includes('bot') || ua.includes('Crawler')) return false;
  if (ua.includes('Feed') || ua.includes('RSS') || ua.includes('news')) return false;
  return true;
}

async function main() {
  const tab = await table.Table.load(SCHEMA, 'tab');

  for (let i = 0; i < 3; i++) {
    console.log('row', i, tab.columns.time.str(i), tab.columns.path.str(i), tab.columns.ref.str(i), tab.columns.ua.str(i));
  }

  const query = tab.query();

  measure('ua', () => {
    query.col('ua').filterFn2(ua => {
      if (!ua || !ua.startsWith('Mozilla/')) return false;
      if (ua.match(/bot|crawl|spider/i)) return false;
      return true;
    });
    const t = table.top(query.col('ua').count(), 50)
      .map(({ value, count }) => ({ value: tab.columns.ua.decode(value), count }))
    console.log('top', t);
  });

  measure('main', () => {
    //measure('time', () => query.col('time').range(new Date(2022, 4), new Date(2022, 12)));
    measure('path', () => query.col('path').filterFn2((path) => {
      if (!path) return false;
      switch (path) {
        case '/favicon.ico':
        case '/robots.txt':
          return false;
      }
      if (path.endsWith('/atom.xml') || path.endsWith('/atom')) return false;
      if (path.endsWith('.css')) return false;
      if (path.endsWith('.woff')) return false;
      return true;
    }));
  });

  measure('render', () => {
    render(query);
  });
}

main().catch(err => console.log(err));