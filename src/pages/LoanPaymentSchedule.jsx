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
    case "PENDING":
      return `${base} bg-blue-500/20 text-blue-300`;
    default:
      return `${base} bg-white/10 text-white`;
  }
}

function getDisplayStatus(inst) {
  // Si hay pago registrado en revisión
  if (inst.payment_status === "UNDER_REVIEW") {
    return "UNDER_REVIEW";
  }

  // Si backend ya actualiza el installment.status correctamente
  if (inst.status === "UNDER_REVIEW") {
    return "UNDER_REVIEW";
  }

  return inst.status;
}

function statusLabel(status) {
  switch (status) {
    case "PAID":
      return "Pagado";
    case "UNDER_REVIEW":
      return "Pago en revisión";
    case "OVERDUE":
      return "Vencida";
    case "PENDING":
      return "Pendiente";
    default:
      return status;
  }
}

export default function LoanPaymentSchedule() {
  const { loanId } = useParams();
  const nav = useNavigate();
  const { user, booting } = useAuth();

  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [permissions, setPermissions] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/loans/${loanId}`, {
          auth: true,
        });

        setLoan(res.loan || null);
        setInstallments(res.installments || []);
        setFinancial(res.financial_summary || null);
        setPermissions(res.permissions || null);
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

  if (!loan) {
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-white">
        Préstamo no encontrado.
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
              onClick={() => nav(`/app/loan/${loanId}`)}
            >
              ← Volver al préstamo
            </button>

            <div className="text-sm px-3 py-1 rounded-full bg-white/10">
              {loan.status}
            </div>
          </div>

          <h1 className="text-2xl font-bold">
            Cronograma de pagos
          </h1>

          {/* Resumen financiero */}
          {financial && (
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
                  Total pagado
                </div>
                <div className="font-semibold">
                  {formatCOP(financial.total_paid_cop)}
                </div>
              </div>

              <div>
                <div className="text-white/60 text-sm">
                  Saldo restante
                </div>
                <div className="font-semibold">
                  {formatCOP(financial.remaining_balance_cop)}
                </div>
              </div>
            </div>
          )}

          {/* Tabla Desktop */}
          <div className="hidden md:block card-glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Vencimiento</th>
                  <th className="text-left px-4 py-3">Monto</th>
                  <th className="text-left px-4 py-3">Pagado</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              
              <tbody>
                {installments.map((inst) => (
                  <tr
                    key={inst.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-4 font-medium">
                      {inst.installment_number}
                    </td>
              
                    <td className="px-4 py-4">
                      {formatDate(inst.due_date)}
                    </td>
              
                    <td className="px-4 py-4">
                      {formatCOP(inst.amount_due_cop)}
                    </td>
              
                    <td className="px-4 py-4">
                      {formatCOP(inst.amount_paid_cop)}
                    </td>
              
                    <td className="px-4 py-4">
                      {(() => {
                         const displayStatus = getDisplayStatus(inst);
                         return (
                           <span className={statusBadge(displayStatus)}>
                             {statusLabel(displayStatus)}
                           </span>
                         );
                       })()}
                    </td>
              
                    <td className="px-4 py-4 text-right space-x-2">
                      {(() => {
                        const displayStatus = getDisplayStatus(inst);
                    
                        return (
                          <>
                            {displayStatus === "PAID" && inst.payment_id && (
                              <button
                                className="btn-ghost text-sm"
                                onClick={() =>
                                  nav(`/app/loans/${loanId}/payments/${inst.payment_id}`)
                                }
                              >
                                Ver pago
                              </button>
                            )}

                            {displayStatus === "PENDING" &&
                              permissions?.can_register_payment && (
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

                            {displayStatus === "UNDER_REVIEW" && (
                              <>
                                {inst.payment_id && (
                                  <button
                                    className="btn-ghost text-sm"
                                    onClick={() =>
                                      nav(`/app/loans/${loanId}/payments/${inst.payment_id}`)
                                    }
                                  >
                                    Ver comprobante
                                  </button>
                                )}

                                <button
                                  disabled
                                  className="px-4 py-2 text-xs rounded-lg bg-yellow-500/20 text-yellow-300 cursor-not-allowed"
                                >
                                  Pago en revisión
                                </button>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-4">
            {installments.length === 0 && (
              <div className="card-glass p-6 text-center text-white/60">
                No hay cuotas registradas.
              </div>
            )}
          
            {installments.map((inst) => (
              <div
                key={inst.id}
                className="card-glass p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    Cuota #{inst.installment_number}
                  </div>
          
                  {(() => {
                  const displayStatus = getDisplayStatus(inst);
                  return (
                    <span className={statusBadge(displayStatus)}>
                      {statusLabel(displayStatus)}
                    </span>
                  );
                })()}
                </div>
          
                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Vencimiento</span>
                    <span>{formatDate(inst.due_date)}</span>
                  </div>
          
                  <div className="flex justify-between">
                    <span className="text-white/60">Monto</span>
                    <span>{formatCOP(inst.amount_due_cop)}</span>
                  </div>
          
                  <div className="flex justify-between">
                    <span className="text-white/60">Pagado</span>
                    <span>{formatCOP(inst.amount_paid_cop)}</span>
                  </div>
                </div>
          
                {/* Action */}
                <div className="pt-2">
                  {(() => {
                    const displayStatus = getDisplayStatus(inst);
                
                    return (
                      <>
                        {displayStatus === "PAID" && inst.payment_id && (
                          <button
                            className="btn-ghost w-full"
                            onClick={() =>
                              nav(`/app/loans/${loanId}/payments/${inst.payment_id}`)
                            }
                          >
                            Ver pago
                          </button>
                        )}
                
                        {displayStatus === "PENDING" &&
                          permissions?.can_register_payment && (
                            <button
                              className="btn-primary w-full"
                              onClick={() =>
                                nav(
                                  `/app/loans/${loanId}/payments/new?installment=${inst.id}`
                                )
                              }
                            >
                              Pagar cuota
                            </button>
                          )}
                
                        {displayStatus === "UNDER_REVIEW" && (
                          <>
                            {inst.payment_id && (
                              <button
                                className="btn-ghost w-full mb-2"
                                onClick={() =>
                                  nav(`/app/loans/${loanId}/payments/${inst.payment_id}`)
                                }
                              >
                                Ver comprobante
                              </button>
                            )}
                
                            <button
                              disabled
                              className="w-full px-4 py-3 text-sm rounded-lg bg-yellow-500/20 text-yellow-300 cursor-not-allowed"
                            >
                              Pago en revisión
                            </button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

              </div>
            ))}
          </div>


        </div>
      </div>
    </AppLayout>
  );
}
