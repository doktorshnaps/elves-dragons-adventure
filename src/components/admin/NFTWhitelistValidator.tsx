import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, RefreshCw, Users, AlertTriangle } from 'lucide-react';

export const NFTWhitelistValidator = () => {
  const [loading, setLoading] = useState(false);
  const [lastResults, setLastResults] = useState<any>(null);
  const { toast } = useToast();

  const validateSingleUser = async (walletAddress: string) => {
    if (!walletAddress.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите адрес кошелька",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-nft-whitelist', {
        body: { wallet_address: walletAddress.trim() }
      });

      if (error) throw error;

      setLastResults(data);
      
      const result = data.results;
      const message = result.hadNFTs 
        ? `✅ Пользователь ${walletAddress} подтвержден (найдены NFT)`
        : `❌ Вайт-лист отозван у ${walletAddress} (NFT не найдены)`;

      toast({
        title: "Проверка завершена",
        description: message,
      });

    } catch (error: any) {
      console.error('Error validating user:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить проверку",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAllUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-nft-whitelist', {
        body: { validate_all: true }
      });

      if (error) throw error;

      setLastResults(data);
      
      const { summary } = data;
      const message = `Проверено ${summary.totalChecked} пользователей: ${summary.confirmed} подтверждено, ${summary.revoked} отозвано`;

      toast({
        title: "Массовая проверка завершена",
        description: message,
      });

    } catch (error: any) {
      console.error('Error validating all users:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить массовую проверку",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSpecificUser = () => {
    const walletAddress = prompt('Введите адрес кошелька для проверки:');
    if (walletAddress) {
      validateSingleUser(walletAddress);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Валидация NFT вайт-листа</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={checkSpecificUser}
            disabled={loading}
            variant="outline"
            className="h-20 flex flex-col items-center space-y-2"
          >
            <Users className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">Проверить пользователя</div>
              <div className="text-sm text-muted-foreground">Проверка конкретного адреса</div>
            </div>
          </Button>

          <Button
            onClick={validateAllUsers}
            disabled={loading}
            variant="outline"
            className="h-20 flex flex-col items-center space-y-2"
          >
            <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            <div className="text-center">
              <div className="font-medium">Проверить всех</div>
              <div className="text-sm text-muted-foreground">Массовая валидация всех NFT вайт-листов</div>
            </div>
          </Button>
        </div>

        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800">Автоматический отзыв вайт-листа</div>
              <div className="text-yellow-700 mt-1">
                Система автоматически проверяет наличие NFT из активных контрактов. 
                Если игрок продал/перевел NFT, его вайт-лист будет отозван для предотвращения обходов защиты.
              </div>
            </div>
          </div>
        </div>

        {lastResults && (
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Результаты последней проверки:</h3>
            <div className="text-sm space-y-1">
              {lastResults.summary ? (
                <>
                  <div>📊 Всего проверено: {lastResults.summary.totalChecked}</div>
                  <div className="text-green-600">✅ Подтверждено: {lastResults.summary.confirmed}</div>
                  <div className="text-red-600">❌ Отозвано: {lastResults.summary.revoked}</div>
                  {lastResults.summary.errors > 0 && (
                    <div className="text-orange-600">⚠️ Ошибок: {lastResults.summary.errors}</div>
                  )}
                </>
              ) : (
                <div>
                  Кошелек: {lastResults.results?.wallet}<br/>
                  Статус: {lastResults.results?.hadNFTs ? 'NFT найдены ✅' : 'NFT не найдены ❌'}<br/>
                  Контракты: {lastResults.results?.foundContracts?.join(', ') || 'Нет'}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};