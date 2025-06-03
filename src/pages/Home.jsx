import React from 'react';
import { Helmet } from 'react-helmet-async';
import CookieConsent from 'react-cookie-consent';
import { NavLink } from 'react-router-dom';

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Helmet>
        <title>MonsterData TCG - Home</title>
        <meta
          name="description"
          content="MonsterData TCG empowers your play with deck statistics, interactive visualizations, and custom alerts."
        />
        <meta property="og:title" content="MonsterData TCG - Home" />
        <meta
          property="og:description"
          content="Explore detailed stats, interactive charts, and receive real-time notifications for Pokémon TCG decks."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://monsterdata.online/" />
      </Helmet>

      {/* Navbar */}
      <header className="bg-white shadow">

      </header>

      <div className="min-h-screen flex flex-col">

        {/* Hero Section */}
        <section className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <div className="p-8 rounded-lg max-w-3xl">
            <img
              src={'/logo.svg'}
              alt="MonsterData Logo"
              className="mx-auto h-60 w-auto mb-6"
              decoding="async"
            />
              <noscript>
              <h1 className="text-3xl font-bold text-center">MonsterData</h1>
            </noscript>
            <p className="text-2xl md:text-4xl font-bold mb-4" style={{ color: '#005B9E' }}>
              Play Smart. Win with Data.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed font-bold text-m" style={{ color: '#00273A' }}>
              MonsterData TCG gives you access to advanced deck stats, meta trends, and custom alerts so you always play with an edge in every Pokémon TCG tournament.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl">
            {[
              {
                icon: './assets/deck.webp',
                title: 'Deck Builder',
                text: 'Upload your deck and get instant insights',
                link: '/deck-builder'
              },
              {
                icon: './assets/stats.webp',
                title: 'Tournaments Charts',
                text: 'Compare win rates and statistics to discover the best strategies.',
                link: '/tournaments'
              }
            ].map((feature, idx) => (
              <NavLink to={feature.link} className="no-underline" key={idx}>
                <div
                  key={idx}
                  className="p-6 border rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center"
                >
                  <img src={feature.icon} alt={feature.title} className="mb-4 h-24" />
                  <p className="text-3xl font-semibold text-gray-800 mb-2 font-baloo-2">{feature.title}</p>
                  <p className="text-gray-600 font-bold text-md" style={{ color: '#00273A' }}>{feature.text}</p>
                </div>
              </NavLink>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-gray-400 py-6">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <p className="mb-2 md:mb-0">&copy; {currentYear} MonsterData. All rights reserved.</p>
            <a
              href="/privacy"
              className="text-sm text-gray-300 hover:text-white transition"
            >
              Privacy Policy
            </a>
          </div>
        </footer>
      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent
        buttonText="Accept"
        cookieName="monsterDataConsent"
        buttonStyle={{ color: "#4e503b", fontSize: "14px" }}
      >
        We use cookies to enhance your browsing experience.{' '}
      </CookieConsent>
    </>
  );
}
