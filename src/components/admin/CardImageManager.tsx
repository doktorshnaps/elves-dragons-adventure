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

// Нормализует URL из Supabase Storage в локальный путь
const normalizeImageUrl = (url: string): string => {
  if (!url) return '/placeholder.svg';
  
  // Если URL указывает на Supabase Storage lovable-uploads, конвертируем в локальный путь
  const supabaseStoragePattern = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/lovable-uploads\/([^/?]+)/;
  const match = url.match(supabaseStoragePattern);
  
  if (match) {
    const fileId = match[1];
    // Проверяем, есть ли уже расширение
    const hasExtension = /\.(webp|png|jpg|jpeg|gif)$/i.test(fileId);
    return hasExtension ? `/lovable-uploads/${fileId}` : `/lovable-uploads/${fileId}.webp`;
  }
  
  // Если уже локальный путь, возвращаем как есть
  if (url.startsWith('/lovable-uploads/')) {
    return url;
  }
  
  return url;
};

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Получаем уникальные карты с фракциями из базы данных
  const uniqueCards = cardDatabase
    .filter(card => card.type === 'character' || card.type === 'pet')
    .map(card => ({
      name: card.name,
      faction: card.faction,
      type: card.type === 'pet' ? 'dragon' as const : 'hero' as const,
      displayName: `${card.name} (${card.faction})`
    }));

  const loadCardImages = async (retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('card_images')
        .select('*')
        .order('card_name', { ascending: true })
        .order('rarity', { ascending: true });

      if (error) {
        // Retry on network errors
        if (retryCount < 2 && (error.message?.includes('fetch') || error.code === 'PGRST301')) {
          console.log(`Retrying loadCardImages (attempt ${retryCount + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadCardImages(retryCount + 1);
        }
        throw error;
      }
      setCardImages((data as CardImage[]) || []);
    } catch (error) {
      console.error('Error loading card images:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображения карт. Попробуйте обновить страницу.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      await loadCardImages();
      setLoading(false);
    };
    fetchImages();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCardName || !selectedFaction || !walletAddress) {
      toast({
        title: "Ошибка",
        description: "Выберите карту, фракцию и файл изображения",
        variant: "destructive"
      });
      return;
    }

    setUploadingFile(true);
    try {
      // Функция для транслитерации кириллицы в латиницу и безопасного слага
      const transliterate = (text: string): string => {
        const ru: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
          'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
          'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
          'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return text.toLowerCase().split('').map(char => ru[char] || char).join('');
      };

      const slugify = (text: string): string => {
        return transliterate(text)
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9._-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^[-.]+|[-.]+$/g, '');
      };

      // Prepare file data
      const fileExt = (selectedFile.name.split('.').pop() || 'png').toLowerCase();
      const safeName = slugify(selectedCardName);
      const safeFaction = slugify(selectedFaction);
      const fileName = `${safeName}-${safeFaction}-rarity-${selectedRarity}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Create FormData for edge function
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('filePath', filePath);
      formData.append('walletAddress', walletAddress);
      formData.append('cardName', selectedCardName);
      formData.append('cardType', selectedCardType);
      formData.append('faction', selectedFaction);
      formData.append('rarity', selectedRarity.toString());

      // Call edge function to upload with admin privileges
      const { data, error } = await supabase.functions.invoke('upload-card-image', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Успешно загружено",
        description: `Изображение для ${selectedCardName} (${selectedFaction}, редкость ${selectedRarity}) сохранено`
      });

      // Сбрасываем кэш изображений и выбранный файл
      invalidateCardImagesCache();
      loadCardImages();
      setSelectedFile(null);
      // Очищаем input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
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
    if (!confirm('Вы уверены, что хотите удалить это изображение?')) {
      return;
    }

    try {
      // Удаляем запись из базы данных
      const { error: dbError } = await supabase
        .from('card_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Удаляем файл из Storage
      const filePath = imageUrl.split('/').pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('card-images')
          .remove([filePath]);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      // Сбрасываем кэш изображений
      invalidateCardImagesCache();
      
      // Немедленно обновляем UI
      setCardImages(prevImages => prevImages.filter(img => img.id !== imageId));

      toast({
        title: "Успешно удалено",
        description: "Изображение удалено"
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить изображение",
        variant: "destructive"
      });
      // Перезагружаем список в случае ошибки
      await loadCardImages();
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
              onChange={handleFileSelect}
              disabled={!selectedCardName || !selectedFaction || uploadingFile}
            />
            {selectedFile && (
              <p className="text-sm text-green-400 mt-1">
                Выбран файл: {selectedFile.name}
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedCardName || !selectedFaction || uploadingFile}
            className="w-full"
          >
            {uploadingFile ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Применить изменения
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Загруженные изображения</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardImages.map(image => (
            <Card key={image.id} className="p-4">
              <img 
                src={normalizeImageUrl(image.image_url)} 
                alt={`${image.card_name} - ${image.rarity}`}
                className="w-full h-48 object-cover rounded-lg mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/placeholder.svg';
                }}
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
