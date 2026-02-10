import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function CreditAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/admin/credit/profiles");
        setProfiles(res.profiles || []);
      } catch (e) {
        console.error(e);
        setError("Error cargando perfiles de crédito");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) return <p className="text-white/60">Cargando créditos…</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">
        Créditos de usuarios
      </h1>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3">Score</th>
              <th className="p-3">Risk</th>
              <th className="p-3">Cupo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {profiles.map((p) => (
              <tr key={p.user_id} className="border-t border-white/10">
                <td className="p-3">
                  <div className="font-medium text-white">{p.email}</div>
                  <div className="text-xs text-white/40">{p.user_id}</div>
                </td>

                <td className="p-3 text-center">{p.score}</td>
                <td className="p-3 text-center">{p.risk_tier}</td>
                <td className="p-3 text-center">
                  ${Number(p.current_limit_cop).toLocaleString("es-CO")}
                </td>

                <td className="p-3 text-center">
                  {p.is_suspended ? "Suspendido" : "Activo"}
                </td>

                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => navigate(`/admin/credits/${p.user_id}`)}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Detalle
                  </button>
                            
                  <button
                    onClick={() => navigate(`/admin/credits/${p.user_id}/loans`)}
                    className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                  >
                    Ver préstamos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
