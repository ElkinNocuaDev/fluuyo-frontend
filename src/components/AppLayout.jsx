import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import logo from "../assets/fluuyo-logo-web-outlines.svg";
import { LogOut, RefreshCcw } from "lucide-react";

export default function AppLayout({ children }) {
  const nav = useNavigate();
  const { user, logout, refreshMe } = useAuth();

  async function onRefresh() {
    try {
      await refreshMe();
    } catch {
      // opcional: manejar error silencioso
    }
  }

  return (
    <div className="bg-aurora min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 pb-20">

        {/* ===== HEADER ===== */}
        <header className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => nav("/app")}
          >
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center">
              <img
                src={logo}
                alt="Fluuyo"
                className="h-8 w-auto"
                loading="eager"
              />
            </div>

            <div>
              <div className="text-white text-sm font-semibold leading-none">
                Hola, {user?.first_name || "usuario"}
              </div>
              <div className="text-xs text-white/70">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden sm:inline">
                Actualizar
              </span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 inline-flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* ===== CONTENIDO ===== */}
        <main className="mt-6">
          {children}
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="mt-10">
          <div className="card-glass px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white/80 font-semibold">
                Fluuyo • Friendly Finance
              </div>

              <div className="text-xs text-white/60">
                © {new Date().getFullYear()} Fluuyo • Hecho para LatAm
                <span className="text-white/40"> • </span>
                Start Waves LLC
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
