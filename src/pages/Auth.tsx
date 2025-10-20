import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Auth = () => {
  const { toast } = useToast();
  const { accountId, isLoading: isConnecting, connect } = useWalletContext();
  const isConnected = !!accountId;
  const connectWallet = connect;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [supabaseAuthenticating, setSupabaseAuthenticating] = useState(false);

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

  // Auto-register in Supabase when NEAR wallet connects
  const ensureSupabaseAuth = async (walletAddress: string) => {
    try {
      console.log('🔐 Ensuring Supabase auth for wallet:', walletAddress);
      setSupabaseAuthenticating(true);

      // Check if already logged in to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✅ Already authenticated in Supabase');
        setSupabaseAuthenticating(false);
        return;
      }

      // Create a deterministic email and password from wallet address
      const email = `${walletAddress}@near.wallet`;
      const password = `NEAR_${walletAddress}_${walletAddress.slice(-10)}`;

      console.log('📧 Attempting Supabase sign in with wallet credentials');
      
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          // User doesn't exist, create account
          console.log('📝 Creating new Supabase account');
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                wallet_address: walletAddress
              }
            }
          });

          if (signUpError) {
            throw signUpError;
          }

          console.log('✅ Supabase account created and signed in');
        } else {
          throw signInError;
        }
      } else {
        console.log('✅ Signed in to existing Supabase account');
      }

      setSupabaseAuthenticating(false);
    } catch (error: any) {
      console.error('❌ Supabase auth error:', error);
      setSupabaseAuthenticating(false);
      toast({
        title: "Ошибка авторизации",
        description: "Не удалось подключиться к базе данных",
        variant: "destructive"
      });
    }
  };

  // Handle Supabase authentication when wallet connects
  useEffect(() => {
    if (accountId && isConnected) {
      ensureSupabaseAuth(accountId);
    }
  }, [accountId, isConnected]);

  // Handle referral when wallet connects or account ID becomes available
  useEffect(() => {
    if (isConnected && accountId && referrerId) {
      handleReferral();
    }
  }, [isConnected, accountId, referrerId]);

  // Redirect if already connected (with localStorage fallback) but AFTER handling referral
  useEffect(() => {
    const lsConnected = localStorage.getItem('walletConnected') === 'true';
    const shouldRedirect = isConnected || lsConnected;

    console.log('🔍 Auth page: checking connection status:', { isConnected, lsConnected, accountId, referrerId });

    if (shouldRedirect) {
      // If we have a referral to process and account ID, do it first
      if (referrerId && accountId) {
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
    <div className="app-shell auth-shell min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')"
        }}
      />
      
      {/* Dark overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/60" />
      
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
              Dragon & Heroes - Подключение кошелька
            </h1>
            <p className="text-gray-300 text-lg">
              Подключите NEAR кошелек для входа в игру (НЕ email/password!)
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-white/80 text-sm">
                Ваш прогресс в игре будет привязан к адресу кошелька NEAR
              </div>
              
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting || supabaseAuthenticating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
              >
                {supabaseAuthenticating 
                  ? "Настройка аккаунта..." 
                  : isConnecting 
                    ? "Подключение..." 
                    : "Подключить NEAR кошелек"}
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