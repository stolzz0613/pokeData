import React from 'react';
import logo from '../assets/logo.svg';
import { Helmet } from 'react-helmet-async';

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Helmet>
        <title>MonsterData TCG - Home</title>
        <meta
          name="description"
          content="Discover the power of data in Pokémon TCG: deck analysis, dynamic visualization, and custom alerts with MonsterData."
        />
        <meta property="og:title" content="MonsterData TCG - Home" />
        <meta
          property="og:description"
          content="Explore detailed statistics, interactive charts, and real-time alerts for your favorite decks."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://monsterdata.online/" />
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
            />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Discover the Power of data in Pokémon TCG
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
            <p>&copy; {currentYear} MonsterData. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
