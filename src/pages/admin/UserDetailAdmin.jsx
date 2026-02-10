import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function UserDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await apiFetch(`/admin/users/${id}`);
        const l = await apiFetch(`/admin/users/${id}/loans`);

        setUser(u.user);
        setLoans(l.loans || []);
      } catch (err) {
        console.error(err);
        alert("Error cargando usuario");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <p className="text-white/60">Cargando…</p>;
  if (!user) return <p className="text-red-400">Usuario no encontrado</p>;

  return (
    <div className="relative space-y-6">
      {/* Botón volver */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-0 right-0 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
      >
        ← Volver
      </button>

      {/* Header */}
      <h1 className="text-2xl font-semibold text-white pt-12">
        {user.first_name} {user.last_name}
      </h1>

      {/* Datos personales */}
      <section className="card-glass p-4">
        <h2 className="text-sm font-semibold text-white/80 mb-2">
          Datos personales
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
          <div>Email: {user.email}</div>
          <div>Teléfono: {user.phone}</div>
          <div>Rol: {user.role}</div>
          <div>
            Creado:{" "}
            {new Date(user.created_at).toLocaleDateString("es-CO")}
          </div>
        </div>
      </section>

      {/* Estado */}
      <section className="card-glass p-4">
        <h2 className="text-sm font-semibold text-white/80 mb-2">Estado</h2>
        <span
          className={
            user.status === "ACTIVE"
              ? "text-green-400"
              : "text-red-400"
          }
        >
          {user.status}
        </span>
      </section>

      {/* KYC */}
      <section className="card-glass p-4">
        <h2 className="text-sm font-semibold text-white/80 mb-2">KYC</h2>
        <span className="text-yellow-400">{user.kyc_status}</span>
      </section>

      {/* Créditos */}
      <section className="card-glass p-4">
        <h2 className="text-sm font-semibold text-white/80 mb-2">
          Créditos
        </h2>

        {loans.length === 0 ? (
          <p className="text-white/40 text-sm">No tiene créditos</p>
        ) : (
          <div className="space-y-3">
            {loans.map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-white/10 p-3"
              >
                <div className="text-white font-medium">
                  ${Number(l.principal_cop).toLocaleString("es-CO")}
                </div>

                <div className="text-xs text-white/60">
                  {l.term_months} meses · Cuota $
                  {Number(l.installment_amount_cop).toLocaleString("es-CO")}
                </div>

                <div className="text-xs text-white/40">
                  Total a pagar: $
                  {Number(l.total_payable_cop).toLocaleString("es-CO")}
                </div>

                <div className="text-xs mt-1">
                  Estado:{" "}
                  <span
                    className={
                      l.status === "ACTIVE"
                        ? "text-green-400"
                        : l.status === "APPROVED"
                        ? "text-blue-400"
                        : "text-white/60"
                    }
                  >
                    {l.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
