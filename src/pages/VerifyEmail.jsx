import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import AuthLayout from "../components/AuthLayout";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token no válido.");
      return;
    }

    const verify = async () => {
      try {
        await apiFetch("/auth/verify-email", {
          method: "POST",
          auth: false,
          body: { token },
        });

        setStatus("success");
        setMessage("Correo verificado correctamente.");

        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate("/login");
        }, 2000);

      } catch (err) {
        setStatus("error");
        setMessage(err?.message || "Token inválido o expirado.");
      }
    };

    verify();
  }, [location.search, navigate]);

  return (
    <AuthLayout
      title="Verificación de correo"
      subtitle={
        status === "loading"
          ? "Verificando tu correo..."
          : message
      }
    >
      {status === "loading" && (
        <div className="text-center text-slate-300">
          Procesando...
        </div>
      )}

      {status === "success" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {message}
        </div>
      )}
    </AuthLayout>
  );
}
