// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import ViteSitemap from 'vite-plugin-sitemap'
import tournaments from './src/data/tournaments.json'

const routes = [
  '/',
  ...tournaments.flatMap(({ slug }) => [
    `/${slug}`,
    `/${slug}/heatmap`,
    `/${slug}/radarchart`,
    `/${slug}/recommender`,
  ]),
]

export default defineConfig({
  base: '/',
  build: { outDir: 'dist' },
  plugins: [
    react(),
    tailwindcss(),
    ViteSitemap({ hostname: 'https://monsterdata.online', routes }),
  ],
  server: { fs: { strict: false } },
})
