import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NFTCard {
  id: string;
  name: string;
  power: number;
  defense: number;
  health: number;
  currentHealth: number;
  rarity: string;
  faction?: string;
  type: string;
  description?: string;
  image: string;
  nft_token_id: string;
  nft_contract_id: string;
}

export const useNFTCards = () => {
  const [nftCards, setNftCards] = useState<NFTCard[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const syncNFTCards = useCallback(async (walletAddress: string, contractId?: string) => {
    if (!walletAddress) {
      console.log('No wallet address provided');
      return [];
    }

    setLoading(true);
    
    try {
      console.log(`🔄 Syncing NFT cards for wallet: ${walletAddress}`);
      
      // Call edge function to sync NFT cards
      const { data, error } = await supabase.functions.invoke('sync-nft-cards', {
        body: { 
          wallet_address: walletAddress,
          contract_id: contractId || 'heroesnft.near'
        }
      });

      if (error) {
        console.error('Error syncing NFT cards:', error);
        toast({
          title: "Ошибка синхронизации NFT",
          description: "Не удалось загрузить NFT карты из кошелька",
          variant: "destructive"
        });
        return [];
      }

      const cards = data?.nft_cards || [];
      setNftCards(cards);
      
      if (cards.length > 0) {
        toast({
          title: "NFT карты загружены",
          description: `Найдено ${cards.length} NFT карт в кошельке`
        });
      } else {
        toast({
          title: "NFT карты не найдены",
          description: "В вашем кошельке нет поддерживаемых NFT карт"
        });
      }

      console.log(`✅ Synced ${cards.length} NFT cards`);
      return cards;

    } catch (error) {
      console.error('Error in syncNFTCards:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке NFT карт",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getUserNFTCards = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return [];

    try {
      // Get user's NFT mappings from database
      const { data: nftMappings, error } = await supabase
        .from('user_nft_cards')
        .select(`
          *,
          card_templates (
            name,
            power,
            defense,
            health,
            rarity,
            faction,
            card_type,
            description,
            image_url
          )
        `)
        .eq('wallet_address', walletAddress);

      if (error) {
        console.error('Error fetching user NFT cards:', error);
        return [];
      }

      // Convert to game card format
      const cards: NFTCard[] = (nftMappings || []).map((mapping: any) => ({
        id: `${mapping.nft_contract_id}_${mapping.nft_token_id}`,
        name: mapping.card_templates.name,
        power: mapping.card_templates.power,
        defense: mapping.card_templates.defense,
        health: mapping.card_templates.health,
        currentHealth: mapping.card_templates.health,
        rarity: mapping.card_templates.rarity,
        faction: mapping.card_templates.faction,
        type: mapping.card_templates.card_type,
        description: mapping.card_templates.description,
        image: mapping.nft_metadata?.media || mapping.card_templates.image_url || '/placeholder.svg',
        nft_token_id: mapping.nft_token_id,
        nft_contract_id: mapping.nft_contract_id
      }));

      setNftCards(cards);
      return cards;

    } catch (error) {
      console.error('Error in getUserNFTCards:', error);
      return [];
    }
  }, []);

  return {
    nftCards,
    loading,
    syncNFTCards,
    getUserNFTCards
  };
};