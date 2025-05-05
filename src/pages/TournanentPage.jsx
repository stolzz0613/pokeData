import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet, useOutletContext } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DeckHeatmap from '../components/DeckHeatMap.jsx';
import GeneralStats from './GeneralStats.jsx';
import DeckRadarChart from '../components/DeckRadarChart.jsx';
import Papa from 'papaparse';

// 1) Use Vite's glob imports to code-split and load data on demand
const csvModules = import.meta.glob('/src/data/*/results.csv', { query: '?raw' });
const analysisModules = import.meta.glob('/src/data/*/analysis.json', { query: '?json' });
const summaryModules = import.meta.glob('/src/data/*/decks_summary.json', { query: '?json' });

export default function TournamentPage() {
  const { tournament } = useParams();
  const slug = tournament.toLowerCase();
  const [csvText, setCsvText] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // SEO metadata
  const pageTitle = `${tournament} – MonsterData`;
  const description = `Statistics, heatmap, and radar charts for the ${tournament} tournament in Pokémon TCG, powered by MonsterData.`;
  const canonicalUrl = `https://monsterdata.online/#/${slug}`;

  useEffect(() => {
    setError(null);
    setCsvText(null);
    setSummaryData(null);
    setAnalysis(null);

    const csvPath = `/src/data/${slug}/results.csv`;
    const analysisPath = `/src/data/${slug}/analysis.json`;
    const summaryPath = `/src/data/${slug}/decks_summary.json`;

    // Load CSV as raw text
    const loadCsv = csvModules[csvPath];
    if (loadCsv) {
      loadCsv()
        .then(raw => setCsvText(raw))
        .catch(err => setError(err.message));
    } else {
      setError('CSV not found');
    }

    // Load analysis JSON
    const loadAnalysis = analysisModules[analysisPath];
    if (loadAnalysis) {
      loadAnalysis()
        .then(data => setAnalysis(data))
        .catch(err => setError(err.message));
    } else {
      setError('Analysis JSON not found');
    }

    // Load decks_summary JSON
    const loadSummary = summaryModules[summaryPath];
    if (loadSummary) {
      loadSummary()
        .then(data => setSummaryData(data))
        .catch(err => setError(err.message));
    } else {
      setError('Summary JSON not found');
    }
  }, [slug]);

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!csvText || !summaryData || !analysis) return <div>Loading data…</div>;

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={`https://monsterdata.online/assets/${slug}-og.png`}
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MonsterDataTCG" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={`https://monsterdata.online/assets/${slug}-og.png`}
        />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "${pageTitle}",
            "url": "${canonicalUrl}"
          }`}
        </script>
      </Helmet>

      <div>
        {/* Internal tab navigation */}
        <nav className="flex justify-center md:justify-start space-x-4 mb-8 border-b pb-4">
          <NavLink
            to=""
            end
            className={({ isActive }) =>
              isActive
                ? 'border-b-2 border-blue-500 text-blue-600 pb-1'
                : 'text-gray-600 hover:text-blue-600'
            }
          >
            General
          </NavLink>
          <NavLink
            to="heatmap"
            className={({ isActive }) =>
              isActive
                ? 'border-b-2 border-blue-500 text-blue-600 pb-1'
                : 'text-gray-600 hover:text-blue-600'
            }
          >
            Heatmap
          </NavLink>
          <NavLink
            to="radarchart"
            className={({ isActive }) =>
              isActive
                ? 'border-b-2 border-blue-500 text-blue-600 pb-1'
                : 'text-gray-600 hover:text-blue-600'
            }
          >
            Radar Chart
          </NavLink>
        </nav>

        {/* Render active tab */}
        <Outlet context={{ csvText, summaryData, slug, analysis }} />
      </div>
    </>
  );
}

// Tab sub-components
TournamentPage.Heatmap = function HeatmapTab() {
  const { csvText, summaryData, slug } = useOutletContext();
  return (
    <DeckHeatmap
      key={slug}
      csvText={csvText}
      summaryData={summaryData}
    />
  );
};

TournamentPage.RadarChart = function RadarChartTab() {
  const { csvText, summaryData, slug, analysis } = useOutletContext();
  return (
    <DeckRadarChart
      key={slug}
      csvText={csvText}
      summaryData={summaryData}
      analysis={analysis}
    />
  );
};

TournamentPage.GeneralStats = function GeneralStatsTab() {
  const { slug } = useOutletContext();
  return <GeneralStats slug={slug} />;
};
