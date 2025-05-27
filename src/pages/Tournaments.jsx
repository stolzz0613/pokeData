import React from 'react';
import tournaments from '../../src/data/tournaments.json';

export default function Tournaments() {
  const getBadgeUrl = (type) =>
    type === 'Regional'
      ? 'https://limitless3.nyc3.cdn.digitaloceanspaces.com/web/tournaments/regional.png'
      : 'https://limitless3.nyc3.cdn.digitaloceanspaces.com/web/tournaments/special.png';

  return (
    <><header className="flex shadow p-4 px-4 md:px-12 mb-6 justify-between" style={{ backgroundColor: '#0065B0' }}>
      <h2 className="text-2xl text-white font-bungee">
        Tournaments
      </h2>
      <a href='' className="text-2xl text-white font-bungee cursor-pointer"> Home</a>
    </header>
      <section className="p-12 md:p-4 rounded-lg">
        <p
          className="text-3xl font-semibold mb-6 font-baloo-2"
          style={{ color: '#083E5C' }}
        >
          Get ready to compete like a pro.
        </p>
        <div className="p-0 md:p-24 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tournaments.map((tournament) => (
            <a
              key={tournament.slug}
              href={`/${tournament.slug}`}
              className="flex flex-col items-center bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
            >
              <img
                src={getBadgeUrl(tournament.type)}
                alt={`${tournament.type} badge`}
                className="w-12 h-12 mb-2" />
              <span className="mt-1 text-sm md:text-xl font-bungee">{tournament.name}</span>
            </a>
          ))}
        </div>
      </section></>
  );
}
