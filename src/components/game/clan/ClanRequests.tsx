import { Check, X, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ClanJoinRequest } from '@/hooks/useClan';

interface ClanRequestsProps {
  requests: ClanJoinRequest[];
  loading: boolean;
  onReview: (requestId: string, accept: boolean) => Promise<boolean | undefined>;
}

export const ClanRequests = ({ requests, loading, onReview }: ClanRequestsProps) => {
  if (loading) {
    return <div className="text-center text-white/50 py-8">Загрузка заявок...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
        <Clock className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-white/50">Нет ожидающих заявок</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map(request => (
        <div key={request.id} className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600/30 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {request.display_name || `${request.wallet_address.slice(0, 10)}...`}
                </div>
                <div className="text-[10px] text-white/30 font-mono truncate">{request.wallet_address}</div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>Elo: {request.elo}</span>
                  {request.account_level && <span>Ур. {request.account_level}</span>}
                </div>
                {request.message && (
                  <p className="text-xs text-white/60 mt-1 italic">"{request.message}"</p>
                )}
              </div>
            </div>

            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={() => onReview(request.id, true)}
                className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => onReview(request.id, false)}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
