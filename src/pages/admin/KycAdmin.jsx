import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function KycAdmin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await apiFetch("/admin/kyc/users");
        setUsers(res.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) return <p className="text-white/60">Cargando KYC…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">KYC de Usuarios</h1>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3 text-center">Estado KYC</th>
              <th className="p-3 text-center">Última actualización</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="p-3">
                  <div className="font-medium text-white">{u.name}</div>
                  <div className="text-xs text-white/40">{u.email}</div>
                </td>

                <td className="p-3 text-center">
                  <span
                    className={
                      u.kyc_status === "APPROVED"
                        ? "text-green-400"
                        : u.kyc_status === "REJECTED"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {u.kyc_status}
                  </span>
                </td>

                <td className="p-3 text-center text-xs text-white/60">
                  {new Date(u.updated_at).toLocaleDateString("es-CO")}
                </td>

                <td className="p-3 text-center">
                  <button
                    onClick={() => navigate(`/admin/kyc/${u.id}`)}
                    className="rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-white/40">
                  No hay usuarios con KYC
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
