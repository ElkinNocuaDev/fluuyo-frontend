import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { routeByRole } from "../../auth/routeByRole";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function AdminDashboard() {
  const { user, booting } = useAuth();

  const [stats, setStats] = useState({
    users: 0,
    credits: 0,
    pendingLoans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && user.role !== "OPERATOR")) return;

    const fetchStats = async () => {
      try {
        const data = await apiFetch("/admin/stats");

        if (!data?.ok) throw new Error("Invalid response");
        setStats(data.stats);
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
    return <Navigate to={routeByRole(user)} replace />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Usuarios"
              value={stats.users}
              subtitle="Usuarios registrados"
            />
            <StatCard
              title="Créditos"
              value={stats.credits}
              subtitle="Créditos activos"
            />
            <StatCard
              title="Préstamos pendientes"
              value={stats.pendingLoans}
              subtitle="Por aprobar"
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- UI ---------- */

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-1 text-xs text-white/50">{subtitle}</div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="mt-3 h-8 w-16 rounded bg-white/10" />
      <div className="mt-2 h-3 w-32 rounded bg-white/10" />
    </div>
  );
}
