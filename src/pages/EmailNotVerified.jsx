import { useLocation } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function EmailNotVerified() {
  const location = useLocation();
  const initialEmail = location.state?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    await axios.post("/api/auth/resend-verification", { email });
    setSent(true);
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
      >
        Reenviar correo
      </button>

      {sent && (
        <p className="text-emerald-400 mt-4">
          Si el correo existe, se ha enviado un nuevo enlace.
        </p>
      )}
    </div>
  );
}
