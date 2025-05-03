import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout.jsx'
import TournamentPage from './pages/Tournanentpage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>Bienvenido al Home</div>} />
          <Route path=":tournament" element={<TournamentPage />}>
            <Route path="heatmap" element={<TournamentPage.Heatmap />} />
            <Route path="" element={<TournamentPage.GeneralStats />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
