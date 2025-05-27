import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Helmet } from 'react-helmet-async';

// Smooth scrolling behavior
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('scroll-smooth');
}

export default function GeneralStatsChart({ slug }) {
  const [players, setPlayers] = useState(null);
  const [deckIconsMap, setDeckIconsMap] = useState({});
  const [top3, setTop3] = useState({});
  const [error, setError] = useState(null);

  // Load data
  useEffect(() => {
    fetch(`data/${slug}/standings.json`)
      .then(res => {
        if (!res.ok) throw new Error('standings.json not found');
        return res.json();
      })
      .then(data => {
        setPlayers(data.players);
        setDeckIconsMap(data.deckIcons || {});
      })
      .catch(err => setError(err.message));

    fetch(`data/${slug}/top3.json`)
      .then(res => {
        if (!res.ok) throw new Error('top3.json not found');
        return res.json();
      })
      .then(setTop3)
      .catch(err => console.warn(err.message));
  }, [slug]);

  // Chart data generator
  const makeChartData = (statusFilter, topN = Infinity) => {
    if (!players) return [];
    const map = {};
    players
      .filter(p => statusFilter == null || p.status === statusFilter)
      .forEach(p => map[p.deck] = (map[p.deck] || 0) + 1);
    return Object.entries(map)
      .map(([deck, count]) => ({ deck, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  };

  const dataSets = useMemo(() => ({
    overall: makeChartData(null, 10),
    day2:    makeChartData('day2', 10),
    topcut:  makeChartData('topcut'),
  }), [players]);

  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;
  if (!players) return <div className="p-4 text-gray-600">Loading statistics…</div>;

  const titleName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const COLORS = ['#8884d8','#8dd1e1','#ffc658','#ff8042','#a4de6c','#d0ed57','#82ca9d','#ffc0cb','#8b008b'];

  // Icon labels for pie slices
  const renderIconLabels = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
    const RAD = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const icons = deckIconsMap[payload.deck] || [];
    const size = 24, space = 4;
    const total = icons.length * size + (icons.length - 1) * space;

    return (
      <g>
        {icons.map((url, i) => (
          <image
            key={`${payload.deck}-${i}`}
            href={url}
            x={x - total/2 + i*(size+space)}
            y={y - size/2}
            width={size}
            height={size}
          />
        ))}
      </g>
    );
  };

  // Card wrapper for each chart
  const ChartCard = ({ label, data, name }) => {
    const [selected, setSelected] = useState(null);
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
      const onResize = () => setMobile(window.innerWidth < 768);
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    const outer = mobile ? 120 : 200;

    return (
      <section id={name} className="bg-white rounded-xl shadow p-6 scroll-mt-20">
        <h3 className="text-2xl font-semibold mb-4 font-baloo-2">{label}</h3>
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/3 h-64 md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="deck"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={outer}
                  paddingAngle={2}
                  labelLine={false}
                  label={renderIconLabels}
                  onClick={e => setSelected(e.deck)}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip formatter={v => [v,'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 md:p-12 mt-6 md:mt-0">
            {selected && top3[selected] ? (
              <div className="border rounded-lg p-4">
                <h4 className="text-lg font-medium mb-2">Top 3 for {selected.replace(/\//g,' ')}</h4>
                <ul className="space-y-2">
                  {top3[selected].map(i => (
                    <li key={i.rank} className="flex items-center justify-between">
                      <span className="font-semibold">{i.rank}.</span>
                      <span className="flex-1 mx-2">{i.name}</span>
                      {deckIconsMap[selected]?.[0] && (
                        <a href={i.decklist_link} target="_blank" rel="noopener">
                          <img src={deckIconsMap[selected][0]} alt="icon" className="w-5 h-5" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-gray-400">Click a slice to view details</div>
            )}
          </div>
        </div>
      </section>
    );
  };

  // Scroll helper
  const scrollTo = id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>{`${titleName} Tournament – Stats | MonsterData TCG`}</title>
        <meta name="description" content={`Insights on ${titleName} deck distributions and top finishes.`} />
        <link rel="canonical" href={`https://monsterdata.online/${slug}/`} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-blue-700 font-baloo-2 mt-8 mb-4 text-center md:text-left">General Statistics Overview</h2>
        <p className="text-gray-600 mb-6 text-center">Explore the most played decks and top performers from the {titleName} tournament. Use the navigation below to quickly jump between charts.</p>

        {/* Navbar */}
        <nav className="flex space-x-4 mb-8 bg-blue-600 p-4 rounded shadow-md sticky top-1 z-10 text-right text-white justify-center md:justify-end">
          {[
            { label: 'Top 10 Overall', id: 'overall' },
            { label: 'Top 10 Day 2', id: 'day2' },
            { label: 'All Topcut', id: 'topcut' }
          ].map(link => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="transition font-baloo-2 font-bold cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="space-y-12">
          <ChartCard name="overall" label="Top 10 Overall" data={dataSets.overall} />
          <ChartCard name="day2" label="Top 10 Day 2" data={dataSets.day2} />
          <ChartCard name="topcut" label="All Topcut" data={dataSets.topcut} />
        </div>
      </div>
    </>
  );
}
