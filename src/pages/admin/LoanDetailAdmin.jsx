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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [confirmModal, setConfirmModal] = useState(null);
  // confirmModal = { type: "approve" | "disburse" }

  const fetchLoan = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/admin/loans/${id}`);
      if (!data.ok) throw new Error("Error cargando préstamo");

      setLoan(data.loan);
      setInstallments(data.installments || []);
      setPayments(data.payments || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const approveLoan = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/admin/loans/${id}/approve`, {
        method: "PATCH",
      });

      if (!data.ok) throw new Error("No se pudo aprobar");

      setConfirmModal(null);
      await fetchLoan();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const disburseLoan = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/admin/loans/${id}/disburse`, {
        method: "PATCH",
      });

      if (!data.ok) throw new Error("No se pudo desembolsar");

      setConfirmModal(null);
      await fetchLoan();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white/60">Cargando préstamo…</div>;
  }

  if (error && !loan) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm"
        >
          Volver
        </button>
      </div>
    );
  }

  if (!loan) {
    return <div className="text-white/60">Préstamo no encontrado</div>;
  }

  const canDisburse =
    loan.status === "APPROVED" &&
    !loan.disbursed_at &&
    loan.disbursement_account &&
    loan.disbursement_account.is_verified === true;

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

      {/* Error global */}
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
          {loan.kyc_status}
        </Card>

        <Card title="Creado">
          {new Date(loan.created_at).toLocaleString()}
        </Card>

        <Card title="Actualizado">
          {new Date(loan.updated_at).toLocaleString()}
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">

        {loan.status === "PENDING" && (
          <ActionButton
            loading={actionLoading}
            onClick={() => setConfirmModal({ type: "approve" })}
            label="Aprobar préstamo"
          />
        )}

        {loan.status === "APPROVED" && (
          <ActionButton
            loading={actionLoading}
            onClick={() => setConfirmModal({ type: "disburse" })}
            label="Desembolsar"
            disabled={!canDisburse}
          />
        )}
      </div>

      {loan.status === "APPROVED" &&
        loan.disbursement_account &&
        !loan.disbursement_account.is_verified && (
          <div className="text-yellow-300 text-sm">
            La cuenta bancaria debe estar verificada antes del desembolso.
          </div>
        )}

      {loan.status === "APPROVED" &&
        !loan.disbursement_account && (
          <div className="text-red-300 text-sm">
            No hay cuenta bancaria registrada.
          </div>
        )}

      {/* Installments + Payments (igual que antes) */}
      {/* ... (sin cambios estructurales) */}

      {/* -------- MODAL -------- */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              actionLoading ? null : setConfirmModal(null)
            }
          />

          <div className="relative w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 text-center shadow-xl">

              <div className="text-white font-bold text-xl">
                {confirmModal.type === "approve"
                  ? "Confirmar aprobación"
                  : "Confirmar desembolso"}
              </div>

              <div className="text-sm text-white/70 space-y-2">
                {confirmModal.type === "approve" ? (
                  <p>
                    Confirma que deseas aprobar este préstamo.
                  </p>
                ) : (
                  <p>
                    Confirma que deseas desembolsar este préstamo.
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                  onClick={() => setConfirmModal(null)}
                  disabled={actionLoading}
                >
                  Cancelar
                </button>

                <button
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-60"
                  onClick={
                    confirmModal.type === "approve"
                      ? approveLoan
                      : disburseLoan
                  }
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Procesando..."
                    : "Sí, confirmar"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function ActionButton({ label, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`rounded-xl px-5 py-2 text-sm font-semibold ${
        disabled
          ? "bg-white/20 text-white/40 cursor-not-allowed"
          : "bg-white text-slate-900 hover:bg-white/90"
      } disabled:opacity-50`}
    >
      {loading ? "Procesando…" : label}
    </button>
  );
}
