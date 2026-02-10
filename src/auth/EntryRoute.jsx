import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { routeByRole } from "./routeByRole";

export default function EntryRoute() {
  const { booting, isAuthed, user } = useAuth();
  if (booting) return null; // o tu FullscreenLoader
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Navigate to={routeByRole(user)} replace />;
}
