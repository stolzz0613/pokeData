import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  const location = useLocation();
  const pathName = location.pathname
    .split("/")
    .filter(Boolean)
    .join(" / ") || "Home";

  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 bg-white p-4 overflow-auto">
        <h1 className="text-2xl font-semibold mb-4 capitalize">
          {pathName}
        </h1>
        <Outlet />
      </main>
    </div>
  );
}
