// src/components/DeckRecommender.jsx
import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';

// Component: recommends a deck based on winrates against multiple opponents
export default function DeckRecommender({ csvText, summaryData }) {
  const [selectedOpponents, setSelectedOpponents] = useState([]);

  // Map summaryData keys (remove suffixes) to original keys
  const normalizedMap = useMemo(() => {
    const map = {};
    const suffixes = ['-ex-sv', '-ex'];
    Object.keys(summaryData).forEach(key => {
      let base = key;
      suffixes.forEach(suff => {
        if (base.endsWith(suff)) {
          base = base.slice(0, -suff.length);
        }
      });
      map[base] = key;
    });
    return map;
  }, [summaryData]);

  // Parse CSV, normalize to summaryData keys
  const rows = useMemo(() => {
    if (!csvText) return [];
    return Papa.parse(csvText, { header: true, skipEmptyLines: true })
      .data.map(r => {
        const deckRaw = r.deck.replace(/\//g, '-');
        const oppRaw = r.opponent.replace(/\//g, '-');
        const deckKey = normalizedMap[deckRaw] || deckRaw;
        const oppKey = normalizedMap[oppRaw] || oppRaw;
        return {
          deck: deckKey,
          opponent: oppKey,
          winrate: r.winrate === '' ? null : parseFloat(r.winrate)
        };
      });
  }, [csvText, normalizedMap]);

  // Top 10 most popular decks (summaryData)
  const deckOptions = useMemo(() => {
    return Object.entries(summaryData)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([slug]) => slug);
  }, [summaryData]);

  // Toggle opponent selection
  const toggleOpponent = slug => {
    setSelectedOpponents(prev =>
      prev.includes(slug) ? prev.filter(d => d !== slug) : [...prev, slug]
    );
  };

  // Recommendation logic: highest average winrate against selected opponents
  const recommendation = useMemo(() => {
    if (selectedOpponents.length === 0) return null;
    let best = null;
    deckOptions.forEach(deck => {
      if (selectedOpponents.includes(deck)) return;
      const wrs = selectedOpponents.map(op => {
        const match = rows.find(r => r.deck === deck && r.opponent === op);
        return match && match.winrate != null ? match.winrate : null;
      }).filter(x => x != null);
      if (wrs.length === 0) return;
      const avg = wrs.reduce((a, b) => a + b, 0) / wrs.length;
      if (!best || avg > best.avg) best = { deck, avg };
    });
    return best;
  }, [selectedOpponents, deckOptions, rows]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Deck Recommendation</h2>
      <p className="mb-2">Select one or more decks as opponents:</p>

      {/* Deselect All button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setSelectedOpponents([])}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Deselect All
        </button>
      </div>

      {/* Selector: top 10 decks with icons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 max-h-64 overflow-y-auto">
        {deckOptions.map(slug => {
          const selected = selectedOpponents.includes(slug);
          const { icons = [], count } = summaryData[slug] || {};
          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggleOpponent(slug)}
              className={
                `flex items-center p-2 border rounded transition truncate ` +
                (selected
                  ? 'bg-blue-200 border-blue-400'
                  : 'bg-white border-gray-300 hover:bg-gray-100')
              }
            >
              {icons.map((url, i) => (
                <img
                  key={`${slug}-icon-${i}`}
                  src={url}
                  alt={slug}
                  className="w-5 h-5 mr-1"
                />
              ))}
              <span className="truncate">{slug}</span>
              <span className="ml-auto text-xs text-gray-500">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Recommendation result */}
      {recommendation ? (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h3 className="text-xl font-semibold">We recommend:</h3>
          <div className="flex items-center mt-2">
            {summaryData[recommendation.deck]?.icons.map((url, i) => (
              <img
                key={`${recommendation.deck}-rec-icon-${i}`}
                src={url}
                alt={recommendation.deck}
                className="w-8 h-8 mr-2"
              />
            ))}
            <span className="text-lg font-medium">{recommendation.deck}</span>
            <span className="ml-auto font-semibold">
              Average winrate: {(recommendation.avg * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      ) : (
        selectedOpponents.length > 0 && (
          <div className="mt-4 text-gray-600">
            Not enough data to recommend a deck.
          </div>
        )
      )}
    </div>
  );
}
