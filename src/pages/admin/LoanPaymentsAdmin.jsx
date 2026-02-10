import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

const BACKEND_URL = import.meta.env.VITE_API_URL;


export default function LoanPaymentsAdmin() {
  const { id } = useParams(); // loanId
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  const [reviewing, setReviewing] = useState(null); // paymentId
  const [rejecting, setRejecting] = useState(null); // paymentId
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/admin/loans/${id}/payments`);
        setPayments(data.payments || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los pagos.");
      } finally {
        setLoading(false);
      }
    };

    const reviewPayment = async (paymentId, status, reason = null) => {
      try {
        setReviewing(paymentId);

        await apiFetch(`/admin/loan-payments/${paymentId}/review`, {
          method: "PATCH",
          body: JSON.stringify(
            status === "REJECTED"
              ? { status, rejection_reason: reason }
              : { status }
          ),
        });

        // Optimistic update
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  status,
                  reviewed_at: new Date().toISOString(),
                }
              : p
          )
        );
      } catch (err) {
        alert("No se pudo procesar el pago.");
      } finally {
        setReviewing(null);
        setRejecting(null);
        setRejectionReason("");
      }
    };

    fetchPayments();
  }, [id]);

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Pagos del préstamo</h1>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm"
        >
          ← Volver
        </button>
      </div>

      {loading && (
        <p className="text-white/60">Cargando pagos…</p>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {!loading && !payments.length && (
        <p className="text-white/50">
          Este préstamo no tiene pagos registrados.
        </p>
      )}

      {!!payments.length && (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Monto (COP)</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Comprobante</th>
                <th className="px-4 py-3 text-left">Creado</th>
                <th className="px-4 py-3 text-left">Revisado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.id}
                  </td>

                  <td className="px-4 py-3">
                    {Number(p.amount_cop).toLocaleString("es-CO")}
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                      {p.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {p.proof_url ? (
                      <a
                        href={`${BACKEND_URL}/${p.proof_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver
                      </a>

                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(p.created_at).toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    {p.reviewed_at
                      ? new Date(p.reviewed_at).toLocaleString()
                      : "—"}
                  </td>

                  <td className="px-4 py-3">
                    {p.status === "SUBMITTED" ? (
                      <div className="flex gap-2">
                        <button
                          disabled={reviewing === p.id}
                          onClick={() => reviewPayment(p.id, "APPROVED")}
                          className="rounded bg-green-600/20 px-3 py-1 text-xs text-green-300 hover:bg-green-600/30 disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                  
                        <button
                          onClick={() => setRejecting(p.id)}
                          className="rounded bg-red-600/20 px-3 py-1 text-xs text-red-300 hover:bg-red-600/30"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Rechazar pago
            </h2>
          
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo del rechazo"
              className="w-full rounded-lg bg-black/40 p-3 text-sm text-white"
              rows={4}
            />
      
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejecting(null)}
                className="px-4 py-2 text-sm text-white/60"
              >
                Cancelar
              </button>
          
              <button
                disabled={!rejectionReason.trim()}
                onClick={() =>
                  reviewPayment(rejecting, "REJECTED", rejectionReason)
                }
                className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
