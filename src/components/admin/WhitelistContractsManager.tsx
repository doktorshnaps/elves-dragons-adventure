import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

interface WhitelistContract {
  id: string;
  contract_address: string;
  contract_name: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export const WhitelistContractsManager = () => {
  const [contracts, setContracts] = useState<WhitelistContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [newContract, setNewContract] = useState({
    address: '',
    name: '',
    description: ''
  });
  const { toast } = useToast();

  const loadContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whitelist_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить контракты",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const addContract = async () => {
    if (!newContract.address.trim()) {
      toast({
        title: "Ошибка",
        description: "Адрес контракта обязателен",
        variant: "destructive",
      });
      return;
    }

    try {
      // Try to get wallet address from game_data
      const gameDataRaw = localStorage.getItem('gameData');
      let walletAddress = 'mr_bruts.tg'; // default fallback
      
      if (gameDataRaw) {
        try {
          const gameData = JSON.parse(gameDataRaw);
          if (gameData?.wallet_address) {
            walletAddress = gameData.wallet_address;
          }
        } catch (e) {
          console.warn('Could not parse gameData from localStorage');
        }
      }
      
      const { error } = await supabase.rpc('admin_add_whitelist_contract', {
        p_admin_wallet_address: walletAddress,
        p_contract_address: newContract.address.trim(),
        p_contract_name: newContract.name.trim(),
        p_description: newContract.description.trim(),
        p_is_active: true
      });

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Контракт добавлен",
      });

      setNewContract({ address: '', name: '', description: '' });
      loadContracts();
    } catch (error: any) {
      console.error('Error adding contract:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить контракт",
        variant: "destructive",
      });
    }
  };

  const toggleContractStatus = async (contractId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('whitelist_contracts')
        .update({ is_active: !currentStatus })
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Контракт ${!currentStatus ? 'активирован' : 'деактивирован'}`,
      });

      loadContracts();
    } catch (error: any) {
      console.error('Error toggling contract status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус контракта",
        variant: "destructive",
      });
    }
  };

  const deleteContract = async (contractId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот контракт?')) return;

    try {
      const { error } = await supabase
        .from('whitelist_contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Контракт удален",
      });

      loadContracts();
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить контракт",
        variant: "destructive",
      });
    }
  };

  const validateAllNFTWhitelists = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-nft-whitelist', {
        body: { check_all_nft_users: true }
      });

      if (error) throw error;

      toast({
        title: "Проверка завершена",
        description: data?.message || "Проверка автоматических вайт-листов завершена",
      });

      // Refresh contracts list after validation
      loadContracts();
    } catch (error: any) {
      console.error('Error validating NFT whitelists:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выполнить проверку",
        variant: "destructive",
      });
    }
  };

  // Auto-add Mintbase contract on component mount if not exists
  useEffect(() => {
    const autoAddMintbaseContract = async () => {
      // Check if Mintbase contract already exists
      const exists = contracts.some(c => c.contract_address === 'elleonortesr.mintbase1.near');
      if (exists) return;

      try {
        const gameDataRaw = localStorage.getItem('gameData');
        let walletAddress = 'mr_bruts.tg';
        
        if (gameDataRaw) {
          try {
            const gameData = JSON.parse(gameDataRaw);
            if (gameData?.wallet_address) {
              walletAddress = gameData.wallet_address;
            }
          } catch (e) {
            console.warn('Could not parse gameData');
          }
        }

        await supabase.rpc('admin_add_whitelist_contract', {
          p_admin_wallet_address: walletAddress,
          p_contract_address: 'elleonortesr.mintbase1.near',
          p_contract_name: 'Mintbase NFT Cards',
          p_description: 'NFT контракт для карточек героев и драконов из Mintbase',
          p_is_active: true
        });

        console.log('✅ Auto-added Mintbase contract');
        loadContracts();
      } catch (error: any) {
        // Ignore errors - contract might already exist
        console.log('Mintbase contract check:', error.message);
      }
    };

    if (contracts.length > 0) {
      autoAddMintbaseContract();
    }
  }, [contracts.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление NFT контрактами для вайт-листа</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Форма добавления нового контракта */}
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-medium">Добавить новый контракт</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Адрес контракта *</label>
              <Input
                value={newContract.address}
                onChange={(e) => setNewContract({ ...newContract, address: e.target.value })}
                placeholder="например: golden_ticket.nfts.tg"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Название</label>
              <Input
                value={newContract.name}
                onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                placeholder="например: Golden Ticket NFTs"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Описание</label>
            <Textarea
              value={newContract.description}
              onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
              placeholder="Описание контракта..."
              rows={2}
            />
          </div>
          <Button onClick={addContract} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Добавить контракт
          </Button>
        </div>

        {/* Кнопка валидации */}
        <div className="p-4 border rounded-lg bg-yellow-50">
          <h3 className="font-medium mb-2">Проверка существующих вайт-листов</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Проверить всех игроков с автоматическим вайт-листом на наличие NFT. 
            Если NFT больше нет, вайт-лист будет отозван.
          </p>
          <Button onClick={validateAllNFTWhitelists} variant="outline" className="w-full">
            🔍 Проверить и отозвать недействительные вайт-листы
          </Button>
        </div>

        {/* Список контрактов */}
        <div className="space-y-4">
          <h3 className="font-medium">Активные контракты ({contracts.filter(c => c.is_active).length})</h3>
          {loading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Контракты не найдены</div>
          ) : (
            contracts.map((contract) => (
              <div key={contract.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {contract.contract_address}
                    </code>
                    <span className={`px-2 py-1 rounded text-xs ${
                      contract.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {contract.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleContractStatus(contract.id, contract.is_active)}
                    >
                      {contract.is_active ? (
                        <ToggleRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteContract(contract.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {contract.contract_name && (
                  <div className="font-medium mb-1">{contract.contract_name}</div>
                )}
                {contract.description && (
                  <div className="text-sm text-muted-foreground">{contract.description}</div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Добавлен: {new Date(contract.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};