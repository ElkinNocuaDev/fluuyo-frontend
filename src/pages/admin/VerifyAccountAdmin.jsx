import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function VerifyAccountAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const fetchLoan = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/admin/loans/${id}`);
      setLoan(data.loan || null);
      setAccount(data.disbursement_account || null);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleVerify = async () => {
    setVerifying(true);
    setError("");

    try {
      await apiFetch(
        `/admin/loans/${id}/verify-disbursement-account`,
        { method: "PATCH" }
      );

      setOpenConfirmModal(false);
      await fetchLoan();
    } catch (err) {
      setError(err.message || "Error al verificar cuenta.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="text-white/60">Cargando información…</div>;
  }

  if (error && !loan) {
    return <div className="text-red-400">{error}</div>;
  }

  if (!loan) {
    return <div className="text-white/60">Préstamo no encontrado.</div>;
  }

  const canVerify =
    loan.status === "APPROVED" &&
    !loan.disbursed_at &&
    account &&
    !account.is_verified;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">
          Validación de Cuenta Bancaria
        </h1>

        <button
          onClick={() => navigate("/admin/loans")}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
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

      {/* Loan Info */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2">
        <div className="text-sm text-white/60">Préstamo</div>

        <div className="flex justify-between">
          <span>Monto</span>
          <span className="font-semibold">
            ${Number(loan.principal_cop).toLocaleString("es-CO")}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Estado</span>
          <StatusBadge status={loan.status} />
        </div>

        <div className="flex justify-between">
          <span>Usuario</span>
          <span className="text-white/70">{loan.email}</span>
        </div>
      </div>

      {/* Bank Account */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="text-lg font-semibold">
          Cuenta Bancaria
        </div>

        {!account && (
          <div className="text-red-300 text-sm">
            No hay cuenta bancaria registrada.
          </div>
        )}

        {account && (
          <>
            <InfoRow label="Banco" value={account.bank_name} />
            <InfoRow label="Tipo" value={account.account_type} />
            <InfoRow
              label="Número"
              value={`****${account.account_number.slice(-4)}`}
            />
            <InfoRow
              label="Titular"
              value={account.account_holder_name}
            />

            <div className="flex justify-between">
              <span className="text-white/60">Estado</span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  account.is_verified
                    ? "bg-green-500/20 text-green-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {account.is_verified ? "Verificada" : "Pendiente"}
              </span>
            </div>

            {canVerify && (
              <button
                onClick={() => setOpenConfirmModal(true)}
                disabled={verifying}
                className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-60"
              >
                Verificar Cuenta Bancaria
              </button>
            )}

            {!canVerify && account.is_verified && (
              <div className="text-green-300 text-sm">
                Esta cuenta ya fue verificada.
              </div>
            )}
          </>
        )}
      </div>

      {/* -------- MODAL -------- */}
      {openConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              verifying ? null : setOpenConfirmModal(false)
            }
          />

          <div className="relative w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 text-center shadow-xl">

              <div className="text-white font-bold text-xl">
                Confirmar verificación
              </div>

              <div className="text-sm text-white/70 space-y-2">
                <p>
                  Confirma que validaste manualmente la titularidad
                  contra el extracto bancario cargado en el KYC.
                </p>

                <p className="text-yellow-300 text-xs">
                  Esta acción habilita el desembolso del préstamo.
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                  onClick={() => setOpenConfirmModal(false)}
                  disabled={verifying}
                >
                  Cancelar
                </button>

                <button
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-60"
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying
                    ? "Confirmando..."
                    : "Sí, confirmar verificación"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------- Helpers ---------- */

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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span>{value}</span>
    </div>
  );
}
