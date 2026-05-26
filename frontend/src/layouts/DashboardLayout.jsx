import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
