export function routeByRole(user) {
  if (!user) return "/login";

  const { role, status, kyc_status } = user;

  // Sesión inválida
  if (status !== "ACTIVE") return "/login";

  // Admin / Operación
  if (role === "ADMIN" || role === "OPERATOR") {
    return "/admin";
  }

  // Usuario final
  if (role === "CUSTOMER") {
    // En el futuro puedes mandar a /kyc si no está aprobado
    // if (kyc_status !== "APPROVED") return "/app/kyc";
    return "/app";
  }

  // Fallback seguro
  return "/login";
}
