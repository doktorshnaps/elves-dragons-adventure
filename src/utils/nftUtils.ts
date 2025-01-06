import { toast } from '@/components/ui/use-toast';

export const fetchNFTCollection = async (contractAddress: string, walletAddress: string) => {
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v1/assets?owner=${walletAddress}&asset_contract_address=${contractAddress}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch NFT collection');
    }
    
    const data = await response.json();
    return data.assets;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    toast({
      title: "Ошибка",
      description: "Не удалось загрузить NFT коллекцию",
      variant: "destructive"
    });
    return [];
  }
};