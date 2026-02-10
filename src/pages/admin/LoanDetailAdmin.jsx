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

  const fetchLoan = async () => {
  setLoading(true);
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
  if (!window.confirm("¿Aprobar este préstamo?")) return;

  setActionLoading(true);
  try {
    const data = await apiFetch(`/admin/loans/${id}/approve`, {
      method: "PATCH",
    });

    if (!data.ok) throw new Error("No se pudo aprobar");

    await fetchLoan();
  } catch (e) {
    alert(e.message);
  } finally {
    setActionLoading(false);
  }
};


const disburseLoan = async () => {
  if (!window.confirm("¿Confirmar desembolso de este préstamo?")) return;

  setActionLoading(true);
  try {
    const data = await apiFetch(`/admin/loans/${id}/disburse`, {
      method: "PATCH",
    });

    if (!data.ok) throw new Error("No se pudo desembolsar");

    await fetchLoan();
  } catch (e) {
    alert(e.message);
    console.error(e);
  } finally {
    setActionLoading(false);
  }
};



  if (loading) {
    return <div className="text-white/60">Cargando préstamo…</div>;
  }

  if (error || !loan) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{error || "Préstamo no encontrado"}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm"
        >
          Volver
        </button>
      </div>
    );
  }

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
            onClick={approveLoan}
            label="Aprobar préstamo"
          />
        )}

        {loan.status === "APPROVED" && (
          <ActionButton
            loading={actionLoading}
            onClick={disburseLoan}
            label="Desembolsar"
          />
        )}
      </div>

      {/* Installments */}
      <Section title="Cuotas">
        <table className="min-w-full text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Monto</th>
              <th className="px-3 py-2 text-left">Vencimiento</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Pagado</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((i, idx) => (
              <tr key={i.id} className="border-t border-white/10">
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">
                  ${Number(i.amount_cop).toLocaleString("es-CO")}
                </td>
                <td className="px-3 py-2">
                  {new Date(i.due_date).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={i.status} />
                </td>
                <td className="px-3 py-2">
                  {i.paid_at
                    ? new Date(i.paid_at).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Payments */}
      <Section title="Pagos">
        <table className="min-w-full text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="px-3 py-2 text-left">Monto</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-white/10">
                <td className="px-3 py-2">
                  ${Number(p.amount_cop).toLocaleString("es-CO")}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-3 py-2">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  {p.proof_url ? (
                    <a
                      href={`${BACKEND_URL}/${p.proof_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Ver
                    </a>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
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

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 font-bold">{title}</h2>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function ActionButton({ label, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-50"
    >
      {loading ? "Procesando…" : label}
    </button>
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
