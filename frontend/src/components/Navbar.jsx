import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeadphonesIcon, TicketIcon, PlusCircleIcon, LogOutIcon, HelpCircleIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";

export function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { startTour } = useOnboarding();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const navLink = (to, label, Icon) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        pathname === to
          ? "bg-blue-50 text-blue-700"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center gap-2.5 font-semibold text-zinc-900">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <HeadphonesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline">Support CRM</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navLink("/dashboard", "Tickets", TicketIcon)}
            {navLink("/dashboard/new", "New Ticket", PlusCircleIcon)}

            {user && (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-zinc-200">
                <span className="text-sm text-zinc-500 hidden sm:block">
                  {user.name}
                </span>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setTimeout(startTour, 100);
                  }}
                  className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Restart Product Tour"
                >
                  <HelpCircleIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                  title="Logout"
                >
                  <LogOutIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
