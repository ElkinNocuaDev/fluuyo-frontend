import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";

export default function KycUserDetailAdmin() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Cargar documentos del usuario
  const loadDocs = async () => {
  try {
    const res = await apiFetch(`/admin/kyc/users/${userId}`);
    setDocs(res.documents || []);
    setUser(res.user);
  } catch (err) {
    console.error("Error cargando documentos KYC:", err);
    alert("Error cargando documentos");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadDocs();
  }, [userId]);

  // Revisar documento (APPROVED / REJECTED)
  const review = async (id, status) => {
    try {
      await apiFetch(`/admin/kyc/documents/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      loadDocs();
    } catch (err) {
      console.error("Error revisando documento:", err);
      alert("Error revisando documento");
    }
  };

  // Ver archivo en navegador usando tu endpoint /view
  const viewDocument = (fileUrl) => {
  console.log("viewDocument recibe:", fileUrl);

  if (!fileUrl?.startsWith("uploads/")) {
    console.error("file_url inválido:", fileUrl);
    return;
  }

  const url = `${import.meta.env.VITE_API_URL}/${fileUrl}`;
  window.open(url, "_blank", "noopener,noreferrer");
};



  if (loading) return <p className="text-white/60">Cargando…</p>;

  return (
  <div className="relative space-y-6">
    {/* Botón volver */}
    <button
      onClick={() => navigate(-1)}
      className="absolute top-0 right-0 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
    >
      ← Volver
    </button>

    {/* Título */}
    <h2 className="text-xl font-semibold text-white pt-12">
      Documentos KYC
    </h2>

    {user && (
  <div className="rounded-xl border border-white/10 p-4 bg-white/5">
    <div className="text-white font-medium">{user.name}</div>
    <div className="text-sm text-white/60">{user.email}</div>
    <div className="text-xs text-white/40 mt-1">
      Estado KYC: {user.kyc_status}
    </div>
  </div>
)}

    {docs.map((d) => (
      <div
        key={d.id}
        className="rounded-xl border border-white/10 p-4 space-y-2"
      >
        <div className="flex justify-between">
          <span className="text-white">{d.document_type}</span>
          <span className="text-white/60 text-xs">{d.status}</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => viewDocument(String(d.file_url))}
            className="bg-blue-600 px-3 py-1 text-xs rounded-md"
          >
            Ver archivo
          </button>

          <button
            onClick={() => review(d.id, "APPROVED")}
            className="bg-green-600 px-3 py-1 text-xs rounded-md"
          >
            Aprobar
          </button>

          <button
            onClick={() => review(d.id, "REJECTED")}
            className="bg-red-600 px-3 py-1 text-xs rounded-md"
          >
            Rechazar
          </button>
        </div>
      </div>
    ))}
  </div>
);

}
