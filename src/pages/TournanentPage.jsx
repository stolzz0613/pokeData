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

export default function TournamentPage() {
  const { tournament } = useParams();
  const slug = tournament.toLowerCase();
  const [csvText, setCsvText] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
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
  if (!csvText || !summaryData) return <div>Cargando datos…</div>;

  return (
    <div>
      {/* Navbar interna de pestañas */}
      <nav className="flex space-x-4 mb-6 border-b pb-2">
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
          to="analysis"
          className={({ isActive }) =>
            isActive
              ? 'border-b-2 border-blue-500 text-blue-600 pb-1'
              : 'text-gray-600 hover:text-blue-600'
          }
        >
          Análisis
        </NavLink>
      </nav>

      {/* Aquí se renderiza la pestaña activa */}
      <Outlet context={{ csvText, summaryData, slug }} />
    </div>
  );
}

// Subscripción para la pestaña Heatmap
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

TournamentPage.GeneralStats = function GeneralStatsTab() {
  const { slug } = useOutletContext();
  return <GeneralStats slug={slug} />;
};
