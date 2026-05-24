import { useCallback } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';

/** Адрес демо-аккаунта, который используется для гостевого режима. */
export const GUEST_DEMO_WALLET = 'guest-demo.near';

export const isGuestWallet = (id: string | null | undefined): boolean =>
  id === GUEST_DEMO_WALLET;

/** Глобальный флаг, который читает обёртка supabase-клиента, чтобы блокировать записи. */
export const setGuestRuntimeFlag = (isGuest: boolean) => {
  try {
    (window as any).__IS_GUEST__ = isGuest;
  } catch {}
};

export const isGuestRuntime = (): boolean => {
  try {
    return !!(window as any).__IS_GUEST__;
  } catch {
    return false;
  }
};

/**
 * Универсальный guard для блокировки мутаций в гостевом режиме.
 * Вызывайте `if (blockIfGuest('Покупки')) return;` в самом начале обработчика.
 */
export const useGuestGuard = () => {
  const { isGuest } = useWalletContext();
  const { toast } = useToast();

  const blockIfGuest = useCallback(
    (featureLabel = 'Это действие') => {
      if (!isGuest) return false;
      toast({
        title: '🎭 Гостевой режим',
        description: `${featureLabel} недоступно. Подключите кошелёк, чтобы играть.`,
        variant: 'destructive',
      });
      return true;
    },
    [isGuest, toast]
  );

  return { isGuest, blockIfGuest };
};