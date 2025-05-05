// src/layouts/Layout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full px-0">
      <Sidebar isOpen={isSidebarOpen} />

      <main className="flex-1 bg-white p-4 overflow-auto relative md:px-[100px]">
        {/* Poké Ball Toggle Button */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="
            fixed top-4 left-4 z-50
            w-10 h-10 p-0
            flex items-center justify-center
            bg-transparent
            focus:outline-none
          "
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <div className="relative w-10 h-10">
            {/* Mitad superior roja */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-red-500 border border-black rounded-t-full"></div>
            {/* Mitad inferior blanca */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white border-l border-r border-b border-black rounded-b-full"></div>
            {/* Centro negro-blanco */}
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white border-2 border-black rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            {/* Flecha */}
            <span
              className={`
                absolute top-1/2 left-1/2 text-xs font-bold text-black
                transform -translate-x-1/2 -translate-y-1/2
                ${isSidebarOpen ? "rotate-180" : ""}
              `}
            >
              ▶
            </span>
          </div>
        </button>

        <Outlet />
      </main>
    </div>
  );
}
