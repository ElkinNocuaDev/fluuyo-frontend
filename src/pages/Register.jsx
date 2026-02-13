import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../auth/AuthProvider";
// import { routeByRole } from "../auth/routeByRole";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const CO_PHONE_REGEX = /^(?:\+?57)?3\d{9}$/;

  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (!first_name.trim() || !last_name.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }

    if (!email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    if (!CO_PHONE_REGEX.test(cleanPhone)) {
      setError("Ingresa un número celular colombiano válido.");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y carácter especial."
      );
      return;
    }

    if (!terms) {
      setError("Debes aceptar los Términos y la Política de privacidad.");
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: cleanPhone,
        password,
      });

      nav("/check-email", {
        replace: true,
        state: { email },
      });

    } catch (err) {
      setError(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }



  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="En minutos podrás validar tu identidad y solicitar tu primer préstamo."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link className="link" to="/login">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Nombre
            </label>
            <input
              className="input"
              placeholder="John"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Apellido
            </label>
            <input
              className="input"
              placeholder="Doe"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

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
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Teléfono
          </label>
          <input
            className="input"
            placeholder="+57 3xx xxx xxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="numeric"
            required
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
            autoComplete="new-password"
            required
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-emerald-400"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          <span>
            Acepto los <span className="link">Términos</span> y la{" "}
            <span className="link">Política de privacidad</span>.
          </span>
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </AuthLayout>
  );
}
