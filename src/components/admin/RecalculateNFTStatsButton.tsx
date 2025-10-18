import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateCardStats, refreshGameSettings } from "@/utils/cardUtils";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";

export const RecalculateNFTStatsButton = () => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();
  const { accountId } = useWalletContext();

  const handleRecalculate = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Подключите кошелек",
        variant: "destructive",
      });
      return;
    }

    setIsRecalculating(true);
    try {
      console.log('🔄 Starting NFT stats recalculation...');
      
      // Обновляем кеш настроек игры
      await refreshGameSettings();
      
      console.log('✅ Game settings refreshed');

      // Получаем все NFT карточки
      const { data: nftInstances, error } = await supabase
        .rpc('get_nft_card_instances_by_wallet', { p_wallet_address: accountId });

      if (error) throw error;

      if (!nftInstances || nftInstances.length === 0) {
        toast({
          title: "Нет NFT карточек",
          description: "У вас нет NFT карточек для пересчета",
        });
        return;
      }

      console.log(`🔄 Recalculating stats for ${nftInstances.length} NFT cards...`);

      let successCount = 0;
      let errorCount = 0;

      // Пересчитываем каждую карточку
      for (const instance of nftInstances) {
        const cardData = instance.card_data as any;
        const cardName = cardData.name || '';
        const rarity = Number(cardData.rarity) || 1;
        const cardType = (cardData?.type === 'pet') ? 'pet' : 'character';

        console.log(`🔍 Processing NFT card: "${cardName}", rarity: ${rarity}, type: ${cardType}`);
        console.log(`📋 Full card data:`, cardData);

        // Пересчитываем характеристики с актуальными настройками
        const recalculatedStats = calculateCardStats(cardName, rarity as any, cardType);

        console.log(`📊 Recalculated stats for "${cardName}":`, recalculatedStats);

        // Обновляем card_data (сохраняем все существующие поля)
        const updatedCardData = {
          ...cardData,
          health: recalculatedStats.health,
          power: recalculatedStats.power,
          defense: recalculatedStats.defense,
          magic: recalculatedStats.magic
        };

        // Обновляем в БД
        const { error: updateError } = await supabase.rpc('upsert_nft_card_instance', {
          p_wallet_address: accountId,
          p_nft_contract_id: instance.nft_contract_id!,
          p_nft_token_id: instance.nft_token_id!,
          p_card_template_id: instance.card_template_id,
          p_card_type: cardType === 'pet' ? 'dragon' : 'hero',
          p_max_health: recalculatedStats.health,
          p_card_data: updatedCardData
        });

        if (updateError) {
          console.error('Error updating NFT instance:', updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated: ${cardName} (${instance.nft_token_id}) - HP: ${recalculatedStats.health}`);
          successCount++;
        }
      }

      toast({
        title: "Пересчет завершен",
        description: `Обновлено: ${successCount}, ошибок: ${errorCount}`,
      });

      // Перезагружаем card instances
      window.location.reload();
    } catch (error) {
      console.error('Error recalculating NFT stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось пересчитать характеристики",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Button
      onClick={handleRecalculate}
      disabled={isRecalculating}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
      {isRecalculating ? 'Пересчет...' : 'Пересчитать NFT характеристики'}
    </Button>
  );
};
