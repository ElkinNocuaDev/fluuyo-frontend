import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
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

export default function LoanPaymentCreate() {
  const { loanId } = useParams();
  const [searchParams] = useSearchParams();
  const installmentId = searchParams.get("installment");

  const nav = useNavigate();
  const { user, booting } = useAuth();

  const [loan, setLoan] = useState(null);
  const [installment, setInstallment] = useState(null);

  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successPayment, setSuccessPayment] = useState(null);

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  /* ==============================
     Carga préstamo + cuota
  ============================== */

  useEffect(() => {
    async function load() {
      try {
        if (!installmentId) {
          nav(`/app/loans/${loanId}/payments`, { replace: true });
          return;
        }

        setLoading(true);
        setError("");

        // ✅ ÚNICO endpoint necesario
        const res = await apiFetch(`/loans/${loanId}`, {
          auth: true,
        });

        const loanData = res.loan;
        const installments = loanData?.installments || [];

        const inst = installments.find(
          (i) => i.id === installmentId
        );

        if (!inst) {
          setError("Cuota no encontrada.");
          return;
        }

        if (inst.status !== "PENDING") {
          nav(`/app/loans/${loanId}/payments`, { replace: true });
          return;
        }

        setLoan(loanData);
        setInstallment(inst);

      } catch (e) {
        setError(e.message || "No se pudo cargar la cuota.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loanId, installmentId, nav]);

  /* ==============================
     Submit pago
  ============================== */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!installment) return;

    try {
      setSubmitting(true);

      const pendingAmount =
        installment.amount_due_cop -
        (installment.amount_paid_cop || 0);

      if (pendingAmount <= 0) {
        setError("Esta cuota ya está completamente pagada.");
        return;
      }

      const payload = {
        installment_id: installment.id,
        amount_cop: pendingAmount,
        method,
        reference,
      };

      // ✅ Endpoint correcto
      const res = await apiFetch(
        `/loans/${loanId}/payments`,
        {
          method: "POST",
          body: payload,
          auth: true,
        }
      );

      setSuccessPayment(res.payment);

    } catch (e) {
      setError(e.message || "No se pudo registrar el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ==============================
     Loading
  ============================== */

  if (loading) {
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-white">
        Cargando cuota...
      </div>
    );
  }

  if (error && !installment) {
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-red-300">
        {error}
      </div>
    );
  }

  /* ==============================
     Confirmación exitosa
  ============================== */

  if (successPayment) {
    return (
      <AppLayout>
        <div className="px-4 py-8 text-white">
          <div className="max-w-2xl mx-auto">

            <div className="card-glass p-6 text-center space-y-4">
              <h1 className="text-2xl font-bold">
                Pago registrado correctamente
              </h1>

              <p className="text-white/70">
                Tu pago está pendiente de validación.
              </p>

              <div className="pt-4">
                <div className="text-white/60 text-sm">Monto</div>
                <div className="text-xl font-semibold">
                  {formatCOP(successPayment.amount_cop)}
                </div>
              </div>

              <button
                className="btn-primary w-full mt-6"
                onClick={() =>
                  nav(
                    `/app/loans/${loanId}/payments/${successPayment.id}`
                  )
                }
              >
                Ver detalle del pago
              </button>

              <button
                className="btn-ghost w-full"
                onClick={() =>
                  nav(`/app/loans/${loanId}/payments`)
                }
              >
                Volver al cronograma
              </button>

            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ==============================
     Render formulario
  ============================== */

  const pendingAmount =
    installment.amount_due_cop -
    (installment.amount_paid_cop || 0);

  return (
    <AppLayout>
      <div className="px-4 py-8 text-white">
        <div className="max-w-2xl mx-auto space-y-6">

          <div>
            <button
              className="btn-ghost"
              onClick={() =>
                nav(`/app/loans/${loanId}/payments`)
              }
            >
              ← Volver al cronograma
            </button>
          </div>

          <h1 className="text-2xl font-bold">
            Pagar cuota #{installment.installment_number}
          </h1>

          <div className="card-glass p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-white/60">Vencimiento</span>
              <span>{formatDate(installment.due_date)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/60">Monto pendiente</span>
              <span className="font-semibold">
                {formatCOP(pendingAmount)}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="card-glass p-6 space-y-5"
          >
            <div>
              <label className="block text-white/60 text-sm mb-1">
                Método de pago
              </label>
              <select
                className="input w-full"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="bank_transfer">
                  Transferencia bancaria
                </option>
                <option value="pse">
                  PSE
                </option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Referencia (opcional)
              </label>
              <input
                type="text"
                className="input w-full"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Número de comprobante"
              />
            </div>

            {error && (
              <div className="text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting
                ? "Enviando..."
                : `Confirmar pago ${formatCOP(pendingAmount)}`}
            </button>
          </form>

        </div>
      </div>
    </AppLayout>
  );
}
