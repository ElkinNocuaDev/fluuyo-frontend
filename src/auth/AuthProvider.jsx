// src/auth/AuthProvider.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  apiFetch,
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Evitar carreras entre refresh/login/register
  const refreshInFlight = useRef(null);
  const ignoreUnauthorizedOnce = useRef(false);

  const isAuthed = !!user;

  function hardLogout() {
    // idempotente
    clearToken();
    setUser(null);
  }

  async function refreshMe() {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    // Si ya hay refresh corriendo, reusarlo
    if (refreshInFlight.current) return refreshInFlight.current;

    refreshInFlight.current = (async () => {
      const r = await apiFetch("/me", { auth: true });
      setUser(r.user);
      return r.user;
    })();

    try {
      return await refreshInFlight.current;
    } finally {
      refreshInFlight.current = null;
    }
  }

  async function login({ email, password }) {
    ignoreUnauthorizedOnce.current = true;
    try {
      const r = await apiFetch("/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });

      // ❌ Si el correo no está verificado, lanzar error
      if (r.user.emailVerified !== true) {
        const error = { code: "EMAIL_NOT_VERIFIED", message: "Correo no verificado." };
        throw error;
      }

      setToken(r.token);
      setUser(r.user);
      return r.user;
    } catch (err) {
      // 🔑 CLAVE: propagar error backend intacto
      throw err?.response || err;
    } finally {
      setTimeout(() => {
        ignoreUnauthorizedOnce.current = false;
      }, 0);
    }
  }


  async function register({ first_name, last_name, email, phone, password }) {
    ignoreUnauthorizedOnce.current = true;
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        auth: false,
        body: { first_name, last_name, email, phone, password },
      });
      // NO setToken
      // NO setUser
      return true;
    } catch (err) {
      throw err?.response || err;
    } finally {
      setTimeout(() => {
        ignoreUnauthorizedOnce.current = false;
      }, 0);
    }
  }


  function logout() {
    hardLogout();
  }

  useEffect(() => {
    // 1) Reaccionar a 401/403 en cualquier apiFetch autenticado
    setUnauthorizedHandler(({ status }) => {
      if (ignoreUnauthorizedOnce.current) return;
      if (status === 401 || status === 403) hardLogout();
    });

    // 2) Sync multi-tab: si cambia el token en otra pestaña, reflejar aquí
    const onStorage = (e) => {
      if (e.key !== "fluuyo_token") return;

      // Si removieron token → logout local
      if (!e.newValue) {
        setUser(null);
        return;
      }

      // Si pusieron token → refrescar /me (sin forzar loops)
      // (solo si aquí no hay user aún)
      if (!user) {
        refreshMe().catch(() => {
          hardLogout();
        });
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      setUnauthorizedHandler(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        hardLogout();
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, isAuthed, booting, login, register, logout, refreshMe }),
    [user, isAuthed, booting]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider />");
  return ctx;
}
