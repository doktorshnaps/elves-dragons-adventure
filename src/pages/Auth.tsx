import { useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Auth = () => {
  const { toast } = useToast();
  const { isConnected, isConnecting, connectWallet } = useWallet();
  const navigate = useNavigate();

  // Redirect if already connected
  useEffect(() => {
    if (isConnected) {
      navigate("/menu");
    }
  }, [isConnected, navigate]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подключить кошелек",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')"
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Dragon & Heroes
            </h1>
            <p className="text-gray-300 text-lg">
              Подключите NEAR кошелек для входа в игру
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-white/80 text-sm">
                Ваш прогресс в игре будет привязан к адресу кошелька NEAR
              </div>
              
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                {isConnecting ? "Подключение..." : "Подключить NEAR кошелек"}
              </Button>
              
              <div className="text-xs text-gray-400 mt-4">
                Для игры вам понадобится установленный NEAR кошелек
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};