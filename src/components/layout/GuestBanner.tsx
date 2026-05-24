import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';

export const GuestBanner = () => {
  const { isGuest, exitGuestMode } = useWalletContext();
  const navigate = useNavigate();
  const { language } = useLanguage();

  if (!isGuest) return null;

  const handleConnect = async () => {
    await exitGuestMode();
    navigate('/auth');
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white shadow-lg border-b border-amber-400/40">
      <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🎭</span>
          <span className="font-medium truncate">
            {t(language, 'guest.bannerTitle')}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleConnect}
          className="shrink-0 bg-white text-amber-700 hover:bg-amber-50 font-semibold h-7 px-2 sm:px-3"
        >
          <Wallet className="w-3 h-3 mr-1" />
          {t(language, 'guest.connectCta')}
        </Button>
      </div>
    </div>
  );
};