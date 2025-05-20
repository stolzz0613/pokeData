// prerender-all.js
// ──────────────────────────────────
// Este script prerenderiza todas las rutas de tu SPA en carpetas estáticas

// Stub de imports de assets (PNG, CSS, etc.) para Node
require.extensions['.png'] = () => '';
require.extensions['.jpg'] = () => '';
require.extensions['.jpeg'] = () => '';
require.extensions['.svg'] = () => '';
require.extensions['.css'] = () => '';

// Babel register para JSX y ESNext
require('@babel/register')({
  extensions: ['.js', '.jsx'],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-react'
  ]
});

const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { HelmetProvider } = require('react-helmet-async');
const { MemoryRouter, Routes, Route } = require('react-router-dom');

// Importa tus componentes de rutas
const Layout = require('./src/pages/Layout.jsx').default;
const Home = require('./src/pages/Home.jsx').default;
const DeckBuilder = require('./src/pages/DeckBuilder.jsx').default;
const TournamentPage = require('./src/pages/TournanentPage.jsx').default;

// Define tus rutas estáticas
const routeList = [
  '/',
  '/deck-builder',
  '/milwaukee',
  '/milwaukee/heatmap',
  '/milwaukee/radarchart',
  '/milwaukee/recommender',
  '/sevilla',
  '/sevilla/heatmap',
  '/sevilla/radarchart',
  '/sevilla/recommender',
  '/monterrey',
  '/monterrey/heatmap',
  '/monterrey/radarchart',
  '/monterrey/recommender',
  '/atlanta',
  '/atlanta/heatmap',
  '/atlanta/radarchart',
  '/atlanta/recommender',
  '/melbourne',
  '/melbourne/heatmap',
  '/melbourne/radarchart',
  '/melbourne/recommender',
  '/santiago',
  '/santiago/heatmap',
  '/santiago/radarchart',
  '/santiago/recommender',
  '/utrecht',
  '/utrecht/heatmap',
  '/utrecht/radarchart',
  '/utrecht/recommender'
];

async function prerenderAll() {
  const distDir = path.resolve(__dirname, 'dist');
  const templatePath = path.join(distDir, 'index.html');
  const template = await fs.promises.readFile(templatePath, 'utf-8');

  for (const route of routeList) {
    // Contexto para react-helmet-async
    const helmetContext = {};

    // Monta la app con MemoryRouter en la ruta actual
    const app = React.createElement(
      HelmetProvider,
      { context: helmetContext },
      React.createElement(
        MemoryRouter,
        { initialEntries: [route] },
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { path: '/', element: React.createElement(Layout) },
            React.createElement(Route, { index: true, element: React.createElement(Home) }),
            React.createElement(Route, { path: 'deck-builder', element: React.createElement(DeckBuilder) }),
            React.createElement(
              Route,
              { path: ':tournament', element: React.createElement(TournamentPage) },
              React.createElement(Route, { index: true, element: React.createElement(TournamentPage.GeneralStats) }),
              React.createElement(Route, { path: 'heatmap', element: React.createElement(TournamentPage.Heatmap) }),
              React.createElement(Route, { path: 'radarchart', element: React.createElement(TournamentPage.RadarChart) }),
              React.createElement(Route, { path: 'recommender', element: React.createElement(TournamentPage.Recommender) })
            )
          )
        )
      )
    );

    // Renderiza a string
    const rendered = ReactDOMServer.renderToString(app);

    // Inyecta en el template
    const html = template.replace(
      /<div id="root"><\/div>/,
      `<div id="root">${rendered}</div>`
    );

    // Determina carpeta de salida
    const outDir = path.join(distDir, route === '/' ? '' : route);
    await fs.promises.mkdir(outDir, { recursive: true });
    await fs.promises.writeFile(path.join(outDir, 'index.html'), html, 'utf-8');
    console.log(`✅ Prerendered: ${route}`);
  }
}

prerenderAll().catch(err => {
  console.error(err);
  process.exit(1);
});
