import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

function getRiskBadge(loan) {
  if (loan.status === "CLOSED") {
    return {
      label: "CLOSED",
      color: "bg-white/10 text-white/60",
    };
  }

  if (!loan.disbursed_at) {
    return null;
  }

  const due = new Date(loan.disbursed_at);
  due.setMonth(due.getMonth() + loan.term_months);

  const now = new Date();
  const diffDays = Math.floor(
    (now - due) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return { label: "ACTIVE", color: "bg-green-600/20 text-green-300" };
  }

  if (diffDays <= 30) {
    return { label: "LATE", color: "bg-yellow-600/20 text-yellow-300" };
  }

  return { label: "DEFAULT", color: "bg-red-600/20 text-red-300" };
}

function getRowHighlight(riskLabel) {
  if (riskLabel === "DEFAULT") {
    return "bg-red-900/20 border border-red-700/40";
  }

  if (riskLabel === "LATE") {
    return "bg-yellow-900/10";
  }

  return "";
}


export default function CreditLoansAdmin() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/admin/credits/${userId}/loans`)
      .then(res => {
        setLoans(res.loans || []);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSuspendProfile() {
    const confirm = window.confirm(
      "⚠️ ¿Seguro que deseas SUSPENDER este perfil de crédito?\n\nEsta acción bloqueará al usuario."
    );
  
    if (!confirm) return;
  
    try {
      await apiFetch(`/admin/credits/${userId}/suspend`, {
        method: "POST",
        body: JSON.stringify({
          reason: "Mora prolongada (DEFAULT)",
        }),
      });
  
      alert("Perfil suspendido correctamente");
    } catch (err) {
      alert(err.message || "Error al suspender el perfil");
    }
  }

  const hasDefault = loans.some(
    l => getRiskBadge(l)?.label === "DEFAULT"
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black">
          Préstamos del usuario
        </h1>

        

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm"
          >
            ← Volver
          </button>

          <button
            onClick={handleSuspendProfile}
            disabled={!hasDefault}
            className={`
              rounded-lg px-4 py-2 text-sm font-semibold
              ${hasDefault
                ? "bg-red-600/20 border border-red-600/40 text-red-300 hover:bg-red-600/30"
                : "bg-white/5 text-white/30 cursor-not-allowed"}
            `}
          >
            Suspender perfil
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-white/60">
          Cargando préstamos…
        </p>
      )}

      {!loading && loans.length === 0 && (
        <p className="text-white/50">
          No hay préstamos registrados para este usuario.
        </p>
      )}

      {!!loans.length && (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Monto (COP)</th>
                <th className="px-4 py-3 text-left">Pagado</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Vence</th>
                <th className="px-4 py-3 text-left">Riesgo</th>
              </tr>
            </thead>

            <tbody>
  {loans.map(l => {
    const risk = getRiskBadge(l);

    return (
      <tr
        key={l.id}
        className={`
          border-t border-white/5
          hover:bg-white/5
          ${getRowHighlight(risk?.label)}
        `}
      >
        <td className="px-4 py-3 font-mono text-xs">
          {l.id}
        </td>

        <td className="px-4 py-3">
          {Number(l.amount_cop).toLocaleString("es-CO")}
        </td>

        <td className="px-4 py-3">
          {Number(l.total_paid_cop || 0).toLocaleString("es-CO")}
        </td>

        <td className="px-4 py-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
            {l.status}
          </span>
        </td>

        <td className="px-4 py-3">
          {l.due_date
            ? new Date(l.due_date).toLocaleDateString()
            : "—"}
        </td>

        <td className="px-4 py-3">
          {risk ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${risk.color}`}
            >
              {risk.label}
              {risk.label === "DEFAULT" && " ⚠️"}
            </span>
          ) : (
            <span className="text-white/40">—</span>
          )}
        </td>
      </tr>
    );
  })}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
}
