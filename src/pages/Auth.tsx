import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import useTelegram from "@/hooks/useTelegram";
import SplashCursor from "@/components/effects/SplashCursor";
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

  useEffect(() => {
    if (isTelegram && tgWebApp) {
      tgWebApp.ready();
      tgWebApp.expand();
    }
  }, [isTelegram, tgWebApp]);

  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) setReferrerId(refParam);
  }, [searchParams]);

  const handleReferral = async () => {
    if (!accountId || !referrerId) return;
    try {
      const { error } = await supabase.rpc("add_referral", {
        p_referrer_wallet_address: referrerId,
        p_referred_wallet_address: accountId,
      });
      if (error) {
        toast({ title: "Ошибка реферала", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Реферал добавлен", description: "Вы успешно привязаны к пригласившему игроку" });
      }
    } catch {}
  };

  useEffect(() => {
    if (isConnected && accountId && referrerId) handleReferral();
  }, [isConnected, accountId, referrerId]);

  useEffect(() => {
    if (isConnected && accountId) {
      if (referrerId) {
        handleReferral().then(() => navigate("/menu", { replace: true }));
      } else {
        navigate("/menu", { replace: true });
      }
    }
  }, [isConnected, accountId, referrerId, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <SplashCursor />
      <div className="relative z-20 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 p-6 text-white">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">ElleonorAI Подключение кошелька</h1>
            <p className="mt-2 text-white/70">Подключите NEAR кошелек, чтобы продолжить</p>
          </div>
          <Button className="w-full" onClick={connectWallet} disabled={isConnecting}>
            <Wallet className="mr-2 h-4 w-4" /> Подключить NEAR кошелек
          </Button>
          <p className="mt-4 text-xs text-white/60 text-center">Нет кошелька? Создайте его на wallet.near.org</p>
        </div>
      </div>
    </div>
  );
};
