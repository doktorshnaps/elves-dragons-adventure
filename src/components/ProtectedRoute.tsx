import { useWallet } from "@/hooks/useWallet";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-black">
        <div className="text-white text-xl">Подключение кошелька...</div>
      </div>
    );
  }

  if (!isConnected) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};