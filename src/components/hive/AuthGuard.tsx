import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/the-hive" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
