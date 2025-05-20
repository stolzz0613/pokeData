import React, { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Papa from "papaparse";

// Helper: build list of unique decks and icon map from summaryData
function buildDecksAndIcons(rows, summary) {
  const deckSet = new Set();
  rows.forEach(({ deck }) => deckSet.add(deck));
  const decks = Array.from(deckSet);

  const iconMap = {};
  decks.forEach((slug) => {
    const key = slug.replace(/\//g, "-");
    const icons =
      summary[key]?.icons ||
      summary[`${key}-ex`]?.icons ||
      summary[`${key}-ex-sv`]?.icons ||
      [];
    iconMap[slug] = icons;
  });

  return { decks, iconMap };
}

// Helper: for a selected deck, compute average winrate vs each opponent
function computeOpponentsData(rows, selectedDeck) {
  const wins = {};
  const counts = {};
  rows.forEach(({ deck, opponent, winrate }) => {
    if (deck !== selectedDeck) return;
    const rate = parseFloat(winrate);
    if (isNaN(rate)) return;
    wins[opponent] = (wins[opponent] || 0) + rate;
    counts[opponent] = (counts[opponent] || 0) + 1;
  });
  return Object.keys(wins).map((op) => ({
    deck: op,
    winrate: (wins[op] / counts[op]) * 100,
  }));
}

export default function DeckRadarChart({ csvText, summaryData, analysis }) {
  // language state
  const [lang, setLang] = useState("en");

  // parse rows once
  const rows = useMemo(
    () => Papa.parse(csvText, { header: true, skipEmptyLines: true }).data,
    [csvText]
  );

  // build deck list and icons
  const { decks, iconMap } = useMemo(
    () => buildDecksAndIcons(rows, summaryData),
    [rows, summaryData]
  );

  // selected decks state
  const [deckA, setDeckA] = useState(decks[0] || "");
  const [deckB, setDeckB] = useState(decks[1] || "");

  // data for each deck
  const dataA = useMemo(() => computeOpponentsData(rows, deckA), [rows, deckA]);
  const dataB = useMemo(() => computeOpponentsData(rows, deckB), [rows, deckB]);

  // merge opponents into one dataset
  const mergedData = useMemo(() => {
    const opponents = Array.from(
      new Set([...dataA.map((d) => d.deck), ...dataB.map((d) => d.deck)])
    );
    return opponents.map((op) => ({
      deck: op,
      winrateA: dataA.find((d) => d.deck === op)?.winrate || 0,
      winrateB: dataB.find((d) => d.deck === op)?.winrate || 0,
      icons: iconMap[op] || [],
    }));
  }, [dataA, dataB, iconMap]);

  // render icons as axis labels
  const renderTick = ({ payload, x, y }) => {
    const slug = payload.value;
    const icons = iconMap[slug] || [];
    const totalWidth = icons.length * 24;
    const startX = x - totalWidth / 2;
    return icons.map((url, i) => (
      <image
        key={i}
        href={url}
        x={startX + i * 24}
        y={y - 12}
        width={24}
        height={24}
      />
    ));
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Header with English title & explanation */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Pokémon TCG Deck Comparison Radar
        </h1>
        <p className="mt-2 max-w-xl mx-auto text-gray-600">
          Visually compare average win-rates of two selected decks against all
          opponents. Switch between English and Español for tailored insights.
        </p>
      </header>

      {/* Language switch */}
      <div className="flex items-center justify-center mb-6 space-x-2">
        <label className="font-medium text-gray-700">Language:</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      {/* Deck selectors */}
      <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-8 space-y-4 mb-6">
        {/* Selector Deck A */}
        <div className="flex items-center space-x-2">
          {deckA &&
            iconMap[deckA]?.map((url, i) => (
              <img
                key={`iconA-${i}`}
                src={url}
                alt={deckA}
                className="h-6 w-6 rounded-full"
              />
            ))}
          <select
            value={deckA}
            onChange={(e) => setDeckA(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            {decks.map((slug) => (
              <option key={slug} value={slug}>
                {slug.replace(/\//g, " ")}
              </option>
            ))}
          </select>
        </div>
        {/* Selector Deck B */}
        <div className="flex items-center space-x-2">
          {deckB &&
            iconMap[deckB]?.map((url, i) => (
              <img
                key={`iconB-${i}`}
                src={url}
                alt={deckB}
                className="h-6 w-6 rounded-full"
              />
            ))}
          <select
            value={deckB}
            onChange={(e) => setDeckB(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            {decks.map((slug) => (
              <option key={slug} value={slug}>
                {slug.replace(/\//g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Radar chart comparing both */}
      <div className="w-full h-96">
        <ResponsiveContainer>
          <RadarChart
            outerRadius="80%"
            data={mergedData}
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="deck" tick={renderTick} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} />
            <Legend verticalAlign="top" height={36} />
            <Radar
              name={deckA.replace(/\//g, " ")}
              dataKey="winrateA"
              stroke="#00C49F"
              fill="#00C49F"
              fillOpacity={0.4}
            />
            <Radar
              name={deckB.replace(/\//g, " ")}
              dataKey="winrateB"
              stroke="#FF8042"
              fill="#FF8042"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis texts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 text-gray-800">
        {deckA && analysis?.[deckA]?.[lang] && (
          <div className="p-4 bg-gray-100 rounded">
            <h4 className="font-semibold mb-2">
              Analysis for {deckA.replace(/\//g, " ")}
            </h4>
            <div>{analysis[deckA][lang]}</div>
          </div>
        )}
        {deckB && analysis?.[deckB]?.[lang] && (
          <div className="p-4 bg-gray-100 rounded">
            <h4 className="font-semibold mb-2">
              Analysis for {deckB.replace(/\//g, " ")}
            </h4>
            <div>{analysis[deckB][lang]}</div>
          </div>
        )}
      </div>
    </div>
  );
}
