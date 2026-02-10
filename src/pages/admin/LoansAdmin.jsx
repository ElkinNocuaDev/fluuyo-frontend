import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "DISBURSED", label: "Disbursed" },
  { value: "CLOSED", label: "Closed" },
  { value: "REJECTED", label: "Rejected" },
];

export default function LoansAdmin() {
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const fetchLoans = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (status) params.set("status", status);

    const data = await apiFetch(
      `/admin/loans?${params.toString()}`
    );

    setLoans(data.loans || []);
    setTotal(data.total || 0);
  } catch (err) {
    console.error(err);
    setLoans([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Gestión de Prestamos</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
  value={status}
  onChange={(e) => {
    setPage(1);
    setStatus(e.target.value);
  }}
  className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white"
>
  {STATUSES.map((s) => (
    <option
      key={s.value}
      value={s.value}
      className="text-black bg-white"
    >
      {s.label}
    </option>
  ))}
</select>


        <div className="text-sm text-white/60">
          Total: <span className="font-semibold">{total}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Monto</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Creado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-white/60">
                  Cargando préstamos…
                </td>
              </tr>
            )}

            {!loading && loans.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-white/60">
                  No hay préstamos
                </td>
              </tr>
            )}

            {!loading &&
              loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{loan.email}</div>
                    <div className="text-xs text-white/50">
                      {loan.user_id}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    ${Number(loan.principal_cop).toLocaleString("es-CO")}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={loan.status} />
                  </td>

                  <td className="px-4 py-3 text-white/70">
                    {new Date(loan.created_at).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/loans/${loan.id}`)}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-white/90"
                    >
                      Detalle
                    </button>

                    <button
                      onClick={() => navigate(`/admin/loans/${loan.id}/payments`)}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Pagos
                    </button>
                  </div>
                </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">
          Página {page} de {totalPages}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ←
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
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
