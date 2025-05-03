import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts';

// Parse CSV and build decks, matrix, and icons
function computeHeatmapData(csvText, summary) {
  const rows = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
  const deckSet = new Set();
  rows.forEach(({ deck, opponent }) => {
    deckSet.add(deck);
    deckSet.add(opponent);
  });
  const decks = Array.from(deckSet);

  // Map slug -> icons with fallbacks
  const iconMap = decks.reduce((map, slug) => {
    const key = slug.replace(/\//g, '-');
    const icons =
      summary[key]?.icons ||
      summary[`${key}-ex`]?.icons ||
      summary[`${key}-ex-sv`]?.icons || [];
    map[slug] = icons;
    return map;
  }, {});

  // Build stats lookup
  const stats = {};
  decks.forEach(a => decks.forEach(b => (stats[`${a}->${b}`] = 0)));
  rows.forEach(({ deck, opponent, winrate }) => {
    stats[`${deck}->${opponent}`] = parseFloat(winrate) || 0;
  });

  // Build matrix
  const matrix = decks.map(a => decks.map(b => stats[`${a}->${b}`]));
  return { decks, matrix, iconMap };
}

// Interpolate color from red->yellow->green
function getColor(value) {
  const low = [255, 77, 79];
  const mid = [255, 197, 61];
  const high = [115, 209, 61];
  const t = value <= 0.5 ? value / 0.5 : (value - 0.5) / 0.5;
  const [r1, g1, b1] = value <= 0.5 ? low : mid;
  const [r2, g2, b2] = value <= 0.5 ? mid : high;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Axis selector component
function AxisSelector({ label, decks, selected, setSelected, iconMap }) {
  return (
    <div className="flex-1">
      <label className="block mb-2 font-medium">{label}</label>
      <div className="inline-flex gap-2 mb-2 items-center">
        <button
          onClick={() => setSelected(decks)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Select All
        </button>
        <button
          onClick={() => setSelected([])}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        >
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto border rounded p-2">
        {decks.map(d => {
          const icons = iconMap[d] || [];
          return (
            <label key={d} className="inline-flex items-center space-x-2">
              {icons.map((url, idx) => (
                <img key={idx} src={url} alt="" className="h-6 w-6 rounded-full" />
              ))}
              <input
                type="checkbox"
                checked={selected.includes(d)}
                onChange={e => {
                  const checked = e.target.checked;
                  setSelected(prev =>
                    checked ? [...prev, d] : prev.filter(x => x !== d)
                  );
                }}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm truncate">{d.replace(/-/g, ' ')}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function MatchSummaryMatrix({ deckY, best, worst, iconMap }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-gray-100">
      <div className="bg-gray-100 p-2 inline-flex items-center">
        {(iconMap[deckY] || []).map((url, i) => (
          <img key={i} src={url} alt="" className="h-8 w-8 mr-2 rounded-full" />
        ))}
        <h3 className="text-lg font-semibold truncate">
          {deckY.replace(/-/g, ' ')}
        </h3>
      </div>
      <div className="grid grid-cols-3 bg-green-100 p-2">
        {best.map(({ deck, value }) => (
          <div key={deck} className="flex flex-col items-center">
            <div className="flex space-x-1 mb-1">
              {((iconMap[deck] || [])).map((u, i) => (
                <img key={i} src={u} alt="" className="h-6 w-6 rounded-full" />
              ))}
            </div>
            <span className="text-green-800 font-medium">
              {(value * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 bg-red-100 p-2">
        {worst.map(({ deck, value }) => (
          <div key={deck} className="flex flex-col items-center">
            <div className="flex space-x-1 mb-1">
              {((iconMap[deck] || [])).map((u, i) => (
                <img key={i} src={u} alt="" className="h-6 w-6 rounded-full" />
              ))}
            </div>
            <span className="text-red-800 font-medium">
              {(value * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeckHeatmap({ csvText, summaryData }) {
  // 1) calcula decks/matrix/iconMap
  const { decks, matrix, iconMap } = useMemo(
    () => computeHeatmapData(csvText, summaryData),
    [csvText, summaryData]
  );

  // 2) estados iniciales vacíos
  const [xDecks, setXDecks] = useState([]);
  const [yDecks, setYDecks] = useState([]);

  // 3) al cambiar el listado de decks, resetea selecciones
  useEffect(() => {
    setXDecks(decks);
    setYDecks(decks.length > 0 ? [decks[0]] : []);
  }, [decks]);

  // 4) construye indexMap
  const indexMap = useMemo(
    () => decks.reduce((m, d, i) => ({ ...m, [d]: i }), {}),
    [decks]
  );

  // 5) filtra X/Y contra indexMap
  const filteredX = xDecks.filter(d => indexMap[d] !== undefined);
  const filteredY = yDecks.filter(d => indexMap[d] !== undefined);

  // 6) recrea puntos con X/Y filtrados
  const points = useMemo(() => {
    const pts = [];
    filteredY.forEach((deckY, y) => {
      filteredX.forEach((deckX, x) => {
        const value = matrix[indexMap[deckY]][indexMap[deckX]];
        pts.push({ x, y, value, label: value ? `${(value * 100).toFixed(0)}%` : '' });
      });
    });
    return pts;
  }, [filteredX, filteredY, matrix, indexMap]);

  // 7) summary también usa filtrados
  const summary = useMemo(
    () =>
      filteredY.map(deckY => {
        const row = filteredX
          .filter(d => d !== deckY)
          .map(deckX => ({
            deck: deckX,
            value: matrix[indexMap[deckY]][indexMap[deckX]],
          }));
        const sorted = [...row].sort((a, b) => b.value - a.value);
        return {
          deckY,
          best: sorted.slice(0, 3),
          worst: sorted.slice(-3).reverse(),
        };
      }),
    [filteredX, filteredY, matrix, indexMap]
  );

  // 8) márgenes y tamaños (igual que antes)
  const squareSize = 40;
  const halfSize = squareSize / 2;
  const xMaxIcons = Math.max(...filteredX.map(d => (iconMap[d] || []).length), 1);
  const yMaxIcons = Math.max(...filteredY.map(d => (iconMap[d] || []).length), 1);
  const iconSize = 30;
  const spacing = 8;
  const leftMargin = yMaxIcons * (iconSize + spacing) + halfSize + 10;
  const bottomMargin = xMaxIcons * (iconSize + spacing) + halfSize + 10;
  const topMargin = halfSize + 20;
  const rightMargin = halfSize + 20;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Heatmap de Winrates</h2>

      {/* Selectores */}
      <div className="flex gap-4 mb-6">
        <AxisSelector
          label="Eje Y"
          decks={decks}
          selected={yDecks}
          setSelected={setYDecks}
          iconMap={iconMap}
        />
        <AxisSelector
          label="Eje X"
          decks={decks}
          selected={xDecks}
          setSelected={setXDecks}
          iconMap={iconMap}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summary.map(s => (
          <MatchSummaryMatrix key={s.deckY} {...s} iconMap={iconMap} />
        ))}
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={600}>
        <ScatterChart margin={{ top: topMargin, right: rightMargin, bottom: bottomMargin, left: leftMargin }}>
          <XAxis
            type="number"
            dataKey="x"
            domain={[-0.5, filteredX.length - 0.5]}
            ticks={filteredX.map((_, i) => i)}
            interval={0}
            height={bottomMargin}
            tick={({ x, y, payload }) =>
              (iconMap[filteredX[payload.value]] || []).map((url, idx) => (
                <image
                  key={idx}
                  href={url}
                  x={x + idx * (iconSize + spacing) - (((iconMap[filteredX[payload.value]] || []).length * (iconSize + spacing) - spacing) / 2)}
                  y={y + iconSize + spacing}
                  width={iconSize}
                  height={iconSize}
                />
              ))
            }
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-0.5, filteredY.length - 0.5]}
            ticks={filteredY.map((_, i) => i)}
            interval={0}
            width={leftMargin}
            tick={({ x, y, payload }) =>
              (iconMap[filteredY[payload.value]] || []).map((url, idx) => (
                <image
                  key={idx}
                  href={url}
                  x={x - yMaxIcons * (iconSize + spacing) + idx * (iconSize + spacing)}
                  y={y - iconSize - spacing}
                  width={iconSize}
                  height={iconSize}
                />
              ))
            }
          />
          <Scatter
            data={points}
            dataKey="value"
            shape={({ cx, cy, value }) => (
              <rect x={cx - halfSize} y={cy - halfSize} width={squareSize} height={squareSize} fill={getColor(value)} />
            )}
          >
            <LabelList dataKey="label" position="inside" style={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} />
          </Scatter>
          <Tooltip formatter={val => `${(val * 100).toFixed(1)}%`} cursor={{ strokeDasharray: '3 3' }} wrapperStyle={{ outline: 'none' }} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}