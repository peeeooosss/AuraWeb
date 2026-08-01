import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const { restaurantId } = useParams();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (requiredRole === "staff") {
      return <Navigate to={`/${restaurantId}/staff/login`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // If user exists but restaurantId is not yet resolved (still hydrating),
  // show spinner instead of redirecting to /
  if (restaurantId && user.restaurantId === undefined) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      </div>
    );
  }

  if (restaurantId && user.restaurantId !== restaurantId) {
    return <Navigate to="/" replace />;
  }

  return children;
}
