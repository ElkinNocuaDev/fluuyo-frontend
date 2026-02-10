import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// Para multipart/form-data (NO poner Content-Type manual)
export async function apiUpload(path, formData, { auth = true, headers } = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: formData,
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message = data?.error?.message || data?.message || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
