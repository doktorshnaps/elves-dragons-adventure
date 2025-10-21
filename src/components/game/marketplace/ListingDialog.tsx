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
import { NFTCard } from "@/hooks/useNFTCards";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useNFTCardIntegration } from "@/hooks/useNFTCardIntegration";
interface ListingDialogProps {
  onClose: () => void;
  onCreateListing: (listing: MarketplaceListing) => void;
}
export const ListingDialog = ({
  onClose,
  onCreateListing
}: ListingDialogProps) => {
  const [selectedType, setSelectedType] = useState<'card' | 'item' | 'nft'>('nft');
  const [price, setPrice] = useState('');
  const [selectedItem, setSelectedItem] = useState<CardType | Item | NFTCard | null>(null);
  const [paymentToken, setPaymentToken] = useState<'ELL' | 'GT'>('ELL');
  const { accountId } = useWalletContext();
  const { nftCards: integratedNftCards, isLoading: nftLoading, syncNFTsFromWallet } = useNFTCardIntegration();
  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: userRes
        } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) return;
        const {
          data,
          error
        } = await supabase.from('game_data').select('cards, inventory, selected_team').eq('user_id', userId).maybeSingle();
        if (!error && data) {
          const teamIds = new Set<string>();
          const st = data.selected_team as any[] || [];
          st.forEach((slot: any) => {
            const heroId = slot?.hero?.id || slot?.hero?.id;
            const dragonId = slot?.dragon?.id || slot?.dragon?.id;
            if (heroId) teamIds.add(heroId);
            if (dragonId) teamIds.add(dragonId);
          });
          const allCards: CardType[] = data.cards as any[] || [];
          const filteredCards = allCards.filter(c => !teamIds.has(c.id));
          setCards(filteredCards);
          setInventory((data.inventory as any[] || []) as Item[]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accountId]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  // Use hook NFTs or fallback to cached local cards to avoid empty state on fast reopen
  const nftSource: any[] = integratedNftCards.length > 0 ? integratedNftCards : (() => {
    try {
      const raw = localStorage.getItem('gameCards');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as any[];
      return parsed.filter(c => c?.isNFT || (!!c?.nft_token_id && !!c?.nft_contract_id) || (!!c?.nftTokenId && !!c?.nftContractId));
    } catch { return []; }
  })();

  const filteredNFTs = nftSource.filter((c: any) => {
    const isNft = c?.isNFT === true || (!!c?.nft_token_id && !!c?.nft_contract_id) || (!!c?.nftTokenId && !!c?.nftContractId);
    const contractId = c?.nftContractId ?? c?.nft_contract_id ?? c?.nft_contract;
    const matches = isNft && contractId === 'elleonortesr.mintbase1.near';
    if (isNft && nftSource.length > 0 && !matches) {
      console.log('🔍 NFT filtered out:', { id: c?.id, name: c?.name, contractId, expected: 'elleonortesr.mintbase1.near' });
    }
    return matches;
  });

  // Debug logging
  useEffect(() => {
    if (nftSource.length > 0 || nftLoading) {
      console.log('📊 ListingDialog NFT state:', {
        hookNFTs: integratedNftCards.length,
        cacheNFTs: nftSource.length,
        filteredNFTs: filteredNFTs.length,
        nftLoading,
        accountId,
        sampleNFT: nftSource[0]
      });
    }
  }, [integratedNftCards, nftSource.length, filteredNFTs.length, nftLoading, accountId]);
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
      paymentToken: paymentToken === 'GT' ? 'gt-1733.meme-cooking.near' : undefined
    };
    onCreateListing(listing);
  };
  const renderItem = (item: CardType | Item | NFTCard, index: number) => {
    const isNFT = (item as any).isNFT === true || !!((item as any).nft_token_id && (item as any).nft_contract_id) || !!((item as any).nftTokenId && (item as any).nftContractId);
    if ('rarity' in item) {
      return <div key={item.id} className={`cursor-pointer ${selectedItem?.id === item.id ? 'ring-2 ring-white rounded-lg' : ''}`} onClick={() => setSelectedItem(item)}>
          <CardDisplay card={item as CardType} showSellButton={false} />
          {isNFT && <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
              NFT
            </div>}
        </div>;
    } else {
      return <Card key={item.id} variant="menu" className={`p-4 cursor-pointer ${selectedItem?.id === item.id ? 'ring-2 ring-white' : ''}`} onClick={() => setSelectedItem(item)} style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }}>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-white">{item.name}</h3>
            <p className="text-sm text-gray-300">
              {item.type === 'healthPotion' ? 'Зелье здоровья' : 'Набор карт'}
            </p>
          </div>
        </Card>;
    }
  };
  return <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl mx-4">
        <Card variant="menu" className="p-4 max-h-[70vh] overflow-y-auto" style={{
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Создать объявление</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              
              <Button variant="menu" onClick={() => setSelectedType('nft')} className={`flex-1 ${selectedType !== 'nft' ? 'opacity-60' : ''}`} size="sm" style={{
              boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
            }}>
                NFT
              </Button>
              
            </div>

            {selectedType === 'nft' && <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-300">Оплата:</span>
                
                <Button variant="menu" size="sm" onClick={() => setPaymentToken('GT')} className={`flex-1 ${paymentToken !== 'GT' ? 'opacity-60' : ''}`} style={{
              boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
            }}>
                  GT Token
                </Button>
              </div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto">
              {selectedType === 'card' ? cards.map((card: CardType, index: number) => renderItem(card, index)) : selectedType === 'nft' ? filteredNFTs.map((nft: any, index: number) => renderItem(nft, index)) : inventory.map((item: Item, index: number) => renderItem(item, index))}
              {selectedType === 'nft' && filteredNFTs.length === 0 && !nftLoading && <div className="col-span-2 text-center text-gray-400 py-4">
                  У вас нет доступных NFT для продажи
                </div>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                Цена (в {selectedType === 'nft' && paymentToken === 'GT' ? 'GT токенах' : 'ELL'})
              </label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} min="1" step={selectedType === 'nft' && paymentToken === 'GT' ? '0.01' : '1'} className="bg-black/50 border-2 border-white text-white h-8 text-sm" />
            </div>

            <Button onClick={handleCreate} disabled={!selectedItem || !price || loading} variant="menu" className="w-full" size="sm" style={{
            boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
          }}>
              Создать объявление
            </Button>
          </div>
        </Card>
      </div>
    </div>;
};