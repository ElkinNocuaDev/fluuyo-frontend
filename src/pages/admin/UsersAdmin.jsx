import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function UsersAdmin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const res = await apiFetch("/admin/users");
      setUsers(res.users || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      alert("Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) return <p className="text-white/60">Cargando usuarios…</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Usuarios</h1>

        {/* Botón crear (listo para después) */}
        <button
          disabled
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/40 cursor-not-allowed"
        >
          + Crear usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3 text-center">Rol</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Creado</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="p-3">
                  <div className="font-medium text-white">{u.first_name} {u.last_name}</div>
                  <div className="text-xs text-white/40">{u.email}</div>
                </td>

                <td className="p-3 text-center">
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "text-purple-400"
                        : u.role === "OPERATOR"
                        ? "text-blue-400"
                        : "text-white/70"
                    }
                  >
                    {u.role}
                  </span>
                </td>

                <td className="p-3 text-center">
                  <span
                    className={
                      u.status === "ACTIVE"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {u.status}
                  </span>
                </td>

                <td className="p-3 text-center text-xs text-white/60">
                  {new Date(u.created_at).toLocaleDateString("es-CO")}
                </td>

                <td className="p-3 text-center">
                  <button
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                    className="rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-white/40">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
