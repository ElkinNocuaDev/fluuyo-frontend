import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";

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

  if (loading) return <div className="p-6 text-white">Cargando...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!loan) return <div className="p-6 text-white">Préstamo no encontrado.</div>;

  return (
    <div className="p-6 text-white max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Detalle del préstamo</h1>

      {/* Información principal */}
      <div className="mt-6 bg-white/5 p-5 rounded-xl space-y-2">
        <div>
          <span className="text-gray-400">Monto aprobado:</span>{" "}
          {formatCOP(loan.principal_cop)}
        </div>
        <div>
          <span className="text-gray-400">Plazo:</span>{" "}
          {loan.term_months} meses
        </div>
        <div>
          <span className="text-gray-400">Estado:</span>{" "}
          {loan.status}
        </div>
      </div>

      {/* Resumen financiero */}
      {financial && (
        <div className="mt-6 bg-white/5 p-5 rounded-xl space-y-2">
          <h2 className="font-semibold text-lg">Resumen financiero</h2>
          <div>
            <span className="text-gray-400">Total a pagar:</span>{" "}
            {formatCOP(financial.total_payable_cop)}
          </div>
          <div>
            <span className="text-gray-400">Total pagado:</span>{" "}
            {formatCOP(financial.total_paid_cop)}
          </div>
          <div>
            <span className="text-gray-400">Saldo restante:</span>{" "}
            {formatCOP(financial.remaining_balance_cop)}
          </div>
        </div>
      )}

      {/* Cuenta de desembolso */}
      <div className="mt-6 bg-white/5 p-5 rounded-xl space-y-2">
        <h2 className="font-semibold text-lg">Cuenta de desembolso</h2>

        {!disbursementAccount &&
          permissions?.can_edit_disbursement_account && (
            <div className="text-amber-400">
              No has registrado una cuenta bancaria.
            </div>
          )}

        {!disbursementAccount &&
          !permissions?.can_edit_disbursement_account && (
            <div className="text-gray-400">
              No hay información de cuenta disponible.
            </div>
          )}

        {disbursementAccount && (
          <>
            <div>
              <span className="text-gray-400">Banco:</span>{" "}
              {disbursementAccount.bank_name}
            </div>
            <div>
              <span className="text-gray-400">Tipo:</span>{" "}
              {disbursementAccount.account_type}
            </div>
            <div>
              <span className="text-gray-400">Estado:</span>{" "}
              {disbursementAccount.is_verified
                ? "Verificada"
                : "Pendiente de validación"}
            </div>
          </>
        )}
      </div>

      {/* Cuotas */}
      <div className="mt-6 bg-white/5 p-5 rounded-xl">
        <h2 className="font-semibold text-lg mb-3">Cuotas</h2>

        {installments.length === 0 && (
          <div className="text-gray-400">
            Las cuotas estarán disponibles cuando el préstamo sea desembolsado.
          </div>
        )}

        <div className="space-y-3">
          {installments.map((i) => (
            <div
              key={i.id}
              className="p-3 bg-white/5 rounded-lg space-y-1"
            >
              <div>
                <strong>Cuota #{i.installment_number}</strong>
              </div>
              <div>Vence: {formatDate(i.due_date)}</div>
              <div>Monto: {formatCOP(i.amount_due_cop)}</div>
              <div>Pagado: {formatCOP(i.amount_paid_cop)}</div>
              <div>Estado: {i.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagos enviados */}
      {payments.length > 0 && (
        <div className="mt-6 bg-white/5 p-5 rounded-xl">
          <h2 className="font-semibold text-lg mb-3">
            Pagos enviados
          </h2>

          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-white/5 rounded-lg space-y-1"
              >
                <div>Monto: {formatCOP(p.amount_cop)}</div>
                <div>Estado: {p.status}</div>
                <div>Fecha: {formatDate(p.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
