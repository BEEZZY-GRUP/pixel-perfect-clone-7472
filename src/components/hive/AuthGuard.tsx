import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-widest uppercase font-heading animate-pulse">
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/the-hive" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
