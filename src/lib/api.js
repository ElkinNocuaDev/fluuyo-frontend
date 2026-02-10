// src/lib/api.js
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
const TOKEN_KEY = "fluuyo_token";

let onUnauthorized = null; // callback opcional para 401/403

export function setUnauthorizedHandler(fn) {
  onUnauthorized = typeof fn === "function" ? fn : null;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildUrl(path) {
  // soporta tanto "/auth/login" como "auth/login"
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${p}`;
}

export async function apiFetch(
  path,
  {
    method = "GET",
    body,
    auth = true,
    headers,
    signal,
    timeoutMs = 15000, // 15s por defecto
  } = {}
) {
  const token = getToken();

  // Abort por timeout (y respeta abort externo si viene)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Si viene signal externo, al abortarlo abortamos el interno también
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const hasBody = body !== undefined && body !== null;

    const res = await fetch(buildUrl(path), {
      method,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await parseJsonSafe(res);

    // Manejo central para sesión inválida
    if ((res.status === 401 || res.status === 403) && typeof onUnauthorized === "function") {
      // Importante: no asumimos logout aquí; delegamos al AuthProvider
      try {
        onUnauthorized({ status: res.status, data });
      } catch {
        // no dejamos que falle el handler
      }
    }

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (e) {
    // Timeout / Abort
    if (e?.name === "AbortError") {
      const err = new Error("La solicitud tardó demasiado. Intenta de nuevo.");
      err.status = 0;
      err.code = "TIMEOUT";
      throw err;
    }

    // Error de red (server caído, CORS, offline, DNS, etc.)
    const err = new Error(e?.message || "Error de red. Verifica tu conexión.");
    err.status = 0;
    err.code = "NETWORK_ERROR";
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetchBlob(
  path,
  { method = "GET", auth = true, headers, signal, timeoutMs = 20000 } = {}
) {
  const token = getToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(buildUrl(path), {
      method,
      headers: {
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      signal: controller.signal,
    });

    if ((res.status === 401 || res.status === 403) && typeof onUnauthorized === "function") {
      try { onUnauthorized({ status: res.status, data: null }); } catch {}
    }

    if (!res.ok) {
      // intenta leer json de error si existe
      const data = await parseJsonSafe(res);
      const message = data?.error?.message || data?.message || `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    const blob = await res.blob();
    const contentType = res.headers.get("content-type") || blob.type || "application/octet-stream";
    return { blob, contentType };
  } catch (e) {
    if (e?.name === "AbortError") {
      const err = new Error("La descarga tardó demasiado. Intenta de nuevo.");
      err.status = 0;
      err.code = "TIMEOUT";
      throw err;
    }
    const err = new Error(e?.message || "Error de red. Verifica tu conexión.");
    err.status = 0;
    err.code = "NETWORK_ERROR";
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

