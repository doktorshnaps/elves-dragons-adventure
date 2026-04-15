import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

interface PvPBattleResultProps {
  matchData: any;
  walletAddress: string | null;
}

const AUTO_REDIRECT_SECONDS = 10;

export const PvPBattleResult: React.FC<PvPBattleResultProps> = ({ matchData, walletAddress }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/pvp');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  const isWinner = matchData.winner === walletAddress;

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Trophy className={`w-16 h-16 mx-auto ${isWinner ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          <CardTitle className={isWinner ? 'text-green-500' : 'text-red-500'}>
            {isWinner ? 'Победа!' : 'Поражение'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-lg">
            {isWinner
              ? `Вы получили ${matchData.reward || 0} ELL`
              : 'Удачи в следующем бою!'}
          </div>
          <div className="text-sm text-muted-foreground">
            Изменение рейтинга: {isWinner ? '+' : '-'}{matchData.elo_change || 0}
          </div>
          <Button onClick={() => navigate('/pvp')} className="w-full">
            Вернуться в арену
          </Button>
          <div className="text-xs text-muted-foreground">
            Автоматический переход через {countdown} сек.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};