import { useLocation } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "../lib/api"; // <-- usar apiFetch en lugar de axios

export default function EmailNotVerified() {
  const location = useLocation();
  const initialEmail = location.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
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
    <div className="max-w-md mx-auto mt-20 text-center">
      <h2 className="text-xl font-bold mb-4">
        Tu correo no ha sido verificado
      </h2>

      <p className="mb-6">
        Te enviamos un enlace de verificación. Si no lo recibiste,
        puedes solicitar uno nuevo.
      </p>

      <input
        type="email"
        className="input mb-4 w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleResend}
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? "Enviando..." : "Reenviar correo"}
      </button>

      {sent && (
        <p className="text-emerald-400 mt-4">
          Si el correo existe, se ha enviado un nuevo enlace.
        </p>
      )}

      {error && (
        <p className="text-red-400 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
