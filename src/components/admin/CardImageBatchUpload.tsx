import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileJson, Download, Sparkles } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { cardDatabase } from "@/data/cardDatabase";

interface CardImageMapping {
  uuid: string;
  cardName: string;
  cardType: string;
  faction: string;
  rarity: number;
}

export const CardImageBatchUpload = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { accountId } = useWalletContext();

  const exampleData: CardImageMapping[] = [
    {
      uuid: "27831c0a-e7a0-4ac4-84d9-642b6fa0e31c",
      cardName: "Рекрут",
      cardType: "hero",
      faction: "Каледор",
      rarity: 1
    },
    {
      uuid: "2e4cba48-e157-417d-9e50-df04a49583c1",
      cardName: "Маг",
      cardType: "hero",
      faction: "Элленар",
      rarity: 1
    }
  ];

  const handleDownloadTemplate = () => {
    const dataStr = JSON.stringify(exampleData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'card-images-template.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleAutoImport = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Подключите кошелек",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data, error } = await supabase.functions.invoke('auto-import-grimoire-cards', {
        body: {
          cards: cardDatabase,
          walletAddress: accountId
        }
      });

      if (error) throw error;

      // Инвалидируем кэш изображений после импорта
      const { invalidateCardImagesCache } = await import('@/utils/cardImageResolver');
      invalidateCardImagesCache();

      toast({
        title: "✅ Автоматический импорт завершен",
        description: data.message,
      });

      if (data.results.errors.length > 0) {
        console.error('Import errors:', data.results.errors);
        toast({
          title: "⚠️ Некоторые карты не импортированы",
          description: `Ошибок: ${data.results.errors.length}`,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Auto-import error:', error);
      toast({
        title: "Ошибка автоматического импорта",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Подключите кошелек",
        variant: "destructive"
      });
      return;
    }

    try {
      const mappings: CardImageMapping[] = JSON.parse(jsonInput);
      
      if (!Array.isArray(mappings)) {
        throw new Error("JSON должен быть массивом");
      }

      setIsUploading(true);

      const { data, error } = await supabase.functions.invoke('batch-upload-card-images', {
        body: {
          mappings,
          walletAddress: accountId
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Загрузка завершена",
        description: data.message,
      });

      if (data.results.errors.length > 0) {
        console.error('Upload errors:', data.results.errors);
      }

      // Clear input on success
      if (data.results.success > 0) {
        setJsonInput("");
      }

    } catch (error: any) {
      console.error('Batch upload error:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Массовая загрузка изображений карт</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Загрузите JSON с соответствиями UUID → Карта/Фракция/Редкость
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAutoImport}
              disabled={isUploading}
              variant="default"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Автоимпорт из Гримуара
            </Button>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Шаблон
            </Button>
          </div>
        </div>
        
        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <p className="text-sm font-semibold mb-2">✨ Рекомендуется: Автоматический импорт</p>
          <p className="text-xs text-muted-foreground">
            Нажмите "Автоимпорт из Гримуара" для автоматической загрузки всех карт с корректными изображениями из базы данных гримуара.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">JSON данные</label>
        <Textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={JSON.stringify(exampleData, null, 2)}
          className="font-mono text-xs min-h-[300px]"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleUpload}
          disabled={isUploading || !jsonInput.trim()}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Загрузка...' : 'Загрузить изображения'}
        </Button>
        <Button
          onClick={() => setJsonInput(JSON.stringify(exampleData, null, 2))}
          variant="outline"
        >
          <FileJson className="w-4 h-4 mr-2" />
          Пример
        </Button>
      </div>

      <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
        <p className="font-semibold">Формат JSON:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><code>uuid</code>: UUID файла из /lovable-uploads (без расширения)</li>
          <li><code>cardName</code>: Название карты (например, "Рекрут", "Маг")</li>
          <li><code>cardType</code>: Тип карты ("hero" или "dragon")</li>
          <li><code>faction</code>: Фракция (например, "Каледор", "Элленар")</li>
          <li><code>rarity</code>: Редкость (число от 1 до 8)</li>
        </ul>
      </div>
    </Card>
  );
};
