import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
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

export default function LoanPaymentCreate() {
  const { loanId } = useParams();
  const nav = useNavigate();
  const { user, booting } = useAuth();

  const [loan, setLoan] = useState(null);
  const [financial, setFinancial] = useState(null);

  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [receiptFile, setReceiptFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successPayment, setSuccessPayment] = useState(null);

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/loans/${loanId}`, { auth: true });
        setLoan(res.loan);
        setFinancial(res.financial_summary);
      } catch (e) {
        setError("No se pudo cargar el préstamo.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loanId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        amount_cop: Number(amount),
        reference,
        method,
      };

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

  if (loading)
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-white">
        Cargando...
      </div>
    );

  if (error && !loan)
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-red-300">
        {error}
      </div>
    );

  /* =============================
     CONFIRMACIÓN EXITOSA
  ============================== */

  if (successPayment)
    return (
      <AppLayout>
        <div className="px-4 py-8 text-white">
          <div className="max-w-2xl mx-auto space-y-6">

            <div className="card-glass p-6 space-y-4 text-center">
              <div className="text-2xl font-bold">
                Pago registrado
              </div>

              <div className="text-white/70">
                Tu pago fue enviado correctamente y está pendiente de validación.
              </div>

              <div className="pt-4 space-y-2">
                <div>
                  <span className="text-white/60">Monto</span>
                  <div className="text-xl font-semibold">
                    {formatCOP(successPayment.amount_cop)}
                  </div>
                </div>

                <div>
                  <span className="text-white/60">Estado</span>
                  <div>{successPayment.status}</div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  className="btn-primary w-full"
                  onClick={() => nav(`/app/loans/${loanId}`)}
                >
                  Volver al préstamo
                </button>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>
    );

  /* =============================
     FORMULARIO
  ============================== */

  return (
    <AppLayout>
      <div className="px-4 py-8 text-white">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              className="btn-ghost"
              onClick={() => nav(`/app/loans/${loanId}`)}
            >
              ← Volver
            </button>
          </div>

          <h1 className="text-2xl font-bold">
            Registrar pago
          </h1>

          {/* Resumen del préstamo */}
          {financial && (
            <div className="card-glass p-6 space-y-2">
              <div className="font-semibold">
                Saldo pendiente
              </div>

              <div className="text-xl font-bold">
                {formatCOP(financial.remaining_balance_cop)}
              </div>
            </div>
          )}

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="card-glass p-6 space-y-5"
          >

            {/* Monto */}
            <div>
              <label className="block text-white/60 text-sm mb-1">
                Monto a pagar
              </label>
              <input
                type="number"
                className="input w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej: 150000"
              />
            </div>

            {/* Método */}
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

            {/* Referencia */}
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
              {submitting ? "Enviando..." : "Confirmar pago"}
            </button>

          </form>

        </div>
      </div>
    </AppLayout>
  );
}
