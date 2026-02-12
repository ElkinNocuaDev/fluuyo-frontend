import { useLocation } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import AuthLayout from "../components/AuthLayout";

export default function EmailNotVerified() {
  const location = useLocation();
  const initialEmail = location.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/resend-verification", {
        method: "POST",
        auth: false,
        body: { email },
      });
      setSent(true);
    } catch (err) {
      setError(err?.message || "No se pudo reenviar el correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Correo no verificado"
      subtitle="Te enviamos un enlace de verificación. Si no lo recibiste, solicita uno nuevo."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <a href="/register" className="link">
            Crear cuenta
          </a>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleResend}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            type="email"
            className="input"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {sent && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            Si el correo existe, se ha enviado un nuevo enlace.
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Enviando..." : "Reenviar correo"}
        </button>
      </form>
    </AuthLayout>
  );
}
