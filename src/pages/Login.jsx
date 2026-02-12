import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../auth/AuthProvider";
import { routeByRole } from "../auth/routeByRole";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
      const u = await login({ email: email.trim(), password });
      nav(routeByRole(u), { replace: true });
    } catch (err) {
      if (err?.code === "EMAIL_NOT_VERIFIED") {
        nav("/resend-verification", {
          state: { email: email.trim() },
          replace: true,
        });
      } else {
        setError(err?.message || "No se pudo iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Accede a tu cuenta para ver tu cupo, estado de KYC y préstamos."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link className="link" to="/register">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            className="input"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Contraseña
          </label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-400"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Recordarme
          </label>

          <button type="button" className="link text-sm">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <button type="button" className="btn-ghost w-full">
          Continuar con Google
        </button>
      </form>
    </AuthLayout>
  );
}
