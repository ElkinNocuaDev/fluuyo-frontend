// src/auth/Guards.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { routeByRole } from "./routeByRole";

function FullscreenLoader() {
  return (
    <div className="min-h-screen bg-slate-950 grid place-items-center">
      <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthed, booting } = useAuth();
  if (booting) return <FullscreenLoader />;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

export function PublicOnly({ children }) {
  const { isAuthed, booting, user } = useAuth();
  if (booting) return <FullscreenLoader />;

  // Hardening: si hay sesión pero aún no hay user por timing, manda a /app (o refresca en App)
  if (isAuthed && !user) return <Navigate to="/app" replace />;

  if (isAuthed) return <Navigate to={routeByRole(user)} replace />;
  return children;
}
