import { Contract } from "near-api-js";

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
}

const NFT_CONTRACT_ID = "your-nft-contract.near"; // Замените на ваш контракт

export async function getNFTsForAccount(accountId: string, connection: any): Promise<NFTToken[]> {
  try {
    const contract = new Contract(connection.account(), NFT_CONTRACT_ID, {
      viewMethods: ["nft_tokens_for_owner"],
      changeMethods: [],
    });

    const tokens = await contract.nft_tokens_for_owner({
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

export function parseNFTStats(metadata: NFTMetadata): NFTStats {
  try {
    const extra = metadata.extra ? JSON.parse(metadata.extra) : null;
    return {
      power: extra?.power || 10,
      defense: extra?.defense || 5,
      health: extra?.health || 100,
    };
  } catch (error) {
    console.error("Error parsing NFT stats:", error);
    return {
      power: 10,
      defense: 5,
      health: 100,
    };
  }
}

export function convertNFTToCard(nft: NFTToken) {
  const stats = parseNFTStats(nft.metadata);
  return {
    id: nft.token_id,
    name: nft.metadata.title,
    type: 'character' as const,
    power: stats.power,
    defense: stats.defense,
    health: stats.health,
    rarity: 1,
    image: nft.metadata.media,
  };
}