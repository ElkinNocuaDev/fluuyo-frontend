import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useEffect, useState } from "react";
import logo from '../assets/fluuyo-logo-web-outlines.svg';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  /* ---------------- Sidebar ---------------- */
  const [collapsed, setCollapsed] = useState(false);

  /* ---------------- Theme ---------------- */
  const [theme, setTheme] = useState(
    () => localStorage.getItem("admin-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("admin-theme", theme);
  }, [theme]);

  /* ---------------- Breadcrumbs ---------------- */
  const breadcrumbs = location.pathname
    .replace("/admin", "")
    .split("/")
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-aurora text-white">
      <div className="flex min-h-screen">

        {/* ================= Sidebar ================= */}
        <aside
          className={`hidden md:flex flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <img src={logo} alt="Fluuyo" className="h-10 w-auto" />
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-lg font-extrabold">Fluuyo</div>
                <div className="text-xs text-slate-300">
                  Admin Dashboard
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-2 text-sm">
            {[
              ["Dashboard", "/admin/dashboard"],
              ["Usuarios", "/admin/users"],
              ["KYC", "/admin/kyc"],
              ["Créditos", "/admin/credits"],
              ["Pagos", "/admin/loans"],
            ].map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                className="block rounded-xl px-4 py-2 hover:bg-white/10"
              >
                {collapsed ? label[0] : label}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/10">
            {!collapsed && (
              <div className="text-xs text-white/60 mb-2">
                {user?.email}
              </div>
            )}
            <button
              onClick={logout}
              className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              {collapsed ? "⎋" : "Cerrar sesión"}
            </button>
          </div>
        </aside>

        {/* ================= Main ================= */}
        <main className="flex-1 p-6 flex flex-col">

          {/* ---------- Header ---------- */}
          <header className="mb-4 flex items-center justify-between">
            {/* Breadcrumbs */}
            <nav className="text-sm text-white/60">
              <span className="hover:text-white">Admin</span>
              {breadcrumbs.map((b, i) => (
                <span key={i}>
                  {" / "}
                  <span className="capitalize hover:text-white">
                    {b}
                  </span>
                </span>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
              >
                {collapsed ? "➡" : "⬅"}
              </button>

              <button
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
              >
                {theme === "dark" ? "🌙" : "☀️"}
              </button>
            </div>
          </header>

          {/* ---------- Content ---------- */}
          <div className="mx-auto max-w-6xl flex-1 w-full">
            <div className="card-glass p-6 min-h-full">
              <Outlet />
            </div>
          </div>

          {/* ---------- Footer ---------- */}
          <footer className="mt-6 border-t border-white/10 pt-4 text-xs text-white/50 flex justify-between">
            <span>
              © {new Date().getFullYear()} Fluuyo · Start Waves LLC
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Admin v1.0.0
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
