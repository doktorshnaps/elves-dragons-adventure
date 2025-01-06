import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchNFTCollection } from '@/utils/nftUtils';
import { useAccount } from 'wagmi';

export const NFTGallery = () => {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFetchNFTs = async () => {
    if (!address || !contractAddress) return;
    
    setLoading(true);
    try {
      const nftData = await fetchNFTCollection(contractAddress, address);
      setNfts(nftData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Адрес контракта NFT коллекции"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
        />
        <Button 
          onClick={handleFetchNFTs}
          disabled={loading || !address}
        >
          {loading ? 'Загрузка...' : 'Получить NFT'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft: any) => (
          <Card key={nft.id} className="p-4">
            <img 
              src={nft.image_url || '/placeholder.svg'} 
              alt={nft.name}
              className="w-full h-48 object-cover rounded-lg"
            />
            <h3 className="mt-2 font-bold">{nft.name || 'Unnamed NFT'}</h3>
            <p className="text-sm text-gray-500">{nft.description || 'No description'}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};