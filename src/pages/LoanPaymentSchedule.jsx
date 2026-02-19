import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import AppLayout from "../components/AppLayout";

function formatCOP(value) {
  if (value == null) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("es-CO");
}

function statusBadge(status) {
  const base = "px-3 py-1 rounded-full text-xs font-medium";

  switch (status) {
    case "PAID":
      return `${base} bg-green-500/20 text-green-300`;
    case "UNDER_REVIEW":
      return `${base} bg-yellow-500/20 text-yellow-300`;
    case "OVERDUE":
      return `${base} bg-red-500/20 text-red-300`;
    default:
      return `${base} bg-white/10 text-white`;
  }
}

export default function LoanPaymentSchedule() {
  const { loanId } = useParams();
  const nav = useNavigate();
  const { user, booting } = useAuth();

  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/loans/${loanId}/installments`, {
          auth: true,
        });

        setLoan(res.loan || null);
        setInstallments(res.installments || []);
      } catch (e) {
        setError(e.message || "No se pudo cargar el cronograma.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loanId]);

  if (loading) {
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-white">
        Cargando cronograma...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-red-300">
        {error}
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-8 text-white">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              className="btn-ghost"
              onClick={() => nav(`/app/loans/${loanId}`)}
            >
              ← Volver al préstamo
            </button>

            <div className="text-sm px-3 py-1 rounded-full bg-white/10">
              {loan?.status || "Préstamo"}
            </div>
          </div>

          <h1 className="text-2xl font-bold">
            Cronograma de pagos
          </h1>

          {/* Resumen rápido */}
          {loan && (
            <div className="card-glass p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-white/60 text-sm">
                  Monto aprobado
                </div>
                <div className="font-semibold">
                  {formatCOP(loan.principal_cop)}
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm">
                  Plazo
                </div>
                <div className="font-semibold">
                  {loan.term_months} meses
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm">
                  Estado
                </div>
                <div className="font-semibold">
                  {loan.status}
                </div>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="card-glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Vencimiento</th>
                  <th className="text-left px-4 py-3">Monto</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {installments.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-6 text-center text-white/60"
                    >
                      No hay cuotas registradas.
                    </td>
                  </tr>
                )}

                {installments.map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-4 font-medium">
                      {inst.number}
                    </td>

                    <td className="px-4 py-4">
                      {formatDate(inst.due_date)}
                    </td>

                    <td className="px-4 py-4">
                      {formatCOP(inst.amount_cop)}
                    </td>

                    <td className="px-4 py-4">
                      <span className={statusBadge(inst.status)}>
                        {inst.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right space-x-2">
                      {inst.status === "PAID" && inst.payment_id && (
                        <button
                          className="btn-ghost text-sm"
                          onClick={() =>
                            nav(
                              `/app/loans/${loanId}/payments/${inst.payment_id}`
                            )
                          }
                        >
                          Ver pago
                        </button>
                      )}

                      {inst.status === "PENDING" && (
                        <button
                          className="btn-primary text-sm"
                          onClick={() =>
                            nav(
                              `/app/loans/${loanId}/payments/new?installment=${inst.id}`
                            )
                          }
                        >
                          Pagar
                        </button>
                      )}

                      {inst.status === "UNDER_REVIEW" && (
                        <button
                          disabled
                          className="px-4 py-2 text-xs rounded-lg bg-yellow-500/20 text-yellow-300 cursor-not-allowed"
                        >
                          En validación
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
