// src/pages/TournamentPage.jsx
import React, { useState, useEffect } from 'react';
import {
  useParams,
  NavLink,
  Outlet,
  useOutletContext
} from 'react-router-dom';
import DeckHeatmap from '../components/DeckHeatMap.jsx';
import GeneralStats from './GeneralStats.jsx';
import DeckRadarChart from '../components/DeckRadarChart.jsx';

export default function TournamentPage() {
  const { tournament } = useParams();
  const slug = tournament.toLowerCase();
  const [csvText, setCsvText] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);

    // cargar CSV
    fetch(`data/${slug}/results.csv`)
      .then(res => {
        if (!res.ok) throw new Error('CSV no encontrado');
        return res.text();
      })
      .then(setCsvText)
      .catch(e => setError(e.message));
    
    fetch(`data/${slug}/analysis.json`)
      .then(res => {
        if (!res.ok) throw new Error('Analisis no encontrado');
        return res.json();
      })
      .then(setAnalysis)
      .catch(e => setError(e.message));

    // cargar JSON
    fetch(`data/${slug}/decks_summary.json`)
      .then(res => {
        if (!res.ok) throw new Error('JSON no encontrado');
        return res.json();
      })
      .then(setSummaryData)
      .catch(e => setError(e.message));
  }, [slug]);

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!csvText || !summaryData || !analysis) return <div>Cargando datos…</div>;

  return (
    <div>
      {/* Navbar interna de pestañas */}
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

      {/* Aquí se renderiza la pestaña activa */}
      <Outlet context={{ csvText, summaryData, slug, analysis }} />
    </div>
  );
}

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
