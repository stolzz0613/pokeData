import React, { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Cell,
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

  // selected deck state
  const [selectedDeck, setSelectedDeck] = useState(decks[0] || "");

  // data for radar: vs opponents
  const radarData = useMemo(
    () => computeOpponentsData(rows, selectedDeck),
    [rows, selectedDeck]
  );

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
    <div className="p-4 bg-white rounded-lg shadow flex flex-col">
      {/* Language switch */}
      <div className="mb-4 flex items-center space-x-2">
        <label className="font-medium">Language:</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="px-2 py-1 border rounded"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      {/* Deck selector */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select your deck:</label>
        <div className="inline-flex items-center space-x-2">
          {selectedDeck &&
            (iconMap[selectedDeck] || []).map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="h-6 w-6 rounded-full"
              />
            ))}
          <select
            value={selectedDeck}
            onChange={(e) => setSelectedDeck(e.target.value)}
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

      {/* Radar chart */}
      <div style={{ width: "100%", height: 500 }}>
        <ResponsiveContainer>
          <RadarChart
            outerRadius="80%"
            data={radarData}
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="deck" tick={renderTick} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} />
            <Radar name="Winrate" dataKey="winrate" fillOpacity={0.6}>
              {radarData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.winrate >= 50 ? "#00C49F" : "#FF8042"}
                />
              ))}
            </Radar>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis text */}
      {selectedDeck && (
        <div className="mt-4 p-4 bg-gray-100 text-sm text-gray-800 rounded">
          {analysis?.[selectedDeck]?.[lang]}
        </div>
      )}
    </div>
  );
}
