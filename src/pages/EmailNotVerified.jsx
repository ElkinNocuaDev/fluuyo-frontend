import { useState } from "react";
import axios from "axios";

export default function EmailNotVerified() {
  const [email, setEmail] = useState("");
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
        Ingresa tu email para reenviar el enlace de verificación.
      </p>

      <input
        type="email"
        className="border p-2 w-full mb-4"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleResend}
        className="bg-blue-600 text-white px-4 py-2 w-full"
      >
        Reenviar correo
      </button>

      {sent && (
        <p className="text-green-600 mt-4">
          Si el correo existe, se ha enviado un nuevo enlace.
        </p>
      )}
    </div>
  );
}
