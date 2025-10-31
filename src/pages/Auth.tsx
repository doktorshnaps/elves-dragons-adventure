import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import useTelegram from "@/hooks/useTelegram";
import { SplashCursor } from "@/components/effects/SplashCursor";
import { Wallet } from "lucide-react";

export const Auth = () => {
  const { toast } = useToast();
  const { accountId, isLoading: isConnecting, connect } = useWalletContext();
  const { isTelegram, tgWebApp } = useTelegram();
  const isConnected = !!accountId;
  const connectWallet = connect;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referrerId, setReferrerId] = useState<string | null>(null);
  // Initialize Telegram Web App
  useEffect(() => {
    if (isTelegram && tgWebApp) {
      console.log('📱 Telegram Web App initialized');
      tgWebApp.ready();
      tgWebApp.expand();
    }
  }, [isTelegram, tgWebApp]);

  // Get referrer ID from URL params
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferrerId(refParam);
      console.log('🔗 Referral link detected:', refParam);
    }
  }, [searchParams]);

  const handleReferral = async () => {
    if (!accountId || !referrerId) return;
    
    try {
      console.log('🔗 Adding referral:', { referrerId, referred: accountId });
      const { data, error } = await supabase
        .rpc('add_referral', {
          p_referrer_wallet_address: referrerId,
          p_referred_wallet_address: accountId
        });

      if (error) {
        console.log('⚠️ Referral add failed:', error);
        toast({
          title: "Ошибка реферала",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('✅ Referral added successfully');
        toast({
          title: "Реферал добавлен",
          description: "Вы успешно привязаны к пригласившему игроку",
        });
      }
    } catch (error) {
      console.log('⚠️ Referral add error:', error);
    }
  };

  // Handle referral when wallet connects or account ID becomes available
  useEffect(() => {
    if (isConnected && accountId && referrerId) {
      handleReferral();
    }
  }, [isConnected, accountId, referrerId]);

  // Redirect if already connected
  useEffect(() => {
    if (isConnected && accountId) {
      // If we have a referral to process, do it first
      if (referrerId) {
        handleReferral().then(() => {
          console.log('✅ Referral processed, redirecting to menu');
          navigate("/menu", { replace: true });
        });
      } else {
        console.log('✅ Already connected, redirecting to menu');
        navigate("/menu", { replace: true });
      }
    }
  }, [isConnected, accountId, referrerId]);

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <SplashCursor />
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-2xl blur-xl" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
              {/* Icon */}
              <motion.div
                className="flex justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Dragon & Heroes
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-slate-300 text-center mb-6 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Подключите NEAR кошелек для входа в игру
              </motion.p>

              {/* Info box */}
              <motion.div
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-slate-400 text-sm text-center">
                  Ваш прогресс будет привязан к адресу кошелька NEAR
                </p>
              </motion.div>

              {/* Connect button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 hover:from-purple-700 hover:via-blue-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isConnecting ? "Подключение..." : "Подключить NEAR кошелек"}
                </Button>
              </motion.div>

              {/* Footer note */}
              <motion.p
                className="text-xs text-slate-500 text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Для игры необходим установленный NEAR кошелек
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};