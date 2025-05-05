import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Layout from './pages/Layout.jsx';
import TournamentPage from './pages/TournanentPage.jsx';
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <HashRouter>
         <Routes>
           <Route path="/" element={<Layout />}>
             <Route index element={<Home />} />
             <Route path=":tournament" element={<TournamentPage />}>
               <Route path="heatmap" element={<TournamentPage.Heatmap />} />
               <Route path="radarchart" element={<TournamentPage.RadarChart />} />
               <Route path="recommender" element={<TournamentPage.Recommender />} />
               <Route index element={<TournamentPage.GeneralStats />} />
             </Route>
           </Route>
         </Routes>
      </HashRouter>
    </HelmetProvider>
  </StrictMode>
);
