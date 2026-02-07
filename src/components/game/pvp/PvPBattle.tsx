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
  
  const { submitMove, getMatchStatus, processTimeout, loading } = usePvP(walletAddress);
  const lastSeenMoveIdRef = React.useRef<string | null>(null);
  
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
  const loadMatch = useCallback(async (isInitial = false) => {
    if (!matchId) return;
    
    const data = await getMatchStatus(matchId);
    if (data) {
      // Check if opponent made a move since our last check
      const recentMoves = data.recent_moves || [];
      const latestMove = recentMoves[0]; // most recent move (sorted desc)
      
      if (
        !isInitial &&
        latestMove &&
        latestMove.id !== lastSeenMoveIdRef.current &&
        latestMove.player_wallet !== walletAddress
      ) {
        // Opponent made a new move — show it as lastRoll
        lastSeenMoveIdRef.current = latestMove.id;
        const roll = latestMove.dice_roll_attacker ?? 4;
        const isMiss = roll <= 2;
        const isCritical = roll === 6;
        const isCounterAttack = roll === 1;
        
        setLastRoll({
          attackerRoll: roll,
          source: 'opponent',
          damage: latestMove.damage_dealt || 0,
          isCritical,
          isMiss,
          isCounterAttack,
          counterAttackDamage: isCounterAttack ? (latestMove.damage_dealt || 0) : 0,
          description: ''
        });
      } else if (isInitial && latestMove) {
        // On initial load, just remember the latest move id without animating
        lastSeenMoveIdRef.current = latestMove.id;
        setLastRoll(null);
      } else {
        setLastRoll(null);
      }
      
      setMatchData(data);
    }
  }, [matchId, getMatchStatus, walletAddress]);

  // Initial load
  useEffect(() => {
    loadMatch(true);
  }, [loadMatch]);

  // Trigger bot turn if it's bot match and bot goes first
  const triggerBotTurnIfNeeded = useCallback(async (data: any) => {
    if (!matchId || !data) return;
    
    // Check if it's a bot match, not my turn, and match is active
    const isBotMatch = data.player2?.wallet?.startsWith('BOT_') || data.player1?.wallet?.startsWith('BOT_');
    const isActive = data.status === 'active';
    const isNotMyTurn = !data.is_my_turn;
    
    if (isBotMatch && isActive && isNotMyTurn) {
      console.log('[PvP] Triggering bot turn...');
      const result = await submitMove(matchId, 'trigger_bot_turn');
      
      if (result?.success) {
        // Show bot's dice roll animation
        if (result.dice_roll !== undefined) {
          setLastRoll({
            attackerRoll: result.dice_roll,
            source: 'opponent',
            damage: result.damage_dealt || 0,
            isCritical: result.is_critical || false,
            isMiss: result.is_miss || false,
            isCounterAttack: result.is_counter_attack || false,
            counterAttackDamage: result.counter_attack_damage || 0,
            description: result.description || ''
          });
        }
        
        // Reload match after animation
        setTimeout(async () => {
          const newData = await getMatchStatus(matchId);
          if (newData) {
            setMatchData(newData);
          }
        }, 2000);
      }
    }
  }, [matchId, submitMove, getMatchStatus]);

  // Polling for updates when not my turn (for real player matches only)
  useEffect(() => {
    if (!matchData || matchData.is_my_turn || matchData.status === 'completed') {
      setIsPolling(false);
      return;
    }
    
    // For bot matches, trigger bot turn instead of polling
    const isBotMatch = matchData.player2?.wallet?.startsWith('BOT_') || matchData.player1?.wallet?.startsWith('BOT_');
    if (isBotMatch) {
      triggerBotTurnIfNeeded(matchData);
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
  }, [matchData?.is_my_turn, matchData?.status, loadMatch, triggerBotTurnIfNeeded]);

  // Handle attack
  const handleAttack = async (attackerIndex: number, targetIndex: number) => {
    if (!matchId) return;

    const result = await submitMove(matchId, 'attack', attackerIndex, targetIndex);
    
    if (result?.success) {
      // Mark the player's move as seen so polling won't replay it
      if (result.move_id) {
        lastSeenMoveIdRef.current = result.move_id;
      }
      
      // Show player's dice roll animation
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
      
      // If bot made a move, show bot's dice roll after player's animation
      if (result.bot_turn) {
        // Mark bot move as seen too
        if (result.bot_turn.move_id) {
          lastSeenMoveIdRef.current = result.bot_turn.move_id;
        }
        setTimeout(() => {
          setLastRoll({
            attackerRoll: result.bot_turn.dice_roll,
            source: 'opponent',
            damage: result.bot_turn.damage_dealt || 0,
            isCritical: result.bot_turn.is_critical || false,
            isMiss: result.bot_turn.is_miss || false,
            isCounterAttack: result.bot_turn.is_counter_attack || false,
            counterAttackDamage: result.bot_turn.counter_attack_damage || 0,
            description: result.bot_turn.description || ''
          });
          
          // Reload match after bot's animation
          setTimeout(() => {
            loadMatch();
          }, 2000);
        }, 2500); // Wait for player's animation to finish
      } else {
        // No bot turn, just reload after player's animation
        setTimeout(() => {
          loadMatch();
        }, 2000);
      }
    }
  };

  // Handle timeout
  const handleTimeout = async () => {
    if (!matchId) return;
    
    const result = await processTimeout(matchId);
    if (result) {
      // Reload match data after timeout processing
      setTimeout(() => {
        loadMatch();
      }, 500);
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
        turnTimeoutSeconds={matchData.turn_timeout_seconds || 60}
        timeoutWarnings={matchData.timeout_warnings || { my: 0, opponent: 0 }}
        opponentWallet={opponentWallet || 'Противник'}
        isBotMatch={opponentWallet?.startsWith('BOT_')}
        isLoading={loading}
        isPolling={isPolling}
        lastRoll={lastRoll}
        initiative={initiative}
        onAttack={handleAttack}
        onSurrender={handleSurrender}
        onTimeout={handleTimeout}
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
