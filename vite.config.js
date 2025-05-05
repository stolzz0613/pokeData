// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import ViteSitemap from 'vite-plugin-sitemap'
import tournaments from './src/data/tournaments.json'

// Construye tus rutas hash-based
const routes = [
  '/#/',  // home
  ...tournaments.flatMap(({ slug }) => [
    `/#/${slug}`,            // GeneralStats
    `/#/${slug}/heatmap`,    // Heatmap
    `/#/${slug}/radarchart`, // RadarChart
    `/#/${slug}/recommender`, // Recommender
  ]),
]

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),

    //  Genera dist/sitemap.xml con todas estas URLs
    ViteSitemap({
      hostname: 'https://monsterdata.online',
      routes,
    }),
  ],

  server: {
    fs: { strict: false },
  },
})
