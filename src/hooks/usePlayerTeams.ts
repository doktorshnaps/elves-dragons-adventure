import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export type TeamType = 'dungeon' | 'pvp';

export interface TeamPair {
  hero: any;
  dragon?: any;
}

export interface PlayerTeam {
  teamType: TeamType;
  tier: number | null;
  teamData: TeamPair[];
}

export const usePlayerTeams = () => {
  const { accountId: walletAddress } = useWalletContext();
  const { toast } = useToast();
  const [teams, setTeams] = useState<PlayerTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTeamType, setActiveTeamType] = useState<TeamType>('dungeon');
  const [activeTier, setActiveTier] = useState<number | null>(null);

  // Load all teams for the player
  const loadTeams = useCallback(async () => {
    if (!walletAddress) {
      setTeams([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_all_player_teams', {
        p_wallet_address: walletAddress
      });

      if (error) throw error;

      const loadedTeams: PlayerTeam[] = (data || []).map((row: any) => ({
        teamType: row.team_type as TeamType,
        tier: row.tier,
        teamData: row.team_data || []
      }));

      setTeams(loadedTeams);
    } catch (error) {
      console.error('Error loading player teams:', error);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Get team for specific type/tier
  const getTeam = useCallback((teamType: TeamType, tier: number | null = null): TeamPair[] => {
    const team = teams.find(t => 
      t.teamType === teamType && 
      (tier === null ? t.tier === null : t.tier === tier)
    );
    return team?.teamData || [];
  }, [teams]);

  // Get current active team
  const activeTeam = useMemo(() => {
    return getTeam(activeTeamType, activeTier);
  }, [getTeam, activeTeamType, activeTier]);

  // Update a specific team
  const updateTeam = useCallback(async (
    teamType: TeamType,
    tier: number | null,
    teamData: TeamPair[]
  ): Promise<boolean> => {
    if (!walletAddress) return false;

    try {
      const { error } = await supabase.rpc('update_player_team', {
        p_wallet_address: walletAddress,
        p_team_type: teamType,
        p_tier: tier,
        p_team_data: teamData as unknown as Json
      });

      if (error) throw error;

      // Update local state
      setTeams(prev => {
        const existingIndex = prev.findIndex(t => 
          t.teamType === teamType && 
          (tier === null ? t.tier === null : t.tier === tier)
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { teamType, tier, teamData };
          return updated;
        } else {
          return [...prev, { teamType, tier, teamData }];
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить команду',
        variant: 'destructive'
      });
      return false;
    }
  }, [walletAddress, toast]);

  // Update current active team
  const updateActiveTeam = useCallback(async (teamData: TeamPair[]): Promise<boolean> => {
    return updateTeam(activeTeamType, activeTier, teamData);
  }, [updateTeam, activeTeamType, activeTier]);

  // Switch to a different team
  const switchTeam = useCallback((teamType: TeamType, tier: number | null = null) => {
    setActiveTeamType(teamType);
    setActiveTier(tier);
  }, []);

  // Get dungeon team
  const dungeonTeam = useMemo(() => getTeam('dungeon', null), [getTeam]);

  // Get PvP team for specific tier
  const getPvPTeam = useCallback((tier: number) => getTeam('pvp', tier), [getTeam]);

  // Team label helper
  const getTeamLabel = useCallback((teamType: TeamType, tier: number | null): string => {
    if (teamType === 'dungeon') return 'Подземелье';
    return `PvP Лига ${tier}`;
  }, []);

  return {
    teams,
    loading,
    activeTeam,
    activeTeamType,
    activeTier,
    dungeonTeam,
    getPvPTeam,
    getTeam,
    updateTeam,
    updateActiveTeam,
    switchTeam,
    loadTeams,
    getTeamLabel
  };
};
