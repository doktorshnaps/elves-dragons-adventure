import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { cardDatabase } from "@/data/cardDatabase";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { invalidateCardImagesCache } from '@/utils/cardImageResolver';

interface CardImage {
  id: string;
  card_name: string;
  card_type: 'hero' | 'dragon';
  rarity: number;
  image_url: string;
  faction?: string;
}

export const CardImageManager = () => {
  const { accountId: walletAddress } = useWalletContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cardImages, setCardImages] = useState<CardImage[]>([]);
  const [selectedCardName, setSelectedCardName] = useState<string>("");
  const [selectedFaction, setSelectedFaction] = useState<string>("");
  const [selectedCardType, setSelectedCardType] = useState<'hero' | 'dragon'>('hero');
  const [selectedRarity, setSelectedRarity] = useState<number>(1);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Получаем уникальные карты с фракциями из базы данных
  const uniqueCards = cardDatabase
    .filter(card => card.type === 'character' || card.type === 'pet')
    .map(card => ({
      name: card.name,
      faction: card.faction,
      type: card.type === 'pet' ? 'dragon' as const : 'hero' as const,
      displayName: `${card.name} (${card.faction})`
    }));

  const loadCardImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_images')
        .select('*')
        .order('card_name', { ascending: true })
        .order('rarity', { ascending: true });

      if (error) throw error;
      setCardImages((data as CardImage[]) || []);
    } catch (error) {
      console.error('Error loading card images:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображения карт",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCardImages();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCardName || !selectedFaction || !walletAddress) return;

    setUploadingFile(true);
    try {
      // Загружаем файл в Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedCardName.toLowerCase().replace(/\s+/g, '-')}-rarity-${selectedRarity}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      // Сохраняем запись в базе данных
      const { error: dbError } = await supabase
        .from('card_images')
        .upsert({
          card_name: selectedCardName,
          card_type: selectedCardType,
          faction: selectedFaction,
          rarity: selectedRarity,
          image_url: publicUrl,
          created_by_wallet_address: walletAddress
        }, {
          onConflict: 'card_name,card_type,rarity,faction'
        });

      if (dbError) throw dbError;

      toast({
        title: "Успешно загружено",
        description: `Изображение для ${selectedCardName} (${selectedFaction}, редкость ${selectedRarity}) сохранено`
      });

      // Сбрасываем кэш изображений
      invalidateCardImagesCache();
      loadCardImages();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображение",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDelete = async (imageId: string, imageUrl: string) => {
    try {
      // Удаляем файл из Storage
      const filePath = imageUrl.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('card-images')
          .remove([filePath]);
      }

      // Удаляем запись из базы данных
      const { error } = await supabase
        .from('card_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Успешно удалено",
        description: "Изображение удалено"
      });

      // Сбрасываем кэш изображений
      invalidateCardImagesCache();
      loadCardImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить изображение",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Загрузить изображение карты</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Название карты</Label>
              <Select 
                value={`${selectedCardName}|${selectedFaction}`} 
                onValueChange={(value) => {
                  const [name, faction] = value.split('|');
                  setSelectedCardName(name);
                  setSelectedFaction(faction);
                  const card = uniqueCards.find(c => c.name === name && c.faction === faction);
                  if (card) {
                    setSelectedCardType(card.type);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите карту" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCards.map(card => (
                    <SelectItem key={`${card.name}-${card.faction}`} value={`${card.name}|${card.faction}`}>
                      {card.displayName} ({card.type === 'hero' ? 'Герой' : 'Дракон'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Тип карты</Label>
              <Select 
                value={selectedCardType} 
                onValueChange={(value: 'hero' | 'dragon') => setSelectedCardType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Герой</SelectItem>
                  <SelectItem value="dragon">Дракон</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Редкость (1-8)</Label>
              <Select 
                value={selectedRarity.toString()} 
                onValueChange={(value) => setSelectedRarity(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(r => (
                    <SelectItem key={r} value={r.toString()}>
                      {"⭐".repeat(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="image-upload">Выберите изображение</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={!selectedCardName || !selectedFaction || uploadingFile}
            />
          </div>

          {uploadingFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка...
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Загруженные изображения</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardImages.map(image => (
            <Card key={image.id} className="p-4">
              <img 
                src={image.image_url} 
                alt={`${image.card_name} - ${image.rarity}`}
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
              <div className="space-y-1">
                <p className="font-semibold">{image.card_name}</p>
                {image.faction && (
                  <p className="text-sm text-purple-400">{image.faction}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {image.card_type === 'hero' ? 'Герой' : 'Дракон'} | {"⭐".repeat(image.rarity)}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2"
                onClick={() => handleDelete(image.id, image.image_url)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </Card>
          ))}
        </div>
        {cardImages.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Изображения не загружены
          </p>
        )}
      </Card>
    </div>
  );
};
