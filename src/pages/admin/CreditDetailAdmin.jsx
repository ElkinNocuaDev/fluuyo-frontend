import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function CreditAdmin() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    current_limit_cop: "",
    max_limit_cop: "",
    risk_tier: "LOW",
    is_suspended: false,
    suspension_reason: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(
          `/admin/credit/profiles/${userId}`
        );

        if (!res.profile) {
          throw new Error("Perfil de crédito no encontrado.");
        }

        setProfile(res.profile);
        setForm({
          current_limit_cop: res.profile.current_limit_cop ?? "",
          max_limit_cop: res.profile.max_limit_cop ?? "",
          risk_tier: res.profile.risk_tier ?? "LOW",
          is_suspended: !!res.profile.is_suspended,
          suspension_reason: res.profile.suspension_reason ?? "",
        });
      } catch (e) {
        console.error(e);
        setError(e.message || "Error cargando perfil de crédito.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const saveChanges = async () => {
    if (
      Number(form.current_limit_cop) >
      Number(form.max_limit_cop)
    ) {
      alert("El cupo actual no puede ser mayor al cupo máximo.");
      return;
    }

    if (form.is_suspended && !form.suspension_reason.trim()) {
      alert("Debes indicar el motivo de la suspensión.");
      return;
    }

    try {
      setSaving(true);

      await apiFetch(`/admin/credit/profiles/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          current_limit_cop: Number(form.current_limit_cop),
          max_limit_cop: Number(form.max_limit_cop),
          risk_tier: form.risk_tier,
          is_suspended: form.is_suspended,
          suspension_reason: form.is_suspended
            ? form.suspension_reason
            : null,
        }),
      });

      alert("Perfil de crédito actualizado correctamente.");
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el perfil de crédito.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-white/60">Cargando perfil de crédito…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 p-4 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Crédito del usuario
          </h1>
          <p className="text-white/60">{profile.email}</p>
          <p className="mt-1 font-mono text-xs text-white/40">
            {profile.user_id}
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          ← Volver
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <SummaryCard label="Score" value={profile.score} />
        <SummaryCard label="Risk tier" value={profile.risk_tier} />
        <SummaryCard
          label="Cupo actual"
          value={`$${Number(profile.current_limit_cop).toLocaleString("es-CO")}`}
        />
        <SummaryCard
          label="Cupo máximo"
          value={`$${Number(profile.max_limit_cop).toLocaleString("es-CO")}`}
        />
        <SummaryCard label="KYC" value={profile.kyc_status} />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Préstamos pagados" value={profile.loans_repaid} />
        <SummaryCard label="A tiempo" value={profile.on_time_loans} />
        <SummaryCard label="En mora" value={profile.late_loans} />
      </div>

      {/* Form ADMIN */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white">
          Configuración de crédito
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Cupo actual (COP)">
            <input
              type="number"
              value={form.current_limit_cop}
              onChange={(e) =>
                setForm({ ...form, current_limit_cop: e.target.value })
              }
              className="input"
            />
          </Field>

          <Field label="Cupo máximo (COP)">
            <input
              type="number"
              value={form.max_limit_cop}
              onChange={(e) =>
                setForm({ ...form, max_limit_cop: e.target.value })
              }
              className="input"
            />
          </Field>

          <Field label="Risk tier">
            <select
              value={form.risk_tier}
              onChange={(e) =>
                setForm({ ...form, risk_tier: e.target.value })
              }
              className="input text-white"
            >
              <option value="LOW" className="bg-white text-black">
                LOW
              </option>
              <option value="MEDIUM" className="bg-white text-black">
                MEDIUM
              </option>
              <option value="HIGH" className="bg-white text-black">
                HIGH
              </option>
            </select>

          </Field>

          <Field label="Suspender crédito">
            <input
              type="checkbox"
              checked={form.is_suspended}
              onChange={(e) =>
                setForm({ ...form, is_suspended: e.target.checked })
              }
            />
          </Field>
        </div>

        {form.is_suspended && (
          <Field label="Motivo de suspensión">
            <textarea
              rows={3}
              value={form.suspension_reason}
              onChange={(e) =>
                setForm({ ...form, suspension_reason: e.target.value })
              }
              className="input"
            />
          </Field>
        )}

        <div className="flex justify-end">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-white/60">{label}</span>
      {children}
    </label>
  );
}
