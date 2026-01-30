import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy } from 'lucide-react';
import { usePvP, PvPPair } from '@/hooks/usePvP';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';
import { PvPBattleArena } from './PvPBattleArena';
import { BattleSpeedProvider } from '@/contexts/BattleSpeedContext';

const PvPBattleContent: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { accountId: walletAddress } = useWalletContext();
  
  const { submitMove, getMatchStatus, loading } = usePvP(walletAddress);
  
  const [matchData, setMatchData] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<{
    attackerRoll: number;
    defenderRoll?: number;
    source: 'player' | 'opponent';
    damage: number;
    isBlocked?: boolean;
    isCritical?: boolean;
    isMiss?: boolean;
    isCounterAttack?: boolean;
    counterAttackDamage?: number;
    description?: string;
  } | null>(null);

  // Load match data
  const loadMatch = useCallback(async () => {
    if (!matchId) return;
    
    const data = await getMatchStatus(matchId);
    if (data) {
      setMatchData(data);
    }
  }, [matchId, getMatchStatus]);

  // Initial load
  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  // Polling for updates when not my turn
  useEffect(() => {
    if (!matchData || matchData.is_my_turn || matchData.status === 'completed') {
      setIsPolling(false);
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
  }, [matchData?.is_my_turn, matchData?.status, loadMatch]);

  // Handle attack
  const handleAttack = async (attackerIndex: number, targetIndex: number) => {
    if (!matchId) return;

    const result = await submitMove(matchId, 'attack', attackerIndex, targetIndex);
    
    if (result?.success) {
      // Show dice roll animation with result data (new D6 system - only attacker rolls)
      if (result.dice_roll !== undefined) {
        setLastRoll({
          attackerRoll: result.dice_roll,
          source: 'player',
          damage: result.damage_dealt || 0,
          isCritical: result.is_critical || false,
          isMiss: result.is_miss || false,
          isCounterAttack: result.is_counter_attack || false,
          counterAttackDamage: result.counter_attack_damage || 0,
          description: result.description || ''
        });
      }
      
      // Reload match after animation
      setTimeout(() => {
        loadMatch();
      }, 2000);
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

  // Convert match data pairs to PvPPair format
  const convertToPvPPairs = (pairs: any[]): PvPPair[] => {
    if (!pairs || !Array.isArray(pairs)) return [];
    
    return pairs.map(pair => ({
      hero: {
        name: pair.hero?.name || 'Герой',
        power: pair.hero?.power || 0,
        defense: pair.hero?.defense || 0,
        health: pair.hero?.health || 100,
        currentHealth: pair.hero?.currentHealth ?? pair.hero?.health ?? 100,
        currentDefense: pair.hero?.currentDefense ?? pair.hero?.defense ?? 0,
        faction: pair.hero?.faction,
        image: pair.hero?.image
      },
      dragon: pair.dragon ? {
        name: pair.dragon.name || 'Дракон',
        power: pair.dragon.power || 0,
        defense: pair.dragon.defense || 0,
        health: pair.dragon.health || 50,
        currentHealth: pair.dragon.currentHealth ?? pair.dragon.health ?? 50,
        currentDefense: pair.dragon.currentDefense ?? pair.dragon.defense ?? 0,
        faction: pair.dragon.faction,
        image: pair.dragon.image
      } : undefined,
      totalPower: (pair.hero?.power || 0) + (pair.dragon?.power || 0),
      totalDefense: (pair.hero?.currentDefense ?? pair.hero?.defense ?? 0) + (pair.dragon?.currentDefense ?? pair.dragon?.defense ?? 0),
      totalHealth: (pair.hero?.health || 0) + (pair.dragon?.health || 0),
      currentHealth: (pair.hero?.currentHealth ?? pair.hero?.health ?? 0) + (pair.dragon?.currentHealth ?? pair.dragon?.health ?? 0),
      currentDefense: (pair.hero?.currentDefense ?? pair.hero?.defense ?? 0) + (pair.dragon?.currentDefense ?? pair.dragon?.defense ?? 0)
    }));
  };

  // Loading state
  if (!matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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

  // Determine my and opponent pairs
  const amIPlayer1 = matchData.player1?.is_me;
  const myPairs = convertToPvPPairs(amIPlayer1 ? matchData.player1?.pairs : matchData.player2?.pairs);
  const opponentPairs = convertToPvPPairs(amIPlayer1 ? matchData.player2?.pairs : matchData.player1?.pairs);
  const opponentWallet = amIPlayer1 ? matchData.player2?.wallet : matchData.player1?.wallet;
  
  // Get initiative info from battle state
  const initiative = matchData.last_action?.initiative || matchData.initiative || null;

  return (
    <div className="min-h-screen bg-background">
      <PvPBattleArena
        myPairs={myPairs}
        opponentPairs={opponentPairs}
        isMyTurn={matchData.is_my_turn || false}
        turnNumber={matchData.turn_number || 1}
        timeRemaining={matchData.time_remaining}
        opponentWallet={opponentWallet || 'Противник'}
        isBotMatch={opponentWallet?.startsWith('BOT_')}
        isLoading={loading}
        isPolling={isPolling}
        lastRoll={lastRoll}
        initiative={initiative}
        onAttack={handleAttack}
        onSurrender={handleSurrender}
      />
    </div>
  );
};

// Wrapper component with BattleSpeedProvider
export const PvPBattle: React.FC = () => {
  return (
    <BattleSpeedProvider>
      <PvPBattleContent />
    </BattleSpeedProvider>
  );
};
