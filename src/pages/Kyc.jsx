import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { routeByRole } from "../auth/routeByRole";
import { apiFetch, apiFetchBlob } from "../lib/api";
import { apiUpload } from "../lib/apiMultipart";

import {
  ArrowLeft,
  UploadCloud,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  UserCircle2,
  Home,
  Eye,
  Trash2,
} from "lucide-react";

const REQUIRED = ["ID_FRONT", "ID_BACK", "SELFIE", "PROOF_ADDRESS"];

const LABELS = {
  ID_FRONT: "Cédula (frente)",
  ID_BACK: "Cédula (respaldo)",
  SELFIE: "Selfie",
  PROOF_ADDRESS: "Extracto bancario",
};

const HINTS = {
  ID_FRONT: "Foto nítida del frente de tu cédula.",
  ID_BACK: "Foto nítida del respaldo de tu cédula.",
  SELFIE: "Selfie con buena luz, sin filtros.",
  PROOF_ADDRESS: "Extracto bancario (emitido en los últimos 30 días).",
};

function toneByKycStatus(s) {
  const v = String(s || "").toUpperCase();
  if (v === "APPROVED") return { t: "KYC aprobado", tone: "ok" };
  if (v === "SUBMITTED") return { t: "En revisión", tone: "warn" };
  if (v === "PENDING") return { t: "KYC pendiente", tone: "warn" };
  if (v === "REJECTED") return { t: "KYC rechazado", tone: "bad" };
  return { t: `KYC: ${v || "N/A"}`, tone: "neutral" };
}

function badgeClass(tone) {
  if (tone === "ok") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  if (tone === "warn") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (tone === "bad") return "border-red-400/30 bg-red-400/10 text-red-100";
  return "border-white/10 bg-white/5 text-white/80";
}

function docIcon(type) {
  if (type === "SELFIE") return <UserCircle2 className="h-5 w-5 text-white/80" />;
  if (type === "PROOF_ADDRESS") return <Home className="h-5 w-5 text-white/80" />;
  return <FileText className="h-5 w-5 text-white/80" />;
}

export default function Kyc() {
  const nav = useNavigate();
  const { user, booting, refreshMe } = useAuth();

  const [kycStatus, setKycStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploaded, setUploaded] = useState([]);
  const [missing, setMissing] = useState(REQUIRED);
  const [pct, setPct] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // uploads por tipo
  const [uploading, setUploading] = useState({}); // { ID_FRONT: true }
  const [error, setError] = useState("");

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "CUSTOMER") return <Navigate to={routeByRole(user)} replace />;

  const kycBadge = useMemo(() => toneByKycStatus(kycStatus || user?.kyc_status), [kycStatus, user?.kyc_status]);

  async function loadKyc({ soft = false } = {}) {
    if (!soft) setLoading(true);
    setError("");

    try {
      await refreshMe(); // sincroniza user.kyc_status
      const r = await apiFetch("/kyc/documents", { auth: true });

      setKycStatus(r?.kyc_status || null);
      setDocuments(Array.isArray(r?.documents) ? r.documents : []);
      setUploaded(Array.isArray(r?.uploaded) ? r.uploaded : []);
      setMissing(Array.isArray(r?.missing) ? r.missing : REQUIRED);
      setPct(Number(r?.progress?.pct || 0));
    } catch (e) {
      setError(e?.message || "No se pudo cargar tu KYC.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadKyc({ soft: true });
    } finally {
      setRefreshing(false);
    }
  }

  async function onUpload(type, file) {
    setError("");
    if (!file) return;

    // Validación suave
    const max = 5 * 1024 * 1024;
    if (file.size > max) {
      setError("Archivo demasiado grande (máx. 5MB).");
      return;
    }

    setUploading((m) => ({ ...m, [type]: true }));
    try {
      const fd = new FormData();
      fd.append("document_type", type);
      fd.append("file", file);

      await apiUpload("/kyc/documents", fd, { auth: true });

      // refresca progreso + status (auto SUBMITTED si ya están los 4)
      await loadKyc({ soft: true });
    } catch (e) {
      setError(e?.message || "No se pudo subir el documento.");
    } finally {
      setUploading((m) => ({ ...m, [type]: false }));
    }
  }

  async function onView(doc) {
  if (!doc?.id) return;

  setError("");
  try {
    const { blob, contentType } = await apiFetchBlob(
      `/kyc/documents/${doc.id}/download?disposition=inline`,
      { auth: true }
    );

    const url = URL.createObjectURL(new Blob([blob], { type: contentType }));
    window.open(url, "_blank", "noopener,noreferrer");

    // liberar luego
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    setError(e?.message || "No se pudo abrir el archivo.");
  }
}

async function onDelete(doc) {
  if (!doc?.id) return;

  const ok = window.confirm("¿Eliminar este documento para volver a subirlo?");
  if (!ok) return;

  setError("");
  try {
    await apiFetch(`/kyc/documents/${doc.id}`, { method: "DELETE", auth: true });
    await loadKyc({ soft: true });
  } catch (e) {
    setError(e?.message || "No se pudo eliminar el documento.");
  }
}


  const isComplete = missing.length === 0;
  const isSubmittedOrApproved = ["SUBMITTED", "APPROVED"].includes(String(kycStatus || user?.kyc_status || "").toUpperCase());

  return (
    <div className="bg-aurora min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:pb-8">
        {/* Top bar */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  {/* Left: back + title */}
  <div className="flex items-start gap-3 min-w-0">
    <button
      type="button"
      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 inline-flex items-center gap-2 shrink-0"
      onClick={() => nav("/app")}
      title="Volver"
      aria-label="Volver"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Volver</span>
    </button>

    <div className="min-w-0">
      <div className="text-white font-bold text-lg leading-none">
        Verificación (KYC)
      </div>
      <div className="mt-1 text-sm text-white/70 break-words">
        Sube tus documentos para habilitar la solicitud de préstamo.
      </div>
    </div>
  </div>

  {/* Right: refresh + badge */}
  <div className="flex items-center gap-2 sm:justify-end">
    <button
      type="button"
      onClick={onRefresh}
      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 inline-flex items-center gap-2"
      disabled={refreshing}
      title="Actualizar"
      aria-label="Actualizar"
    >
      <RefreshCcw className="h-4 w-4" />
      <span className="hidden sm:inline">
        {refreshing ? "Actualizando" : "Actualizar"}
      </span>
    </button>

    <div
      className={["badge", badgeClass(kycBadge.tone), "shrink-0"].join(" ")}
    >
      {kycBadge.t}
    </div>
  </div>
</header>

        {/* Resumen */}
        <div className="mt-6 card-glass p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-white font-bold">Progreso</div>
              <div className="mt-1 text-sm text-white/70">
                {isComplete
                  ? isSubmittedOrApproved
                    ? "Documentos completos. Tu KYC está en revisión / aprobado."
                    : "Documentos completos. Se enviará automáticamente a revisión."
                  : `Faltan ${missing.length} de ${REQUIRED.length} documentos.`}
              </div>
            </div>

            <div className="text-white font-bold text-lg">{loading ? "—" : `${pct}%`}</div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-white/40" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
          </div>

          {!loading && missing.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="font-semibold text-white/90">Pendientes:</div>
              <ul className="mt-2 list-disc pl-5">
                {missing.map((t) => (
                  <li key={t}>{LABELS[t] || t}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!loading && String(kycBadge.tone) === "bad" ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 flex gap-3">
              <XCircle className="h-5 w-5 mt-0.5" />
              <div>
                <div className="font-semibold">KYC rechazado</div>
                <div className="mt-1 text-red-100/80">
                  Vuelve a subir documentos claros. Si tienes razón de rechazo, la verás en cada documento.
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Errores */}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {/* Lista de requeridos */}
        <div className="mt-4 grid gap-4">
          {REQUIRED.map((type) => {
            const doc = (documents || []).find((d) => d.document_type === type) || null;
            const status = String(doc?.status || "").toUpperCase();
            const rejectedReason = doc?.rejection_reason || null;

            const isUploaded = uploaded.includes(type);
            const isUploading = !!uploading[type];

            const stateIcon = isUploaded ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-200" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            );

            return (
              <div key={type} className="card-glass p-5">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center">
                      {docIcon(type)}
                    </div>

                    <div>
                      <div className="text-white font-bold">{LABELS[type] || type}</div>
                      <div className="mt-1 text-sm text-white/70">{HINTS[type]}</div>

                      <div className="mt-2 text-xs text-white/60">
                        Estado:{" "}
                        <span className="font-semibold text-white/80">
                          {isUploaded ? "SUBIDO" : status || "PENDIENTE"}
                        </span>
                        {rejectedReason ? (
                          <span className="ml-2 text-red-100/80">• Motivo: {rejectedReason}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
  {stateIcon}

  {/* Ver archivo: solo si existe doc y está UPLOADED */}
  {doc?.id && isUploaded ? (
    <button
      type="button"
      onClick={() => onView(doc)}
      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 inline-flex items-center justify-center gap-2"
      title="Ver archivo"
      aria-label="Ver archivo"
    >
      <Eye className="h-4 w-4" />
      <span className="hidden md:inline">Ver</span>
    </button>
  ) : null}

  {/* Eliminar/Reset: solo si doc está REJECTED */}
  {doc?.id && String(doc?.status || "").toUpperCase() === "REJECTED" ? (
    <button
      type="button"
      onClick={() => onDelete(doc)}
      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 inline-flex items-center justify-center gap-2"
      title="Eliminar"
      aria-label="Eliminar"
    >
      <Trash2 className="h-4 w-4" />
      <span className="hidden md:inline">Eliminar</span>
    </button>
  ) : null}

  {/* Upload / Replace (icon-only en mobile como ya lo dejaste) */}
  <label
    className={[
      "btn-primary inline-flex items-center justify-center gap-2 cursor-pointer shrink-0",
      "px-3 py-2",
    ].join(" ")}
    title={isUploading ? "Subiendo..." : isUploaded ? "Reemplazar" : "Subir"}
    aria-label={isUploading ? "Subiendo..." : isUploaded ? "Reemplazar" : "Subir"}
  >
    <UploadCloud className="h-4 w-4" />
    <span className="hidden sm:inline">
      {isUploading ? "Subiendo..." : isUploaded ? "Reemplazar" : "Subir"}
    </span>
    <input
      type="file"
      className="hidden"
      accept="image/jpeg,image/png,application/pdf"
      disabled={isUploading || isSubmittedOrApproved}
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        onUpload(type, f);
      }}
    />
  </label>
</div>

                </div>

                {isSubmittedOrApproved ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                    Tus documentos están <span className="font-semibold">en revisión</span> o{" "}
                    <span className="font-semibold">aprobados</span>. Si necesitas re-subir, lo habilitamos luego según tu política.
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Safe area */}
        <div className="h-6" />
      </div>

      {/* Nav inferior (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="mx-auto max-w-4xl px-4 pb-4">
          <div className="card-glass px-3 py-3 flex items-center justify-between">
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() => nav("/app")}
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
