// src/pages/AppHome.jsx
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { routeByRole } from "../auth/routeByRole";
import { apiFetch } from "../lib/api";
import logo from '../assets/fluuyo-logo-web-outlines.svg';
console.log("logo import ->", logo);

import {
  LogOut,
  RefreshCcw,
  ShieldCheck,
  BadgeCheck,
  Wallet,
  X,
  Banknote,
  Home,
  CreditCard,
  User as UserIcon,
} from "lucide-react";

function fmtCOP(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

function kycLabel(s) {
  const v = String(s || "").toUpperCase();
  if (v === "APPROVED") return { t: "KYC aprobado", tone: "ok" };
  if (v === "PENDING") return { t: "KYC pendiente", tone: "warn" };
  if (v === "REJECTED") return { t: "KYC rechazado", tone: "bad" };
  if (v === "SUBMITTED") return { t: "KYC: En revisión", tone: "neutral" };
  return { t: `KYC: ${v || "N/A"}`, tone: "neutral" };
}

function loanStatusLabel(s) {
  const v = String(s || "").toUpperCase();
  if (v === "PENDING") return { t: "En revisión", tone: "warn" };
  if (v === "APPROVED") return { t: "Aprobado", tone: "ok" };
  if (v === "DISBURSED") return { t: "Desembolsado", tone: "ok" };
  return { t: v || "—", tone: "neutral" };
}

function clampInt(v, min, max) {
  const n = Number(String(v).replace(/[^\d]/g, "")) || 0;
  return Math.max(min, Math.min(max, n));
}

function stepsForLimit(limit) {
  // Escalones suaves para slider (no “prometen” montos que no tienes)
  const base = [100000, 200000, 300000, 500000, 1000000];
  const max = Math.max(100000, Number(limit || 100000));
  return base.filter((x) => x <= max);
}

export default function AppHome() {
  const nav = useNavigate();
  const { user, booting, logout, refreshMe } = useAuth();

  const [credit, setCredit] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [installments, setInstallments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modal solicitar préstamo
  const [openApply, setOpenApply] = useState(false);
  const [principal, setPrincipal] = useState(200000);
  const [term, setTerm] = useState(2);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");

  // Bottom nav (mobile)
  const [tab, setTab] = useState("home"); // "home" | "loan" | "payments" | "profile"

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "CUSTOMER") return <Navigate to={routeByRole(user)} replace />;

  const kyc = useMemo(() => kycLabel(user?.kyc_status), [user?.kyc_status]);
  const canRequestLoan = String(user?.kyc_status || "").toUpperCase() === "APPROVED";

  const loanStatus = useMemo(
    () => loanStatusLabel(activeLoan?.status),
    [activeLoan?.status]
  );

  const nextInstallment = useMemo(() => {
    const list = installments || [];
    return list.find((x) => String(x.status || "").toUpperCase() !== "PAID") || null;
  }, [installments]);

  const hasActiveLoan = !!activeLoan;

  const limit = useMemo(() => {
    const v = Number(credit?.current_limit_cop || 100000);
    return Math.max(100000, v);
  }, [credit?.current_limit_cop]);

  const sliderSteps = useMemo(() => stepsForLimit(limit), [limit]);
  const sliderMax = useMemo(() => {
    // Si el cupo es menor a 150k, max=100k igual.
    return Math.max(100000, limit);
  }, [limit]);

  const hasCreditHistory = useMemo(() => {
    return Number(credit?.loans_repaid || 0) > 0;
  }, [credit]);

  async function loadAll({ soft = false } = {}) {
    if (!soft) setLoading(true);
    setError("");

    try {
      await refreshMe();

      const [cp, la] = await Promise.all([
        apiFetch("/me/credit-profile", { auth: true }),
        apiFetch("/loans/active", { auth: true }),
      ]);

      setCredit(cp?.credit_profile || null);
      setActiveLoan(la?.loan || null);
      setInstallments(Array.isArray(la?.installments) ? la.installments : []);
    } catch (e) {
      setError(e?.message || "No se pudo cargar tu información.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadAll({ soft: true });
    } finally {
      setRefreshing(false);
    }
  }

  function openApplyModal() {
    // Inicial: por defecto al cupo (pero nunca más del cupo)
    const initial = clampInt(limit, 100000, limit);
    setPrincipal(initial);
    setTerm(2);
    setApplyError("");
    setOpenApply(true);
  }

  async function applyLoan() {
    setApplyError("");

    const p = clampInt(principal, 100000, sliderMax);
    if (![2, 3].includes(Number(term))) {
      setApplyError("Selecciona un plazo válido (2 o 3 meses).");
      return;
    }

    if (p > limit) {
      setApplyError(`El monto excede tu cupo actual (${fmtCOP(limit)}).`);
      return;
    }

    setApplyLoading(true);
    try {
      await apiFetch("/loans/apply", {
        method: "POST",
        auth: true,
        body: { principal_cop: p, term_months: Number(term) },
      });

      setOpenApply(false);
      await loadAll({ soft: true });
      setTab("payments"); // buena UX: tras solicitar, llévalo a ver estado
    } catch (e) {
      setApplyError(e?.message || "No se pudo solicitar el préstamo.");
    } finally {
      setApplyLoading(false);
    }
  }

  function jumpToAmount(amount) {
    const v = clampInt(amount, 100000, limit);
    setPrincipal(v);
  }

  const contentPadBottom = "pb-32 sm:pb-16"; // deja espacio para bottom nav

  return (
    <div className="bg-aurora min-h-screen">
      <div className={`mx-auto max-w-6xl px-4 py-6 ${contentPadBottom}`}>
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center">
              <span className="text-lg font-black tracking-tight text-white">
                <img
                  src={logo}
                  alt="Fluuyo"
                  className="h-10 w-auto"
                  loading="eager"
                />
              </span>
            </div>

            <div>
              <div className="text-white text-sm font-semibold leading-none">
                Hola, {user?.first_name || "usuario"}
              </div>
              <div className="text-xs text-white/70">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 inline-flex items-center gap-2"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Secciones (en mobile las “tabs” controlan qué se ve) */}
        <main className="mt-6">
          {/* HOME TAB */}
          <div className={tab === "home" ? "block" : "hidden sm:block"}>
            {/* Estado */}
            <div className="card-glass p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-white font-bold text-lg">Tu estado</div>
                  <div className="mt-1 text-sm text-white/70">
                    Revisa tu KYC y tu cupo disponible.
                  </div>
                </div>

                <div
                  className={[
                    "badge",
                    kyc.tone === "ok"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                      : kyc.tone === "warn"
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                      : kyc.tone === "bad"
                      ? "border-red-400/30 bg-red-400/10 text-red-100"
                      : "",
                  ].join(" ")}
                >
                  {kyc.t}
                </div>
              </div>

              {!canRequestLoan && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-white/80 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Completa tu verificación de identidad
                      </div>
                      <div className="mt-1 text-sm text-white/70">
                        Para solicitar préstamos necesitas KYC aprobado.
                      </div>

                      <button
                        type="button"
                        className="mt-3 btn-primary"
                        onClick={() => nav("/app/kyc")}
                      >
                        Iniciar KYC
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {/* Grid cards */}
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="card-glass p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/70">Cupo disponible</div>
                  <Wallet className="h-5 w-5 text-white/80" />
                </div>

                <div className="mt-2 text-2xl font-black text-white">
                  {loading ? "—" : fmtCOP(credit?.current_limit_cop)}
                </div>
                <div className="mt-1 text-xs text-white/60">
                  Máximo: {loading ? "—" : fmtCOP(credit?.max_limit_cop)}
                </div>

                <div className="mt-3 text-xs text-white/60">
                  Empieza con <b>100.000 COP</b>. Si pagas a tiempo, tu cupo aumenta
                  automáticamente.
                </div>
              </div>

              <div className="card-glass p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/70">Mi Score</div>
                  <BadgeCheck className="h-5 w-5 text-white/80" />
                </div>

                <div className="mt-2 text-2xl font-black text-white">
                  {loading
                    ? "—"
                    : hasCreditHistory
                    ? credit?.score ?? "—"
                    : "Inicial"}
                </div>

                <div className="mt-2 text-xs text-white/60">
                  {loading ? (
                    "—"
                  ) : hasCreditHistory ? (
                    <>
                      Historial: {credit?.loans_repaid ?? 0} préstamos pagados •
                      A tiempo: {credit?.on_time_loans ?? 0} •
                      Tarde: {credit?.late_loans ?? 0}
                    </>
                  ) : (
                    "Aún no tienes historial crediticio"
                  )}
                </div>
              </div>

              <div className="card-glass p-5">
                <div className="text-sm text-white/70">Acción rápida</div>
                <div className="mt-2 text-sm text-white/70">
                  Solicita un préstamo cuando estés listo.
                </div>

                <button
                  type="button"
                  className="mt-4 btn-primary w-full"
                  disabled={!canRequestLoan || hasActiveLoan}
                  onClick={openApplyModal}
                >
                  Solicitar préstamo
                </button>

                {!canRequestLoan ? (
                  <div className="mt-2 text-xs text-white/50">
                    Requiere KYC aprobado.
                  </div>
                ) : null}

                {hasActiveLoan ? (
                  <div className="mt-2 text-xs text-white/50">
                    Ya tienes un préstamo en curso.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* PAYMENTS TAB / Préstamo */}
          <div className={tab === "payments" ? "block" : "hidden sm:block"}>
            {/* Préstamo activo */}
            <div className="mt-4 card-glass p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-white font-bold">Tu préstamo</div>
                  <div className="mt-1 text-sm text-white/70">
                    Estado, cuotas y próximo pago.
                  </div>
                </div>

                {activeLoan ? (
                  <div
                    className={[
                      "badge",
                      loanStatus.tone === "ok"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                        : loanStatus.tone === "warn"
                        ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                        : "",
                    ].join(" ")}
                  >
                    {loanStatus.t}
                  </div>
                ) : (
                  <div className="badge border-white/10 bg-white/5 text-white/80">
                    Sin préstamo activo
                  </div>
                )}
              </div>

              {!loading && !activeLoan ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                  No tienes un préstamo en curso. Cuando lo solicites, aquí verás tu estado y cuotas.
                </div>
              ) : null}

              {!loading && activeLoan ? (
                <>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">Monto</div>
                      <div className="mt-1 text-lg font-bold text-white">
                        {fmtCOP(activeLoan?.principal_cop)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">Plazo</div>
                      <div className="mt-1 text-lg font-bold text-white">
                        {activeLoan?.term_months} meses
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">Cuota</div>
                      <div className="mt-1 text-lg font-bold text-white">
                        {fmtCOP(activeLoan?.installment_amount_cop)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Próxima cuota</div>
                        <div className="mt-1 text-sm text-white/70">
                          {nextInstallment
                            ? `#${nextInstallment.installment_number} • vence ${nextInstallment.due_date}`
                            : "No hay cuotas pendientes."}
                        </div>
                      </div>

                      <div className="text-white font-bold">
                        {nextInstallment ? fmtCOP(nextInstallment.amount_due_cop) : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-white">Cuotas</div>
                    <div className="mt-2 grid gap-2">
                      {(installments || []).map((x) => (
                        <div
                          key={x.id}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3"
                        >
                          <div className="text-sm text-white/80">
                            #{x.installment_number} • {x.due_date}
                            <div className="text-xs text-white/60">
                              Estado: {String(x.status || "—")}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-white">
                            {fmtCOP(x.amount_due_cop)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="btn-ghost w-full"
                      onClick={() => alert("Siguiente paso: ver detalle del préstamo")}
                    >
                      Ver detalle
                    </button>

                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={() => alert("Siguiente paso: registrar pago con evidencia")}
                      disabled={String(activeLoan?.status || "").toUpperCase() !== "DISBURSED"}
                      title={
                        String(activeLoan?.status || "").toUpperCase() !== "DISBURSED"
                          ? "Disponible cuando el préstamo esté desembolsado"
                          : "Registrar pago"
                      }
                    >
                      Registrar pago
                    </button>
                  </div>

                  {String(activeLoan?.status || "").toUpperCase() !== "DISBURSED" ? (
                    <div className="mt-2 text-xs text-white/50">
                      “Registrar pago” se habilita cuando el préstamo esté <b>DISBURSED</b>.
                    </div>
                  ) : null}
                </>
              ) : null}

              {loading ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  Cargando tu préstamo...
                </div>
              ) : null}
            </div>
          </div>

          {/* PROFILE TAB (placeholder) */}
          <div className={tab === "profile" ? "block" : "hidden sm:block"}>
            <div className="mt-4 card-glass p-5">
              <div className="text-white font-bold">Tu perfil</div>
              <div className="mt-1 text-sm text-white/70">
                Próximo paso: datos personales y flujo de KYC.
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Email: <b>{user?.email}</b>
                <br />
                Teléfono: <b>{user?.phone || "—"}</b>
                <br />
                KYC: <b>{String(user?.kyc_status ? "PENDIENTE" : "—")}</b>
              </div>

              <button
                type="button"
                className="mt-4 btn-primary"
                onClick={() => nav("/app/kyc")}
              >
                Ir a verificación (KYC)
              </button>
            </div>
          </div>
        </main>
        <footer className="mt-10">
          <div className="card-glass px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white/80 font-semibold">
                Fluuyo • Friendly Finance
              </div>

              <div className="text-xs text-white/60">
                © {new Date().getFullYear()} Fluuyo • Hecho para LatAm
                <span className="text-white/40"> • </span>
                Start Waves LLC
              </div>
            </div>
          </div>

          {/* safe area extra */}
          <div className="h-4 sm:hidden" />
        </footer>

      </div>

      {/* Bottom navigation – solo mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden">
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl">
            <div className="grid grid-cols-4">
              <button
                type="button"
                onClick={() => setTab("home")}
                className={[
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs",
                  tab === "home" ? "text-white" : "text-white/70",
                ].join(" ")}
              >
                <Home className="h-5 w-5" />
                Inicio
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab("home");
                  openApplyModal();
                }}
                disabled={!canRequestLoan || hasActiveLoan}
                className={[
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs",
                  !canRequestLoan || hasActiveLoan ? "text-white/30" : "text-white/70 hover:text-white",
                ].join(" ")}
              >
                <Banknote className="h-5 w-5" />
                Pedir
              </button>

              <button
                type="button"
                onClick={() => setTab("payments")}
                className={[
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs",
                  tab === "payments" ? "text-white" : "text-white/70",
                ].join(" ")}
              >
                <CreditCard className="h-5 w-5" />
                Pagos
              </button>

              <button
                type="button"
                onClick={() => setTab("profile")}
                className={[
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs",
                  tab === "profile" ? "text-white" : "text-white/70",
                ].join(" ")}
              >
                <UserIcon className="h-5 w-5" />
                Perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Solicitar préstamo */}
      {openApply ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => (applyLoading ? null : setOpenApply(false))}
          />

          {/* Sheet/Card */}
          <div className="relative w-full sm:max-w-lg mx-auto p-4 sm:p-0">
            <div className="card-glass p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-bold text-lg">Solicitar préstamo</div>
                  <div className="mt-1 text-sm text-white/70">
                    Elige el monto y el plazo. Verificaremos tu elegibilidad.
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-xl border border-white/15 bg-white/5 p-2 text-white/80 hover:bg-white/10"
                  onClick={() => (applyLoading ? null : setOpenApply(false))}
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/70">Cupo actual</div>
                    <div className="text-sm font-semibold text-white">
                      {fmtCOP(limit)}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-white/60">
                    Empieza con <b>100.000 COP</b>. Si pagas a tiempo, tu cupo sube a{" "}
                    <b>200.000</b>, luego <b>300.000</b> y <b>500.000</b>.
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Monto (COP)
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <input
                      className="input"
                      value={principal}
                      onChange={(e) =>
                        setPrincipal(clampInt(e.target.value, 100000, limit))
                      }
                      inputMode="numeric"
                      placeholder="100000"
                      disabled={applyLoading}
                    />

                    {/* Quick steps (según cupo) */}
                    {sliderSteps.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sliderSteps.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            disabled={applyLoading}
                            onClick={() => jumpToAmount(amt)}
                            className={[
                              "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                              Number(principal) === amt
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                                : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                            ].join(" ")}
                          >
                            {fmtCOP(amt)}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {/* Slider (máximo = cupo real) */}
                    <input
                      className="mt-3 w-full"
                      type="range"
                      min={100000}
                      max={sliderMax}
                      step={50000}
                      value={Number(principal) || 100000}
                      onChange={(e) =>
                        setPrincipal(clampInt(e.target.value, 100000, limit))
                      }
                      disabled={applyLoading}
                    />

                    <div className="mt-2 text-xs text-white/60">
                      Seleccionado:{" "}
                      <span className="font-semibold">{fmtCOP(principal)}</span>{" "}
                      <span className="text-white/40">•</span>{" "}
                      Máximo hoy: <span className="font-semibold">{fmtCOP(limit)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Plazo
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTerm(2)}
                      disabled={applyLoading}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-semibold",
                        term === 2
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                      ].join(" ")}
                    >
                      2 meses
                    </button>

                    <button
                      type="button"
                      onClick={() => setTerm(3)}
                      disabled={applyLoading}
                      className={[
                        "rounded-2xl border px-4 py-3 text-sm font-semibold",
                        term === 3
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                      ].join(" ")}
                    >
                      3 meses
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    Nota: el backend puede restringir plazo según tu riesgo.
                  </div>
                </div>

                {applyError ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {applyError}
                  </div>
                ) : null}

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    className="btn-ghost w-full sm:w-auto"
                    onClick={() => setOpenApply(false)}
                    disabled={applyLoading}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
                    onClick={applyLoan}
                    disabled={applyLoading}
                  >
                    <Banknote className="h-4 w-4" />
                    {applyLoading ? "Enviando..." : "Confirmar solicitud"}
                  </button>
                </div>
              </div>
            </div>

            {/* Safe area (mobile) */}
            <div className="h-6 sm:hidden" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
