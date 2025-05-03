// src/pages/GeneralStats.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

export default function GeneralStatsChart({ slug }) {
  const [players, setPlayers] = useState(null);
  const [deckIconsMap, setDeckIconsMap] = useState({});
  const [top3, setTop3] = useState({});
  const [error, setError] = useState(null);

  // Cargar standings.json y deckIcons
  useEffect(() => {
    fetch(`/data/${slug}/standings.json`)
      .then(res => {
        if (!res.ok) throw new Error('standings.json no encontrado');
        return res.json();
      })
      .then(data => {
        setPlayers(data.players);
        setDeckIconsMap(data.deckIcons || {});
      })
      .catch(err => setError(err.message));

    // Cargar top3.json
    fetch(`/data/${slug}/top3.json`)
      .then(res => {
        if (!res.ok) throw new Error('top3.json no encontrado');
        return res.json();
      })
      .then(setTop3)
      .catch(err => console.warn(err.message));
  }, [slug]);

  // Agrupa y ordena
  const makeChartData = (statusFilter, topN = Infinity) => {
    if (!players) return [];
    const countMap = {};
    players
      .filter(p => statusFilter == null || p.status === statusFilter)
      .forEach(p => {
        countMap[p.deck] = (countMap[p.deck] || 0) + 1;
      });
    return Object.entries(countMap)
      .map(([deck, count]) => ({ deck, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  };

  const generalData = useMemo(() => makeChartData(null, 10), [players]);
  const day2Data    = useMemo(() => makeChartData('day2', 10), [players]);
  const topcutData  = useMemo(() => makeChartData('topcut'), [players]);

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!players) return <div>Cargando estadísticas…</div>;

  const COLORS = [
    '#8884d8', '#8dd1e1', '#ffc658', '#ff8042',
    '#a4de6c', '#d0ed57', '#82ca9d', '#d0ed57',
    '#ffc0cb', '#8b008b'
  ];

  // Render de iconos dentro de cada slice
  const renderIconLabels = ({
    cx, cy, midAngle, innerRadius, outerRadius, payload
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const icons = deckIconsMap[payload.deck] || [];
    const iconSize = 25;
    const spacing = 6;
    const totalW = icons.length * iconSize + (icons.length - 1) * spacing;

    return (
      <g>
        {icons.map((url, i) => (
          <image
            key={`${payload.deck}-icon-${i}`}
            href={url}
            x={x - totalW / 2 + i * (iconSize + spacing)}
            y={y - iconSize / 2}
            width={iconSize}
            height={iconSize}
          />
        ))}
      </g>
    );
  };

  // Tarjeta de gráfica con interactividad
  const ChartCard = ({ title, data }) => {
    const [selectedDeck, setSelectedDeck] = useState(null);

    return (
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-semibold mb-4">{title}</h3>
        <div className="flex">
          {/* Gráfico */}
          <div className="w-2/3 h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="deck"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={250}
                  paddingAngle={2}
                  labelLine={false}
                  label={renderIconLabels}
                  onClick={entry => setSelectedDeck(entry.deck)}
                >
                  {data.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                      cursor="pointer"
                    />
                  ))}
                </Pie>
                <Tooltip formatter={val => [`${val}`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detalle Top 3 */}
          <div className="w-1/3 pl-6">
            {selectedDeck && top3[selectedDeck] ? (
              <div className="border p-4 rounded-md">
                <h4 className="text-lg font-medium mb-2">
                  Top 3 de {selectedDeck}
                </h4>
                <ul>
                  {top3[selectedDeck].map(item => (
                    <li
                      key={item.rank}
                      className="flex items-center justify-between mb-3"
                    >
                      <span className="font-semibold">{item.rank}.</span>
                      <span className="flex-1 mx-2">{item.name}</span>
                      {/* Icono clicable al deck */}
                      {deckIconsMap[selectedDeck]?.[0] && (
                        <a
                          href={item.decklist_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={deckIconsMap[selectedDeck][0]}
                            alt={selectedDeck}
                            className="w-6 h-6"
                          />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-gray-500">Haz click en una sección…</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-4xl font-bold mb-12">Estadística General</h2>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
        <ChartCard title="Top 10 General" data={generalData} />
        <ChartCard title="Top 10 Día 2" data={day2Data} />
        <ChartCard title="Todos Topcut" data={topcutData} />
      </div>
    </div>
  );
}
