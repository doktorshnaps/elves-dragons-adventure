import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CardDisplay } from "../CardDisplay";
import { MarketplaceListing } from "./types";
import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
import { useNFTCards, NFTCard } from "@/hooks/useNFTCards";
import { useWalletContext } from "@/contexts/WalletConnectContext";

interface ListingDialogProps {
  onClose: () => void;
  onCreateListing: (listing: MarketplaceListing) => void;
}

export const ListingDialog = ({ onClose, onCreateListing }: ListingDialogProps) => {
  const [selectedType, setSelectedType] = useState<'card' | 'item' | 'nft'>('card');
  const [price, setPrice] = useState('');
  const [selectedItem, setSelectedItem] = useState<CardType | Item | NFTCard | null>(null);
  const [paymentToken, setPaymentToken] = useState<'ELL' | 'GT'>('ELL');
  const { accountId } = useWalletContext();
  const { getUserNFTCards } = useNFTCards();
  const [nftCards, setNftCards] = useState<NFTCard[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from('game_data')
          .select('cards, inventory, selected_team')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data) {
          const teamIds = new Set<string>();
          const st = (data.selected_team as any[]) || [];
          st.forEach((slot: any) => {
            const heroId = slot?.hero?.id || slot?.hero?.id;
            const dragonId = slot?.dragon?.id || slot?.dragon?.id;
            if (heroId) teamIds.add(heroId);
            if (dragonId) teamIds.add(dragonId);
          });
          const allCards: CardType[] = (data.cards as any[]) || [];
          const filteredCards = allCards.filter((c) => !teamIds.has(c.id));
          setCards(filteredCards);
          setInventory(((data.inventory as any[]) || []) as Item[]);
        }

        // Load NFT cards if wallet is connected
        if (accountId) {
          console.log('🔄 Loading NFT cards for marketplace from wallet:', accountId);
          
          // Sync NFTs from all contracts
          try {
            await supabase.functions.invoke('sync-mintbase-nfts', {
              body: { 
                wallet_address: accountId,
                contract_id: 'elleonortesr.mintbase1.near'
              }
            });
          } catch (e) {
            console.warn('Failed to sync elleonortesr.mintbase1.near NFTs:', e);
          }

          // Get NFT cards from multiple sources
          let allNFTs: NFTCard[] = [];

          // 0. Load from game_data.cards (matches cards shown in decks)
          try {
            if (data && Array.isArray((data as any).cards)) {
              const cardsArr = (data as any).cards as any[];
              const teamIdsSet = new Set<string>();
              const st = ((data as any).selected_team as any[]) || [];
              st.forEach((slot: any) => {
                const heroId = slot?.hero?.id;
                const dragonId = slot?.dragon?.id;
                if (heroId) teamIdsSet.add(heroId);
                if (dragonId) teamIdsSet.add(dragonId);
              });

              const nftsFromGameData = cardsArr
                .filter((c: any) => (c.isNFT && c.nftContractId && c.nftTokenId) || (!!c.nftContractId && !!c.nftTokenId))
                .filter((c: any) => !teamIdsSet.has(c.id))
                .map((c: any) => ({
                  id: c.nftContractId && c.nftTokenId ? `${c.nftContractId}_${c.nftTokenId}` : c.id,
                  name: c.name,
                  power: c.power ?? 20,
                  defense: c.defense ?? 15,
                  health: c.health ?? 100,
                  currentHealth: c.currentHealth ?? c.health ?? 100,
                  rarity: c.rarity ?? 1,
                  faction: c.faction,
                  type: c.type === 'character' ? 'character' : 'pet',
                  description: c.description || 'NFT Card',
                  image: c.image || '/placeholder.svg',
                  nft_token_id: c.nftTokenId,
                  nft_contract_id: c.nftContractId,
                })) as NFTCard[];

              console.log('📦 NFTs from game_data.cards:', nftsFromGameData.length);
              allNFTs = [...allNFTs, ...nftsFromGameData];
            }
          } catch (e) {
            console.warn('Failed to load NFTs from game_data.cards:', e);
          }

          // 1. Load from user_nft_cards table
          try {
            const nftsFromDB = await getUserNFTCards(accountId);
            console.log('📦 NFTs from user_nft_cards:', nftsFromDB.length);
            allNFTs = [...allNFTs, ...nftsFromDB];
          } catch (e) {
            console.warn('Failed to load from user_nft_cards:', e);
          }

          // 2. Load from card_instances (NFT cards with nft_contract_id)
          try {
            const { data: cardInstances } = await supabase
              .from('card_instances')
              .select('*')
              .eq('wallet_address', accountId)
              .not('nft_contract_id', 'is', null)
              .not('nft_token_id', 'is', null);

            console.log('📦 NFT card_instances:', cardInstances?.length || 0);

            if (cardInstances && cardInstances.length > 0) {
              const instanceNFTs: NFTCard[] = cardInstances.map((inst: any) => {
                const cardData = inst.card_data || {};
                return {
                  id: `${inst.nft_contract_id}_${inst.nft_token_id}`,
                  name: cardData.name || `NFT #${inst.nft_token_id}`,
                  power: cardData.power || inst.card_data?.power || 20,
                  defense: cardData.defense || inst.card_data?.defense || 15,
                  health: inst.max_health || 100,
                  currentHealth: inst.current_health || inst.max_health || 100,
                  rarity: cardData.rarity || 1,
                  faction: cardData.faction,
                  type: inst.card_type === 'dragon' ? 'pet' : 'character',
                  description: cardData.description || 'NFT Card',
                  image: cardData.image || '/placeholder.svg',
                  nft_token_id: inst.nft_token_id,
                  nft_contract_id: inst.nft_contract_id
                } as NFTCard;
              });
              allNFTs = [...allNFTs, ...instanceNFTs];
            }
          } catch (e) {
            console.warn('Failed to load from card_instances:', e);
          }

          // 3. Load from localStorage (game cards with isNFT flag)
          try {
            const localCards = localStorage.getItem('gameCards');
            if (localCards) {
              const parsed = JSON.parse(localCards);
              const nftCards = parsed.filter((c: any) => 
                c.isNFT && c.nftContractId && c.nftTokenId
              );
              console.log('📦 NFTs from localStorage:', nftCards.length);
              
              const localNFTs: NFTCard[] = nftCards.map((c: any) => ({
                id: c.id,
                name: c.name,
                power: c.power,
                defense: c.defense,
                health: c.health,
                currentHealth: c.currentHealth || c.health,
                rarity: c.rarity,
                faction: c.faction,
                type: c.type === 'character' ? 'character' : 'pet',
                description: c.description || 'NFT Card',
                image: c.image || '/placeholder.svg',
                nft_token_id: c.nftTokenId,
                nft_contract_id: c.nftContractId
              }));
              allNFTs = [...allNFTs, ...localNFTs];
            }
          } catch (e) {
            console.warn('Failed to load from localStorage:', e);
          }

          // Remove duplicates by id
          const uniqueNFTs = allNFTs.filter((nft, index, arr) => 
            arr.findIndex(n => n.id === nft.id) === index
          );

          console.log('📦 Total unique NFTs found:', uniqueNFTs.length);
          
          // Filter out NFT cards that are already on marketplace
          const { data: marketplaceNFTs } = await supabase
            .from('card_instances')
            .select('nft_contract_id, nft_token_id')
            .eq('wallet_address', accountId)
            .eq('is_on_marketplace', true);
          
          const marketplaceNFTIds = new Set(
            (marketplaceNFTs || []).map(n => `${n.nft_contract_id}_${n.nft_token_id}`)
          );
          
          const availableNFTs = uniqueNFTs.filter(nft => !marketplaceNFTIds.has(nft.id));
          console.log('✅ Available NFTs for marketplace:', availableNFTs.length);
          console.log('📋 NFT details:', availableNFTs.map(n => ({ id: n.id, name: n.name, contract: n.nft_contract_id })));
          setNftCards(availableNFTs);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accountId, getUserNFTCards]);

  const [cards, setCards] = useState<CardType[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCreate = () => {
    if (!selectedItem || !price) return;

    const listing: MarketplaceListing = {
      id: Date.now().toString(),
      type: selectedType === 'nft' ? 'card' : selectedType,
      item: selectedItem,
      price: Number(price),
      sellerId: 'current-user',
      createdAt: new Date().toISOString(),
      isNFT: selectedType === 'nft',
      paymentToken: paymentToken === 'GT' ? 'gt-1733.meme-cooking.near' : undefined,
    };

    onCreateListing(listing);
  };

  const renderItem = (item: CardType | Item | NFTCard, index: number) => {
    const isNFT = 'nft_token_id' in item && 'nft_contract_id' in item;
    
    if ('rarity' in item) {
      return (
        <div
          key={item.id}
          className={`cursor-pointer ${
            selectedItem?.id === item.id ? 'ring-2 ring-white rounded-lg' : ''
          }`}
          onClick={() => setSelectedItem(item)}
        >
          <CardDisplay card={item as CardType} showSellButton={false} />
          {isNFT && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
              NFT
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Card
          key={item.id}
          variant="menu"
          className={`p-4 cursor-pointer ${
            selectedItem?.id === item.id ? 'ring-2 ring-white' : ''
          }`}
          onClick={() => setSelectedItem(item)}
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-white">{item.name}</h3>
            <p className="text-sm text-gray-300">
              {item.type === 'healthPotion' ? 'Зелье здоровья' : 'Набор карт'}
            </p>
          </div>
        </Card>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl mx-4">
        <Card variant="menu" className="p-4 max-h-[70vh] overflow-y-auto" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Создать объявление</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="menu"
                onClick={() => setSelectedType('card')}
                className={`flex-1 ${selectedType !== 'card' ? 'opacity-60' : ''}`}
                size="sm"
                style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
              >
                Карты
              </Button>
              <Button
                variant="menu"
                onClick={() => setSelectedType('nft')}
                className={`flex-1 ${selectedType !== 'nft' ? 'opacity-60' : ''}`}
                size="sm"
                style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
              >
                NFT
              </Button>
              <Button
                variant="menu"
                onClick={() => setSelectedType('item')}
                className={`flex-1 ${selectedType !== 'item' ? 'opacity-60' : ''}`}
                size="sm"
                style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
              >
                Предметы
              </Button>
            </div>

            {selectedType === 'nft' && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-300">Оплата:</span>
                <Button
                  variant="menu"
                  size="sm"
                  onClick={() => setPaymentToken('ELL')}
                  className={`flex-1 ${paymentToken !== 'ELL' ? 'opacity-60' : ''}`}
                  style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                >
                  ELL
                </Button>
                <Button
                  variant="menu"
                  size="sm"
                  onClick={() => setPaymentToken('GT')}
                  className={`flex-1 ${paymentToken !== 'GT' ? 'opacity-60' : ''}`}
                  style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                >
                  GT Token
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto">
              {selectedType === 'card'
                ? cards.map((card: CardType, index: number) => renderItem(card, index))
                : selectedType === 'nft'
                ? nftCards.map((nft: NFTCard, index: number) => renderItem(nft, index))
                : inventory.map((item: Item, index: number) => renderItem(item, index))
              }
              {selectedType === 'nft' && nftCards.length === 0 && !loading && (
                <div className="col-span-2 text-center text-gray-400 py-4">
                  У вас нет доступных NFT для продажи
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                Цена (в {selectedType === 'nft' && paymentToken === 'GT' ? 'GT токенах' : 'ELL'})
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
                step={selectedType === 'nft' && paymentToken === 'GT' ? '0.01' : '1'}
                className="bg-black/50 border-2 border-white text-white h-8 text-sm"
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={!selectedItem || !price || loading}
              variant="menu"
              className="w-full"
              size="sm"
              style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
            >
              Создать объявление
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};