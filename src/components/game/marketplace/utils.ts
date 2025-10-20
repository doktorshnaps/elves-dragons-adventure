import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";
import { NFTCard } from "@/hooks/useNFTCards";
import { cardDatabase } from "@/data/cardDatabase";

export const getItemDisplayInfo = (item: CardType | Item | NFTCard) => {
  // Check if it's an NFT card
  if ('nft_token_id' in item && 'nft_contract_id' in item) {
    const nft = item as NFTCard;
    return {
      rarity: typeof nft.rarity === 'string' ? 1 : nft.rarity,
      type: "NFT Карта",
      description: nft.description || (nft.type === 'pet' ? "NFT Питомец" : "NFT Герой"),
      image: nft.image,
      faction: nft.faction,
      isNFT: true,
    } as any;
  }
  
  if ("rarity" in item) {
    const card = item as CardType;
    const dbCard = cardDatabase.find((c) => c.name === card.name);
    return {
      rarity: card.rarity,
      type: "Карта",
      description: dbCard?.description || (card.type === "character" ? "Герой" : "Питомец"),
      image: card.image || (dbCard as any)?.image,
      faction: card.faction,
    } as any;
  }
  return {
    type: "Предмет",
    description: (item as Item).type === "healthPotion" ? "Зелье здоровья" : "Набор карт",
    image: (item as any).image,
  } as any;
};