import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import tournaments from "../data/tournaments.json";

export default function Sidebar({ isOpen, onClose }) {
  const [showTournaments, setShowTournaments] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          ${isOpen ? "block" : "hidden"}
          fixed inset-y-0 left-0
          w-56 p-4
          bg-gradient-to-b from-blue-600 to-white
          border-r-4 border-blue-800
          shadow-lg z-40
        `}
      >
        <nav>
          <ul className="space-y-4 pt-[80px]">
            {/* Sección General */}
            <li className="px-2 text-xs font-semibold uppercase text-white">
              General
            </li>
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-white hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <span className="mr-2 text-2xl">🏠</span>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/deck-builder"
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-white hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <span className="mr-2 text-2xl">🃏</span>
                Deck Builder
              </NavLink>
            </li>

            {/* Sección Torneos con submenu plegable */}
            <li>
              <button
                onClick={() => setShowTournaments((prev) => !prev)}
                className="w-full flex items-center justify-between p-2 rounded-lg text-white hover:bg-blue-700 transition-colors"
              >
                <span className="flex items-center">
                  <span className="mr-2 text-2xl">🎲</span>
                  Tournaments
                </span>
                <span className="text-xl">
                  {showTournaments ? "▾" : "▸"}
                </span>
              </button>
            </li>
            {showTournaments &&
              tournaments.map(({ slug, name, icon }) => (
                <li key={slug} className="pl-4">
                  <NavLink
                    to={`/${slug}`}
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-white hover:bg-blue-700 hover:text-white"
                      }`
                    }
                  >
                    <span className="mr-2 text-2xl">{icon}</span>
                    {name}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
