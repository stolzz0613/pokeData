import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout.jsx'
import TournamentPage from './pages/Tournanentpage.jsx'
import Home from './pages/Home.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path=":tournament" element={<TournamentPage />}>
            <Route path="heatmap" element={<TournamentPage.Heatmap />} />
            <Route path="radarchart" element={<TournamentPage.RadarChart />} />
            <Route path="" element={<TournamentPage.GeneralStats />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
