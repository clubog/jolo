import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            BDP
          </div>
          <span className="font-bold text-lg text-text">Berlin Day Planner</span>
        </Link>

        {!isAdmin && (
          <Link
            to="/admin"
            className="text-xs text-text-light hover:text-text no-underline"
          >
            Admin
          </Link>
        )}
      </div>
    </header>
  );
}
