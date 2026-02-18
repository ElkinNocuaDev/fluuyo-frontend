import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function LoanDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [account, setAccount] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [openDisburseModal, setOpenDisburseModal] = useState(false);

  const fetchLoan = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch(`/admin/loans/${id}`);

      setLoan(data.loan);
      setInstallments(data.installments || []);
      setPayments(data.payments || []);
      setAccount(data.disbursement_account || null);
    } catch (e) {
      setError(e.message || "Error cargando préstamo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [id]);

  /* ------------------ ACTIONS ------------------ */

  const approveLoan = async () => {
    setActionLoading(true);
    setError("");

    try {
      await apiFetch(`/admin/loans/${id}/approve`, {
        method: "PATCH",
      });

      setOpenApproveModal(false);
      await fetchLoan();
    } catch (e) {
      setError(e.message || "No se pudo aprobar");
    } finally {
      setActionLoading(false);
    }
  };

  const disburseLoan = async () => {
    setActionLoading(true);
    setError("");

    try {
      await apiFetch(`/admin/loans/${id}/disburse`, {
        method: "PATCH",
      });

      setOpenDisburseModal(false);
      await fetchLoan();
    } catch (e) {
      if (e.code === "INSTALLMENTS_ALREADY_EXIST") {
        setError("El cronograma ya fue generado para este préstamo.");
      } else if (e.code === "NO_VERIFIED_DISBURSEMENT_ACCOUNT") {
        setError("No existe cuenta bancaria verificada.");
      } else if (e.code === "ALREADY_DISBURSED") {
        setError("El préstamo ya fue desembolsado.");
      } else {
        setError(e.message || "No se pudo desembolsar");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white/60">Cargando préstamo…</div>;
  }

  if (!loan) {
    return <div className="text-red-400">Préstamo no encontrado</div>;
  }

  const canDisburse =
    loan.status === "APPROVED" &&
    !loan.disbursed_at &&
    account &&
    account.is_verified;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Detalle del Préstamo</h1>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm"
        >
          ← Volver
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Loan summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Usuario">
          <div className="font-medium">{loan.email}</div>
          <div className="text-xs text-white/50">{loan.user_id}</div>
        </Card>

        <Card title="Monto">
          ${Number(loan.principal_cop).toLocaleString("es-CO")}
        </Card>

        <Card title="Estado">
          <StatusBadge status={loan.status} />
        </Card>

        <Card title="KYC">
          <span className="font-semibold">{loan.kyc_status}</span>
        </Card>

        <Card title="Cuenta bancaria">
          {account ? (
            account.is_verified ? (
              <span className="text-green-300 font-semibold">
                Verificada
              </span>
            ) : (
              <span className="text-yellow-300 font-semibold">
                Pendiente validación
              </span>
            )
          ) : (
            <span className="text-red-400">No registrada</span>
          )}
        </Card>

        {loan.disbursed_at && (
          <Card title="Fecha desembolso">
            {new Date(loan.disbursed_at).toLocaleString("es-CO")}
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {loan.status === "PENDING" && (
          <button
            onClick={() => setOpenApproveModal(true)}
            disabled={actionLoading}
            className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-50"
          >
            Aprobar préstamo
          </button>
        )}

        {canDisburse && (
          <button
            onClick={() => setOpenDisburseModal(true)}
            disabled={actionLoading}
            className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-40"
          >
            Desembolsar
          </button>
        )}
      </div>

      {!canDisburse && loan.status === "APPROVED" && (
        <div className="text-yellow-300 text-sm">
          No se puede desembolsar hasta que la cuenta bancaria esté validada.
        </div>
      )}

      {/* ---------------- CRONOGRAMA ---------------- */}
      {loan.status === "DISBURSED" && installments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Cronograma</h2>

          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Vencimiento</th>
                  <th className="p-3 text-left">Monto</th>
                  <th className="p-3 text-left">Pagado</th>
                  <th className="p-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst) => (
                  <tr key={inst.id} className="border-t border-white/5">
                    <td className="p-3">{inst.installment_number}</td>
                    <td className="p-3">
                      {new Date(inst.due_date).toLocaleDateString("es-CO")}
                    </td>
                    <td className="p-3">
                      ${Number(inst.amount_cop || 0).toLocaleString("es-CO")}
                    </td>
                    <td className="p-3">
                      ${Number(inst.amount_paid_cop || 0).toLocaleString("es-CO")}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={inst.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- PAGOS ---------------- */}
      {payments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Pagos registrados</h2>

          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60">
                <tr>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Monto</th>
                  <th className="p-3 text-left">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="p-3">
                      {new Date(p.created_at).toLocaleString("es-CO")}
                    </td>
                    <td className="p-3">
                      ${Number(p.amount_cop).toLocaleString("es-CO")}
                    </td>
                    <td className="p-3">{p.reference || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- MODAL APROBAR ---------- */}
      {openApproveModal && (
        <Modal
          title="Confirmar aprobación"
          description="¿Confirmas la aprobación de este préstamo?"
          loading={actionLoading}
          onCancel={() => setOpenApproveModal(false)}
          onConfirm={approveLoan}
        />
      )}

      {/* ---------- MODAL DESEMBOLSAR ---------- */}
      {openDisburseModal && (
        <Modal
          title="Confirmar desembolso"
          description="Esta acción enviará el dinero al cliente. ¿Deseas continuar?"
          loading={actionLoading}
          onCancel={() => setOpenDisburseModal(false)}
          onConfirm={disburseLoan}
        />
      )}
    </div>
  );
}

/* ---------- Modal reutilizable ---------- */

function Modal({ title, description, onCancel, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => (!loading ? onCancel() : null)}
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 text-center shadow-xl">
          <div className="text-white font-bold text-xl">{title}</div>

          <div className="text-sm text-white/70">{description}</div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-60"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-1 text-xs text-white/60">{title}</div>
      <div className="font-semibold">{children}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: "bg-yellow-500/20 text-yellow-300",
    APPROVED: "bg-blue-500/20 text-blue-300",
    DISBURSED: "bg-indigo-500/20 text-indigo-300",
    CLOSED: "bg-green-500/20 text-green-300",
    REJECTED: "bg-red-500/20 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        map[status] || "bg-white/10 text-white"
      }`}
    >
      {status}
    </span>
  );
}
