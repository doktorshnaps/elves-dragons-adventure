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
      const { error } = await supabase
        .from('whitelist_contracts')
        .insert({
          contract_address: newContract.address.trim(),
          contract_name: newContract.name.trim() || null,
          description: newContract.description.trim() || null,
          added_by_wallet_address: 'mr_bruts.tg'
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

  useEffect(() => {
    loadContracts();
  }, []);

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