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

function normalizeMediaUrl(media?: string, baseUri?: string): string {
  const PLACEHOLDER = '/placeholder.svg';
  if (!media && !baseUri) return PLACEHOLDER;
  try {
    const isAbs = (u?: string) => !!u && (/^https?:\/\//i.test(u) || u.startsWith('data:'));

    // Helper to normalize IPFS-like string to https gateway
    const toIpfsPath = (cidOrPath: string) => {
      if (cidOrPath.startsWith('ipfs://')) return cidOrPath.replace('ipfs://', 'https://ipfs.io/ipfs/');
      if (/^[a-zA-Z0-9]{46,}$/.test(cidOrPath)) return `https://ipfs.io/ipfs/${cidOrPath}`;
      return cidOrPath;
    };

    // Absolute media URL
    if (isAbs(media)) return media as string;

    // If media is relative and baseUri provided
    if (media && baseUri && !isAbs(media)) {
      const base = toIpfsPath(baseUri);
      // Ensure single slash join
      const joined = `${base.replace(/\/$/, '')}/${String(media).replace(/^\//, '')}`;
      return joined;
    }

    // Handle pure ipfs values in media
    if (media) {
      return toIpfsPath(media);
    }

    // Fallback: just use normalized baseUri if present
    if (baseUri) return toIpfsPath(baseUri);

    return PLACEHOLDER;
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
        // Убираем toast - синхронизация происходит в фоне
        return [];
      }

      const cards = data?.nft_cards || [];
      setNftCards(cards);
      
      // Убираем все toast-уведомления - синхронизация происходит в фоне
      console.log(`✅ Synced ${cards.length} NFT cards silently`);
      return cards;

    } catch (error) {
      console.error('Error in syncNFTCards:', error);
      // Убираем toast - синхронизация происходит в фоне
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
        .select('*')
        .eq('wallet_address', walletAddress);

      if (error) {
        console.error('Error fetching user NFT cards:', error);
        return [];
      }

      // Convert to game card format using NFT metadata
      const cards: NFTCard[] = (nftMappings || []).map((mapping: any) => {
        const meta = mapping.nft_metadata || {};
        let extra: any = undefined;
        if (typeof meta?.extra === 'string') {
          try { extra = JSON.parse(meta.extra); } catch {}
        }
        const baseUri = meta?.base_uri || extra?.base_uri;
        const mediaCandidate = meta?.media || extra?.media || extra?.image || extra?.img;
        const image = normalizeMediaUrl(mediaCandidate, baseUri) || '/placeholder.svg';
        
        // Use NFT metadata or fallback values
        const fallbackName = meta?.title || meta?.description || mapping.card_template_name || `Token #${mapping.nft_token_id}`;
        return {
          id: `${mapping.nft_contract_id}_${mapping.nft_token_id}`,
          name: fallbackName,
          power: meta?.power || extra?.power || 20,
          defense: meta?.defense || extra?.defense || 15,
          health: meta?.health || extra?.health || 100,
          currentHealth: meta?.health || extra?.health || 100,
          rarity: meta?.rarity || extra?.rarity || 'common',
          faction: meta?.faction || extra?.faction,
          type: meta?.type || extra?.type || 'pet',
          description: meta?.description || extra?.description || 'NFT Card',
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