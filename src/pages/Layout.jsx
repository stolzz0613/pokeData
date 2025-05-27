// src/layouts/Layout.jsx
import React from 'react'
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen w-full px-0">
      <main className="flex-1 bg-white p-4 overflow-auto relative md:px-[100px]">
        <Outlet />
      </main>
    </div>
  );
}
