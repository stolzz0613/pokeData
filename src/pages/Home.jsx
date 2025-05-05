import React from 'react';
import { Helmet } from 'react-helmet-async';
import logo from '../assets/logo.svg';

export default function Home() {
  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <html lang="en" />
        <title>MonsterData – Pokémon TCG Deck Analytics</title>
        <meta
          name="description"
          content="MonsterData provides detailed deck performance analysis and interactive charts for Pokémon TCG players."
        />
        <link rel="canonical" href="https://monsterdata.online/" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="MonsterData – Pokémon TCG Deck Analytics"
        />
        <meta
          property="og:description"
          content="Discover top Pokémon TCG deck strategies with win-rate comparisons and trend visualizations."
        />
        <meta property="og:url" content="https://monsterdata.online/" />
        <meta
          property="og:image"
          content="https://monsterdata.online/assets/og-image.png"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MonsterDataTCG" />
        <meta
          name="twitter:title"
          content="MonsterData – Pokémon TCG Deck Analytics"
        />
        <meta
          name="twitter:description"
          content="Interactive deck analytics and custom alerts for Pokémon TCG tournaments."
        />
        <meta
          name="twitter:image"
          content="https://monsterdata.online/assets/og-image.png"
        />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "MonsterData",
            "url": "https://monsterdata.online/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://monsterdata.online/?s={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }`}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section
          className="flex-grow flex flex-col items-center justify-center text-center px-4"
        >
          <div className="p-8 rounded-lg max-w-xl text-center">
            {/* Logo */}
            <img
              src={logo}
              alt="MonsterData Logo"
              className="mx-auto h-80 w-auto"
              loading="lazy"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Discover the Power of Data in Pokémon TCG
            </h1>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-2">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
              <img
                src="https://img.icons8.com/color/96/000000/combo-chart.png"
                alt="Deck Analysis"
                className="mb-4 h-24 w-24"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Deck Analysis</h3>
              <p className="text-gray-600">
                Compare win rates and statistics for each deck to identify the best
                strategies.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
              <img
                src="https://img.icons8.com/color/96/000000/pie-chart.png"
                alt="Dynamic Visualization"
                className="mb-4 h-24 w-24"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Dynamic Visualization</h3>
              <p className="text-gray-600">
                Interactive charts showing matchup performance, popularity, and trends.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center">
              <img
                src="https://img.icons8.com/color/96/000000/appointment-reminders.png"
                alt="Custom Alerts"
                className="mb-4 h-24 w-24"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Custom Alerts</h3>
              <p className="text-gray-600">
                Receive notifications for new tournaments and significant shifts in
                statistics.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-400 py-6">
          <div className="container mx-auto text-center">
            <p>© {new Date().getFullYear()} MonsterData. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
