import { useState } from "react";
import { GameTitle } from "@/components/GameTitle";
import { AuthForm } from "@/components/auth/AuthForm";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("gameUser") !== null;
  });

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("/lovable-uploads/86b5334c-bb41-4222-9077-09521913b631.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-7xl mx-auto px-4 flex flex-col items-center">
        <GameTitle isEnabled={isAuthenticated} />
        {!isAuthenticated && (
          <AuthForm onSuccess={() => setIsAuthenticated(true)} />
        )}
      </div>
    </div>
  );
};

export default Index;