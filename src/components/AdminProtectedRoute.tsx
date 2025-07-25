import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>; // Or your spinner
  }

  if (!user) {
    console.warn("No user found. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  if (user.role !== "admin") {
    console.warn("Unauthorized user. Redirecting to /unAuthorized");
    return <Navigate to="/unAuthorized" replace />;
  }

  return <>{children}</>;
}

export default AdminProtectedRoute;
