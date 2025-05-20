// prerender-home.js
// ────────────────────────────────
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

// Importa tu componente Home
const Home = require('./src/pages/Home.jsx').default;

async function prerender() {
  const distDir = path.resolve(__dirname, 'dist');
  const indexPath = path.join(distDir, 'index.html');
  let html = await fs.promises.readFile(indexPath, 'utf-8');

  // Contexto para react-helmet-async
  const helmetContext = {};

  // Renderiza <Home /> envuelto en HelmetProvider
  const app = React.createElement(
    HelmetProvider,
    { context: helmetContext },
    React.createElement(Home)
  );
  const rendered = ReactDOMServer.renderToString(app);

  // Inyecta el HTML prerenderizado en el div#root
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${rendered}</div>`
  );

  await fs.promises.writeFile(indexPath, html, 'utf-8');
  console.log('✅ Home prerendered!');
}

prerender().catch(err => {
  console.error(err);
  process.exit(1);
});
