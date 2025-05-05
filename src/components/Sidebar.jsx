import { NavLink } from "react-router-dom";
import tournaments from "../data/tournaments.json";

export default function Sidebar({ isOpen }) {
  return (
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
          {tournaments.map(({ slug, name, icon }) => (
            <li key={slug}>
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
  );
}
