import * as table from "./table";
import * as d3 from 'd3';
import * as preact from 'preact';
import * as hooks from 'preact/hooks';

const SCHEMA = {
  'time': 'date',
  'path': 'str',
  'ref': 'str',
  'ua': 'str',
} as const;

const palette = ['#22A39F', '#222222', '#434242', '#F3EFE0'];

function TopTable({ name, col }: { name: string, col: table.StrQuery }): preact.JSX.Element {
  const top = hooks.useMemo(() => table.top(col.count(), 20), [col]);
  const rows = top.map(({ value, count }) => {
    const text = col.col.decode(value)?.substring(0, 80) || 'none';
    return <tr>
      <td>{text}</td>
      <td>{count}</td>
    </tr>;
  });
  return <section>
    <h2>{name}</h2>
    <table>{rows}</table>
  </section>;
}

function Chart({ query, setSpan }: { query: table.Query<typeof SCHEMA>, setSpan: (span: [Date, Date] | undefined) => void }) {
  const svgRef = preact.createRef<SVGSVGElement>();
  hooks.useEffect(() => d3Chart(svgRef.current!), []);

  return <svg ref={svgRef} />;

  function d3Chart(node: SVGElement) {
    const margin = { top: 10, right: 30, bottom: 20, left: 60 };
    const width = 600;
    const height = 150;

    const svg = d3.select(node)
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

    const brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on('brush', (event: d3.D3BrushEvent<number>) => {
        const [min, max] = event.selection as [number, number];
        setSpan([x.invert(min), x.invert(max)]);
      })
      .on('end', (event) => {
        if (!event.selection) {
          setSpan(undefined);
        }
      });
    svg.append('g')
      .call(brush);
  }
}

function measure<T>(name: string, f: () => T): T {
  const start = performance.mark(name + '-start').name;
  const ret = f();
  const end = performance.mark(name + '-end').name;
  performance.measure(name, start, end);
  return ret;
}

function uaLooksLikeUser(ua: string | null): boolean {
  if (!ua || !ua.startsWith('Mozilla/')) return false;
  if (ua.match(/bot|crawl|spider/i)) return false;
  return true;
}

function pathLooksLikeContent(path: string | null): boolean {
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
}

async function main() {
  const tab = await table.Table.load(SCHEMA, 'tab');

  for (let i = 0; i < 3; i++) {
    console.log('row', i, tab.columns.time.str(i), tab.columns.path.str(i), tab.columns.ref.str(i), tab.columns.ua.str(i));
  }

  const query = tab.query();

  measure('ua', () => {
    query.col('ua').filterFn(uaLooksLikeUser);
    const t = table.top(query.col('ua').count(), 50)
      .map(({ value, count }) => ({ value: tab.columns.ua.decode(value), count }))
    console.log('top', t);
  });

  measure('main', () => {
    //measure('time', () => query.col('time').range(new Date(2022, 4), new Date(2022, 12)));
    measure('path', () => query.col('path').filterFn(pathLooksLikeContent));
    //query.col('path').filter('/');
    //query.col('path').filter('/content/dfw/ffacy.pdf');
  });

  {
    const t = table.top(query.col('ref').count(), 50)
      .map(({ value, count }) => ({ value: tab.columns.ref.decode(value), count }));
    console.log('top', t);
  }

  measure('render', () => {
    //    render(query);
  });

  preact.render(<App query={query} />, document.body);
}

main().catch(err => console.log(err));

namespace App {
  export interface State {
    query: table.Query<typeof SCHEMA>;
    span?: [Date, Date];
  }
}
function App({ query }: { query: table.Query<typeof SCHEMA> }) {
  const [span, setSpan] = hooks.useState<[Date, Date] | undefined>(undefined);

  const q = hooks.useMemo(() => {
    if (span) {
      const q = query.clone();
      q.col('time').range(span[0], span[1]);
      return q;
    } else {
      return query;
    }
  }, [query, span]);

  return <>
    <h1>lytics</h1>
    <Chart query={query} setSpan={setSpan} />
    <TopTable name='path' col={q.col('path')} />
    <TopTable name='ref' col={q.col('ref')} />
    <TopTable name='ua' col={q.col('ua')} />
  </>;
}