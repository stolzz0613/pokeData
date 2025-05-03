import { NavLink } from "react-router-dom";
import tournaments from "../data/tournaments.json";

export default function Sidebar() {
  return (
    <aside className="w-56 p-4 bg-gradient-to-b from-red-600 to-white border-r-4 border-black shadow-lg">
      <nav>
        <ul className="space-y-4">
          {/* Link fijo a Home */}
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-yellow-300 text-black"
                    : "text-white hover:bg-yellow-200 hover:text-black"
                }`
              }
            >
              <span className="mr-2 text-2xl">🏠</span>
              Home
            </NavLink>
          </li>

          {/* Links dinámicos desde el JSON */}
          {tournaments.map(({ slug, name, icon }) => (
            <li key={slug}>
              <NavLink
                to={`/${slug}`}
                className={({ isActive }) =>
                  `flex items-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-yellow-300 text-black"
                      : "text-white hover:bg-yellow-200 hover:text-black"
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
