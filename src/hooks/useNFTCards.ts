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

function normalizeMediaUrl(media?: string): string {
  if (!media) return '/placeholder.svg';
  try {
    if (media.startsWith('ipfs://')) return media.replace('ipfs://', 'https://ipfs.io/ipfs/');
    if (/^[a-zA-Z0-9]{46,}$/.test(media)) return `https://ipfs.io/ipfs/${media}`;
    return media;
  } catch {
    return '/placeholder.svg';
  }
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
          contract_id: contractId || 'heroesnft.near',
          additional_contracts: ['doubledog.hot.tg']
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
      const cards: NFTCard[] = (nftMappings || []).map((mapping: any) => {
        const tpl = mapping.card_templates;
        const meta = mapping.nft_metadata || {};
        let extra: any = undefined;
        if (typeof meta?.extra === 'string') {
          try { extra = JSON.parse(meta.extra); } catch {}
        }
        const mediaCandidate = meta?.media || extra?.media || extra?.image || extra?.img;
        const image = normalizeMediaUrl(mediaCandidate) || (tpl?.image_url ?? '/placeholder.svg');

        if (tpl) {
          return {
            id: `${mapping.nft_contract_id}_${mapping.nft_token_id}`,
            name: tpl.name,
            power: tpl.power,
            defense: tpl.defense,
            health: tpl.health,
            currentHealth: tpl.health,
            rarity: tpl.rarity,
            faction: tpl.faction,
            type: tpl.card_type,
            description: tpl.description,
            image,
            nft_token_id: mapping.nft_token_id,
            nft_contract_id: mapping.nft_contract_id
          } as NFTCard;
        }

        // Fallback when there is no matching template
        const fallbackName = meta?.title || meta?.description || `Token #${mapping.nft_token_id}`;
        return {
          id: `${mapping.nft_contract_id}_${mapping.nft_token_id}`,
          name: fallbackName,
          power: 20,
          defense: 15,
          health: 100,
          currentHealth: 100,
          rarity: 'common',
          faction: undefined,
          type: 'pet',
          description: meta?.description || 'NFT Card',
          image,
          nft_token_id: mapping.nft_token_id,
          nft_contract_id: mapping.nft_contract_id
        } as NFTCard;
      });

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