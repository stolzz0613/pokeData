import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { HashRouter, Routes, Route, BrowserRouter } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Layout from './pages/Layout.jsx';
import TournamentPage from './pages/TournanentPage.jsx';
import DeckBuilder from './pages/DeckBuilder.jsx';
import { HelmetProvider } from 'react-helmet-async';
import Privacy from './pages/Privacy.jsx';
import Tournaments from './pages/Tournaments.jsx';
import CardScanner from './pages/CardScanner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Layout />}>
            <Route path="privacy" element={<Privacy />} />
            <Route index element={<Home />} />
            <Route path='deck-builder' element={<DeckBuilder />} />
            <Route path='tournaments' element={<Tournaments />} />
            <Route path='scanner' element={<CardScanner />} />
            <Route path=":tournament" element={<TournamentPage />}>
              <Route path="heatmap" element={<TournamentPage.Heatmap />} />
              <Route path="radarchart" element={<TournamentPage.RadarChart />} />
              <Route path="recommender" element={<TournamentPage.Recommender />} />
              <Route index element={<TournamentPage.GeneralStats />} />
            </Route>
           </Route>
         </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
