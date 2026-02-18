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

export default function LoanDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, booting } = useAuth();

  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [financial, setFinancial] = useState(null);
  const [disbursementAccount, setDisbursementAccount] = useState(null);
  const [payments, setPayments] = useState([]);
  const [permissions, setPermissions] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/loans/${id}`, { auth: true });

        setLoan(res.loan);
        setInstallments(res.installments || []);
        setFinancial(res.financial_summary || null);
        setDisbursementAccount(res.disbursement_account || null);
        setPayments(res.payments || []);
        setPermissions(res.permissions || null);
      } catch (e) {
        setError(e.message || "No se pudo cargar el préstamo.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

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

  if (!loan)
    return (
      <div className="bg-aurora min-h-screen flex items-center justify-center text-white">
        Préstamo no encontrado.
      </div>
    );

  return (
    <AppLayout>
        <div className="bg-aurora min-h-screen px-4 py-8 text-white">
          <div className="max-w-3xl mx-auto space-y-6">

        {/* Header con botón volver */}
        <div className="flex items-center justify-between">
          <button
            className="btn-ghost"
            onClick={() => nav("/app")}
          >
            ← Volver
          </button>

          <div className="text-sm px-3 py-1 rounded-full bg-white/10">
            {loan.status}
          </div>
        </div>

        <h1 className="text-2xl font-bold">
          Detalle del préstamo
        </h1>

        {/* Información principal */}
        <div className="card-glass p-6 space-y-3">
          <div>
            <span className="text-white/60">Monto aprobado</span>
            <div className="text-xl font-semibold">
              {formatCOP(loan.principal_cop)}
            </div>
          </div>

          <div>
            <span className="text-white/60">Plazo</span>
            <div>{loan.term_months} meses</div>
          </div>
        </div>

        {/* Resumen financiero */}
        {financial && (
          <div className="card-glass p-6 space-y-2">
            <div className="font-semibold">Resumen financiero</div>

            <div className="flex justify-between">
              <span className="text-white/60">Total a pagar</span>
              <span>{formatCOP(financial.total_payable_cop)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/60">Total pagado</span>
              <span>{formatCOP(financial.total_paid_cop)}</span>
            </div>

            <div className="flex justify-between font-semibold">
              <span>Saldo restante</span>
              <span>{formatCOP(financial.remaining_balance_cop)}</span>
            </div>
          </div>
        )}

        {/* Cuenta de desembolso */}
        <div className="card-glass p-6 space-y-2">
          <div className="font-semibold">Cuenta de desembolso</div>

          {!disbursementAccount && (
            <div className="text-amber-300 text-sm">
              No has registrado una cuenta bancaria.
            </div>
          )}

          {disbursementAccount && (
            <>
              <div className="flex justify-between">
                <span className="text-white/60">Banco</span>
                <span>{disbursementAccount.bank_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60">Tipo</span>
                <span>{disbursementAccount.account_type}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/60">Estado</span>
                <span className="text-sm px-2 py-1 rounded-full bg-white/10">
                  {disbursementAccount.is_verified
                    ? "Verificada"
                    : "Pendiente de validación"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Cuotas */}
        <div className="card-glass p-6 space-y-4">
          <div className="font-semibold">Cuotas</div>

          {installments.length === 0 && (
            <div className="text-white/60 text-sm">
              Las cuotas estarán disponibles cuando el préstamo sea desembolsado.
            </div>
          )}

          {installments.map((i) => (
            <div
              key={i.id}
              className="p-4 rounded-lg bg-white/5 space-y-1"
            >
              <div className="font-semibold">
                Cuota #{i.installment_number}
              </div>
              <div>Vence: {formatDate(i.due_date)}</div>
              <div>Monto: {formatCOP(i.amount_due_cop)}</div>
              <div>Pagado: {formatCOP(i.amount_paid_cop)}</div>
              <div className="text-sm text-white/60">
                Estado: {i.status}
              </div>
            </div>
          ))}
        </div>

        {/* Pagos */}
        {payments.length > 0 && (
          <div className="card-glass p-6 space-y-4">
            <div className="font-semibold">Pagos enviados</div>

            {payments.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-lg bg-white/5 space-y-1"
              >
                <div>Monto: {formatCOP(p.amount_cop)}</div>
                <div>Estado: {p.status}</div>
                <div>Fecha: {formatDate(p.created_at)}</div>
              </div>
            ))}
          </div>
        )}

          </div>
        </div>
    </AppLayout>
  );
}
