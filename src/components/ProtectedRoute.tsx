import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "user" | "admin";
}
function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={"/auth"} replace />;
  }

  if (!requiredRole && user.role !== requiredRole) {
    return <Navigate to={"/unAuthorized"} replace />;
  }
  return <>{children}</>;
}

export default ProtectedRoute;
