import { Contract } from "near-api-js";
import { Card, CardType, Rarity } from "@/types/cards";

export interface NFTMetadata {
  title: string;
  description: string;
  media: string;
  copies: number;
  issued_at?: string;
  expires_at?: string;
  starts_at?: string;
  updated_at?: string;
  extra?: string;
  reference?: string;
  reference_hash?: string;
}

export interface NFTToken {
  token_id: string;
  owner_id: string;
  metadata: NFTMetadata;
  approved_account_ids?: Record<string, number>;
}

export interface NFTStats {
  power: number;
  defense: number;
  health: number;
  magic: number;  // Added magic property
}

const NFT_CONTRACT_ID = "darai.mintbase1.near";

export function parseNFTStats(metadata: NFTMetadata): NFTStats {
  try {
    const extra = metadata.extra ? JSON.parse(metadata.extra) : null;
    return {
      power: extra?.power || Math.floor(Math.random() * 20) + 10,
      defense: extra?.defense || Math.floor(Math.random() * 15) + 5,
      health: extra?.health || Math.floor(Math.random() * 50) + 50,
      magic: extra?.magic || Math.floor(Math.random() * 10) + 5
    };
  } catch (error) {
    console.error("Error parsing NFT stats:", error);
    return {
      power: Math.floor(Math.random() * 20) + 10,
      defense: Math.floor(Math.random() * 15) + 5,
      health: Math.floor(Math.random() * 50) + 50,
      magic: Math.floor(Math.random() * 10) + 5
    };
  }
}

export function convertNFTToCard(nft: NFTToken): Card {
  const stats = parseNFTStats(nft.metadata);
  return {
    id: nft.token_id,
    name: nft.metadata.title,
    type: 'character' as CardType,
    power: stats.power,
    defense: stats.defense,
    health: stats.health,
    magic: stats.magic,
    rarity: Math.min(Math.floor(Math.random() * 8) + 1, 8) as Rarity,
    image: nft.metadata.media,
  };
}

export async function getNFTsForAccount(accountId: string, connection: any): Promise<NFTToken[]> {
  try {
    const contract = new Contract(connection.account(), NFT_CONTRACT_ID, {
      viewMethods: ["nft_tokens_for_owner"],
      changeMethods: [],
      useLocalViewExecution: true
    });

    const tokens = await (contract as any).nft_tokens_for_owner({
      account_id: accountId,
      from_index: "0",
      limit: 100,
    });

    return tokens;
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return [];
  }
}