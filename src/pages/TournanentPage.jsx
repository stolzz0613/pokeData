import React, { useState, useEffect } from 'react'
import { useParams, NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import DeckHeatmap from '../components/DeckHeatMap.jsx'
import GeneralStats from './GeneralStats.jsx'
import DeckRadarChart from '../components/DeckRadarChart.jsx'
import DeckRecommender from '../components/DeckRecommender.jsx'

export default function TournamentPage() {
  const { tournament } = useParams()
  const slug = tournament.toLowerCase()
  const [csvText, setCsvText] = useState(null)
  const [summaryData, setSummaryData] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)

    // cargar CSV
    fetch(`data/${slug}/results.csv`)
      .then(res => {
        if (!res.ok) throw new Error('CSV no encontrado')
        return res.text()
      })
      .then(setCsvText)
      .catch(e => setError(e.message))
    
    fetch(`data/${slug}/analysis.json`)
      .then(res => {
        if (!res.ok) throw new Error('Análisis no encontrado')
        return res.json()
      })
      .then(setAnalysis)
      .catch(e => setError(e.message))

    // cargar JSON
    fetch(`data/${slug}/decks_summary.json`)
      .then(res => {
        if (!res.ok) throw new Error('JSON no encontrado')
        return res.json()
      })
      .then(setSummaryData)
      .catch(e => setError(e.message))
  }, [slug])

  if (error) return <div className="text-red-600">Error: {error}</div>
  if (!csvText || !summaryData || !analysis) return <div>Cargando datos…</div>

  // Nombre capitalizado para el título
  const titleName = tournament.charAt(0).toUpperCase() + tournament.slice(1)

  return (
    <div>
      <Helmet>
        <title>{`${titleName} Tournament Stats | MonsterData TCG`}</title>
        <meta
          name="description"
          content={`Explore matchup statistics, heatmaps, and radar charts for the ${titleName} tournament on MonsterData TCG.`}
        />
        <meta property="og:title" content={`${titleName} Tournament Stats`} />
        <meta
          property="og:description"
          content={`Dive into detailed analytics for the ${titleName} tournament matchups and decks.`}
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://monsterdata.online/${slug}`} />
      </Helmet>

      {/* Header de la página */}
      <header className="flex shadow p-4 px-12 mb-6 justify-between" style={{ backgroundColor: '#0065B0'}}>
        <h2 className="text-2xl text-white font-bungee">
          {titleName}
        </h2>
        <a href='' className="text-2xl text-white font-bungee cursor-pointer"> Home</a>
      </header>

      <div className='px-4 md:px-24'>
        {/* Navbar interna de pestañas */}
        <nav className="d-flex items-center pl-0 md:pl-[60px] text-[12px] flex justify-center md:justify-end space-x-8 mb-8 pb-4 font-bungee">
          <NavLink
            to=""
            end
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 pb-1'
                : 'text-gray-600 hover:text-blue-600'
            }
          >
            General
          </NavLink>
          <NavLink
            to="heatmap"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 pb-1'
                : 'text-gray-600 hover:text-blue-600'
            }
          >
            Heatmap
          </NavLink>
          <NavLink
            to="radarchart"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 pb-1'
                : 'text-gray-600 hover:text-blue-600'
            }
          >
            Radar Chart
          </NavLink>
          <NavLink
            to="recommender"
            className={({ isActive }) =>
              isActive
                ? 'text-blue-600 pb-1'
                : 'text-gray-600 hover:text-blue-600'
            }
          >
            Deck Recommender
          </NavLink>
        </nav>

        {/* Aquí se renderiza la pestaña activa */}
        <Outlet context={{ csvText, summaryData, slug, analysis }} />
      </div>
    </div>
  )
}

// Sub-tabs
TournamentPage.Heatmap = function HeatmapTab() {
  const { csvText, summaryData, slug } = useOutletContext()
  return <DeckHeatmap key={slug} csvText={csvText} summaryData={summaryData} />
}

TournamentPage.RadarChart = function RadarChartTab() {
  const { csvText, summaryData, slug, analysis } = useOutletContext()
  return (
    <DeckRadarChart key={slug} csvText={csvText} summaryData={summaryData} analysis={analysis} />
  )
}

TournamentPage.Recommender = function RecommenderTab() {
  const { csvText, summaryData, slug, analysis } = useOutletContext()
  return (
    <DeckRecommender key={slug} csvText={csvText} summaryData={summaryData} analysis={analysis} />
  )
}

TournamentPage.GeneralStats = function GeneralStatsTab() {
  const { slug } = useOutletContext()
  return <GeneralStats slug={slug} />
}
