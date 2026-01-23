import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Swords, Shield, Heart, ArrowLeft, Clock, 
  Loader2, Trophy, Flag, RefreshCw
} from 'lucide-react';
import { usePvP, PvPPair } from '@/hooks/usePvP';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';

interface BattleState {
  player1_pairs: PvPPair[];
  player2_pairs: PvPPair[];
  current_turn: 'player1' | 'player2';
  is_my_turn: boolean;
  turn_number: number;
  time_remaining: number | null;
  last_action: any;
}

export const PvPBattle: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountId: walletAddress } = useWalletContext();
  
  const { submitMove, getMatchStatus, loading } = usePvP(walletAddress);
  
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [selectedAttacker, setSelectedAttacker] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Load match data
  const loadMatch = useCallback(async () => {
    if (!matchId) return;
    
    const data = await getMatchStatus(matchId);
    if (data) {
      setMatchData(data);
      setBattleState({
        player1_pairs: data.player1?.pairs || [],
        player2_pairs: data.player2?.pairs || [],
        current_turn: data.is_my_turn ? 'player1' : 'player2',
        is_my_turn: data.is_my_turn,
        turn_number: data.turn_number,
        time_remaining: data.time_remaining,
        last_action: data.last_action
      });
    }
  }, [matchId, getMatchStatus]);

  // Initial load
  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  // Polling for updates when not my turn
  useEffect(() => {
    if (!battleState || battleState.is_my_turn || matchData?.status === 'completed') {
      return;
    }

    setIsPolling(true);
    const interval = setInterval(() => {
      loadMatch();
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [battleState?.is_my_turn, matchData?.status, loadMatch]);

  // Handle attack
  const handleAttack = async () => {
    if (!matchId || selectedAttacker === null || selectedTarget === null) return;

    const result = await submitMove(matchId, 'attack', selectedAttacker, selectedTarget);
    
    if (result?.success) {
      setSelectedAttacker(null);
      setSelectedTarget(null);
      loadMatch();
    }
  };

  // Handle surrender
  const handleSurrender = async () => {
    if (!matchId) return;
    
    const result = await submitMove(matchId, 'surrender');
    if (result) {
      navigate('/pvp');
    }
  };

  // Render pair card
  const renderPair = (
    pair: PvPPair, 
    index: number, 
    isMyTeam: boolean, 
    isSelectable: boolean
  ) => {
    const isSelected = isMyTeam 
      ? selectedAttacker === index 
      : selectedTarget === index;
    const healthPercent = pair.totalHealth > 0 
      ? (pair.currentHealth / pair.totalHealth) * 100 
      : 0;
    const isDead = pair.currentHealth <= 0;

    return (
      <Card 
        key={index}
        className={`cursor-pointer transition-all ${
          isDead ? 'opacity-50' : ''
        } ${
          isSelected ? 'ring-2 ring-primary' : ''
        } ${
          isSelectable && !isDead ? 'hover:ring-1 hover:ring-primary/50' : ''
        }`}
        onClick={() => {
          if (isDead || !isSelectable) return;
          if (isMyTeam) {
            setSelectedAttacker(index);
          } else {
            setSelectedTarget(index);
          }
        }}
      >
        <CardContent className="p-3">
          <div className="text-sm font-medium truncate">
            {pair.hero?.name || 'Герой'}
          </div>
          {pair.dragon && (
            <div className="text-xs text-muted-foreground truncate">
              + {pair.dragon.name}
            </div>
          )}
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <Heart className="w-3 h-3 text-red-500" />
              <Progress value={healthPercent} className="h-1.5 flex-1" />
              <span>{pair.currentHealth}/{pair.totalHealth}</span>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Swords className="w-3 h-3" />
                {pair.totalPower}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {pair.currentDefense}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Match completed
  if (matchData.status === 'completed') {
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
          </CardContent>
        </Card>
      </div>
    );
  }

  const myPairs = matchData.player1?.is_me ? battleState?.player1_pairs : battleState?.player2_pairs;
  const opponentPairs = matchData.player1?.is_me ? battleState?.player2_pairs : battleState?.player1_pairs;
  const isMyTurn = battleState?.is_my_turn || false;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/pvp')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          
          <div className="flex items-center gap-2">
            {isPolling && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Badge variant={isMyTurn ? "default" : "secondary"}>
              {isMyTurn ? "Ваш ход" : "Ход противника"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span>Ход {battleState?.turn_number || 1}</span>
          </div>
        </div>

        {/* Timer */}
        {battleState?.time_remaining !== null && battleState?.time_remaining !== undefined && (
          <div className="text-center">
            <span className={`text-2xl font-mono ${battleState.time_remaining < 30 ? 'text-red-500' : ''}`}>
              {Math.floor(battleState.time_remaining / 60)}:{(battleState.time_remaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Opponent Team */}
        <Card className="bg-destructive/10">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Противник</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {opponentPairs?.map((pair, index) => 
                renderPair(pair, index, false, isMyTurn && selectedAttacker !== null)
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          <Button
            size="lg"
            onClick={handleAttack}
            disabled={!isMyTurn || loading || selectedAttacker === null || selectedTarget === null}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Swords className="w-4 h-4 mr-2" />
            )}
            Атаковать
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleSurrender}
            disabled={loading}
          >
            <Flag className="w-4 h-4 mr-2" />
            Сдаться
          </Button>
        </div>

        {/* My Team */}
        <Card className="bg-primary/10">
          <CardHeader className="py-2">
            <CardTitle className="text-sm">Ваша команда</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {myPairs?.map((pair, index) => 
                renderPair(pair, index, true, isMyTurn)
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Action */}
        {battleState?.last_action && (
          <Card className="bg-muted/50">
            <CardContent className="py-2 text-center text-sm">
              Последнее действие: {battleState.last_action.type === 'attack' 
                ? `Атака нанесла ${battleState.last_action.damage} урона` 
                : battleState.last_action.type}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
