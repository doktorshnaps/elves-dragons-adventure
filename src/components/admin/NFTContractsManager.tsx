import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, FileCode } from 'lucide-react';
import { useWhitelistContractsData } from '@/hooks/useWhitelistContractsData';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const NFTContractsManager: React.FC = () => {
  const { accountId } = useWalletContext();
  const { contracts, isLoading, addContract, toggleContractStatus, deleteContract } = useWhitelistContractsData();
  
  const [newContractId, setNewContractId] = useState('');
  const [newContractName, setNewContractName] = useState('');

  const handleAddContract = () => {
    if (!newContractId.trim() || !newContractName.trim() || !accountId) return;

    addContract.mutate({
      contractId: newContractId.trim(),
      contractName: newContractName.trim(),
      walletAddress: accountId,
    });

    setNewContractId('');
    setNewContractName('');
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileCode className="h-5 w-5" />
          NFT Контракты
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new contract form */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
          <h3 className="text-sm font-medium text-foreground">Добавить контракт</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contractId">ID контракта</Label>
              <Input
                id="contractId"
                placeholder="nft.example.near"
                value={newContractId}
                onChange={(e) => setNewContractId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractName">Название</Label>
              <Input
                id="contractName"
                placeholder="Example NFT Collection"
                value={newContractName}
                onChange={(e) => setNewContractName(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAddContract}
            disabled={!newContractId.trim() || !newContractName.trim() || addContract.isPending}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </div>

        {/* Contracts list */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Список контрактов ({contracts.length})
          </h3>
          
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет добавленных контрактов
            </div>
          ) : (
            <div className="space-y-2">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {contract.contract_name}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {contract.contract_id}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={contract.is_active}
                        onCheckedChange={(checked) => 
                          toggleContractStatus.mutate({ id: contract.id, isActive: checked })
                        }
                        disabled={toggleContractStatus.isPending}
                      />
                      <span className="text-xs text-muted-foreground">
                        {contract.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteContract.mutate(contract.id)}
                      disabled={deleteContract.isPending}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
