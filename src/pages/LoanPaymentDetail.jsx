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

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("es-CO");
}

export default function LoanPaymentDetail() {
  const { loanId, paymentId } = useParams();
  const nav = useNavigate();
  const { user, booting } = useAuth();

  const [payment, setPayment] = useState(null);
  const [loan, setLoan] = useState(null);
  const [permissions, setPermissions] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(
          `/loans/${loanId}/payments/${paymentId}`,
          { auth: true }
        );

        setPayment(res.payment || null);
        setLoan(res.loan || null);
        setPermissions(res.permissions || null);
      } catch (e) {
        setError(e.message || "No se pudo cargar el pago.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loanId, paymentId]);

  if (loading)
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-white">
        Cargando...
      </div>
    );

  if (error)
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-red-300">
        {error}
      </div>
    );

  if (!payment)
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-white">
        Pago no encontrado.
      </div>
    );

  return (
    <AppLayout>
      <div className="px-4 py-8 text-white">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              className="btn-ghost"
              onClick={() => nav(`/app/loans/${loanId}`)}
            >
              ← Volver al préstamo
            </button>

            <div className="text-sm px-3 py-1 rounded-full bg-white/10">
              {payment.status}
            </div>
          </div>

          <h1 className="text-2xl font-bold">
            Detalle del pago
          </h1>

          {/* Información principal */}
          <div className="card-glass p-6 space-y-3">
            <div>
              <span className="text-white/60">Monto enviado</span>
              <div className="text-xl font-semibold">
                {formatCOP(payment.amount_cop)}
              </div>
            </div>

            <div>
              <span className="text-white/60">Fecha de creación</span>
              <div>{formatDate(payment.created_at)}</div>
            </div>

            <div>
              <span className="text-white/60">Referencia</span>
              <div>{payment.reference || "-"}</div>
            </div>
          </div>

          {/* Estado y validación */}
          <div className="card-glass p-6 space-y-4">
            <div className="font-semibold">Estado del pago</div>

            <div className="flex justify-between">
              <span className="text-white/60">Estado actual</span>
              <span>{payment.status}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/60">Última actualización</span>
              <span>{formatDate(payment.updated_at)}</span>
            </div>

            {payment.validation_notes && (
              <div className="pt-2">
                <div className="text-white/60 text-sm">
                  Notas de validación
                </div>
                <div className="text-sm mt-1">
                  {payment.validation_notes}
                </div>
              </div>
            )}
          </div>

          {/* Información del préstamo asociado */}
          {loan && (
            <div className="card-glass p-6 space-y-2">
              <div className="font-semibold">
                Préstamo asociado
              </div>

              <div className="flex justify-between">
                <span className="text-white/60">Monto aprobado</span>
                <span>{formatCOP(loan.principal_cop)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60">Plazo</span>
                <span>{loan.term_months} meses</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60">Estado</span>
                <span>{loan.status}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
