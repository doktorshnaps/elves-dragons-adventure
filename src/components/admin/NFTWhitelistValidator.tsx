import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, RefreshCw, Users, AlertTriangle } from 'lucide-react';

interface WhitelistContract {
  id: string;
  contract_address: string;
  contract_name: string | null;
  description: string | null;
}

export const NFTWhitelistValidator = () => {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastResults, setLastResults] = useState<any>(null);
  const [contracts, setContracts] = useState<WhitelistContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('whitelist_contracts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
    }
  };

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
      const body: any = { wallet_address: walletAddress.trim() };
      
      // Если выбран конкретный контракт, передаем его
      if (selectedContract !== 'all') {
        body.specific_contract = selectedContract;
      }

      const { data, error } = await supabase.functions.invoke('validate-nft-whitelist', {
        body
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
    setValidating(true);
    
    const contractInfo = selectedContract !== 'all' 
      ? ` контракта ${contracts.find(c => c.contract_address === selectedContract)?.contract_name || selectedContract}`
      : ' (первые 50)';
    
    const loadingToast = toast({
      title: "Проверка запущена",
      description: `Проверка холдеров${contractInfo}...`,
      duration: Infinity,
    });

    try {
      // Таймаут 2 минуты для edge функции
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const body: any = { validate_all: true };
      
      // Если выбран конкретный контракт, передаем его
      if (selectedContract !== 'all') {
        body.specific_contract = selectedContract;
      }

      const { data, error } = await supabase.functions.invoke('validate-nft-whitelist', {
        body,
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);
      loadingToast.dismiss();

      if (error) throw error;

      setLastResults(data);
      
      const { summary } = data;
      const timedOutMsg = summary.timedOut 
        ? ` (частичные результаты, осталось ${summary.remainingWallets})`
        : '';
      
      const message = `Проверено ${summary.totalChecked} пользователей${contractInfo}: ${summary.confirmed} подтверждено, ${summary.revoked} отозвано${timedOutMsg}`;

      toast({
        title: summary.timedOut ? "Частичная проверка завершена" : "Массовая проверка завершена",
        description: message,
        duration: 10000,
      });

    } catch (error: any) {
      loadingToast.dismiss();
      console.error('Error validating all users:', error);
      
      if (error.name === 'AbortError') {
        toast({
          title: "Превышен таймаут",
          description: "Проверка заняла слишком много времени",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось выполнить массовую проверку",
          variant: "destructive",
        });
      }
    } finally {
      setValidating(false);
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
        {/* Выбор контракта для проверки */}
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
          <label className="text-sm font-medium mb-2 block">
            Контракт для проверки держателей NFT
          </label>
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите контракт" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все активные контракты</SelectItem>
              {contracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.contract_address}>
                  {contract.contract_name || contract.contract_address}
                  {contract.description && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({contract.description})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Выберите конкретный контракт для проверки NFT или оставьте "Все контракты" для проверки по всем активным контрактам
          </p>
        </div>

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
            disabled={loading || validating}
            variant="outline"
            className="h-20 flex flex-col items-center space-y-2"
          >
            <RefreshCw className={`w-6 h-6 ${(loading || validating) ? 'animate-spin' : ''}`} />
            <div className="text-center">
              <div className="font-medium">Проверить всех</div>
              <div className="text-sm text-muted-foreground">
                {validating 
                  ? 'Проверка...' 
                  : selectedContract !== 'all' 
                    ? 'Все холдеры контракта' 
                    : 'Первые 50 адресов'}
              </div>
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
                  
                  {/* Список отозванных адресов */}
                  {lastResults.results && Array.isArray(lastResults.results) && lastResults.results.filter((r: any) => r.success && !r.hadNFTs).length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium text-red-800 mb-2">Отозванные вайт-листы:</div>
                      <div className="space-y-1">
                        {lastResults.results
                          .filter((r: any) => r.success && !r.hadNFTs)
                          .map((r: any, idx: number) => (
                            <div key={idx} className="text-red-700">
                              • {r.wallet}
                            </div>
                          ))}
                      </div>
                    </div>
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