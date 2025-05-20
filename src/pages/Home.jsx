import React from 'react';
import logo from '../assets/logo.png';
import { Helmet } from 'react-helmet-async';
import CookieConsent from 'react-cookie-consent';

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
        <section className="flex-grow flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-blue-50 to-white">
          <div className="p-8 rounded-lg max-w-2xl">
            <img src={logo} alt="MonsterData Logo" className="mx-auto h-60 w-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
              Power Your Play with Real Data
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              MonsterData TCG offers advanced deck analytics, meta trends, and customizable alerts so you stay ahead in every Pokémon TCG tournament.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white py-12">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: 'https://img.icons8.com/color/96/000000/combo-chart.png',
                title: 'Deck Analysis',
                text: 'Compare win rates and statistics to discover the best strategies.'
              },
              {
                icon: 'https://img.icons8.com/color/96/000000/pie-chart.png',
                title: 'Interactive Charts',
                text: 'Visualize matchups, popularity, and meta shifts with dynamic graphs.'
              },
              {
                icon: 'https://img.icons8.com/color/96/000000/appointment-reminders.png',
                title: 'Custom Alerts',
                text: 'Get notified about new tournaments and key statistical changes.'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 border rounded-lg shadow-sm hover:shadow-md transition flex flex-col items-center text-center"
              >
                <img src={feature.icon} alt={feature.title} className="mb-4 h-24 w-24" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-3xl text-gray-700 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">What Is MonsterData?</h2>
            <p>
              MonsterData TCG was born from a passion for data-driven play and Pokémon competition. We collect historical tournament data, process thousands of matches, and deliver clear insights to elevate your game.
            </p>
            <p>
              With powerful visual tools and configurable alerts, you'll never miss a meta trend or emerging deck. Empower your strategy with statistics.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-400 py-6">
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
        style={{ background: "#2B373B" }}
        buttonStyle={{ color: "#4e503b", fontSize: "14px" }}
      >
        We use cookies to enhance your browsing experience.{' '}
      </CookieConsent>
    </>
  );
}
