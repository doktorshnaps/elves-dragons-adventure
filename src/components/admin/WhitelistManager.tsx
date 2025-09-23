import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhitelistEntry {
  id: string;
  wallet_address: string;
  notes: string | null;
  added_at: string;
  is_active: boolean;
  whitelist_source?: string;
}

export const WhitelistManager = () => {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadWhitelist = async () => {
    try {
      const { data, error } = await supabase
        .from('whitelist')
        .select('*')
        .eq('is_active', true)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading whitelist:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить вайт-лист',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadWhitelist();
  }, []);

  const addToWhitelist = async () => {
    if (!newAddress.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите адрес кошелька',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_add_to_whitelist', {
        p_wallet_address: newAddress.trim(),
        p_notes: newNotes.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Успех',
        description: 'Адрес добавлен в вайт-лист',
      });

      setNewAddress('');
      setNewNotes('');
      loadWhitelist();
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить адрес в вайт-лист',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWhitelist = async (walletAddress: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_remove_from_whitelist', {
        p_wallet_address: walletAddress,
      });

      if (error) throw error;

      toast({
        title: 'Успех',
        description: 'Адрес удален из вайт-листа',
      });

      loadWhitelist();
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить адрес из вайт-листа',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeEntries = entries;

  return (
    <Card className="bg-game-surface border-game-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-game-accent">
          <Users className="w-5 h-5" />
          Управление вайт-листом
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new address */}
        <div className="space-y-4 p-4 bg-game-background/50 rounded-lg border border-game-border">
          <h3 className="text-lg font-semibold text-game-text">Добавить в вайт-лист</h3>
          <div className="grid gap-3">
            <Input
              placeholder="Адрес кошелька (например: user.near)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="bg-game-surface border-game-border text-game-text"
            />
            <Textarea
              placeholder="Заметки (необязательно)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="bg-game-surface border-game-border text-game-text min-h-[80px]"
            />
            <Button
              onClick={addToWhitelist}
              disabled={loading}
              className="w-full bg-game-primary hover:bg-game-primary/80 text-game-background"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить в вайт-лист
            </Button>
          </div>
        </div>

        {/* Whitelist entries */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-game-text">
              Активные адреса ({activeEntries.length})
            </h3>
            <Button
              onClick={loadWhitelist}
              variant="outline"
              size="sm"
              className="border-game-border text-game-text"
            >
              Обновить
            </Button>
          </div>

          {activeEntries.length === 0 ? (
            <p className="text-game-text/60 text-center py-8">
              Нет активных адресов в вайт-листе
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-game-background/30 rounded-lg border border-game-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-game-text font-medium">
                        {entry.wallet_address}
                      </span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        Активен
                      </Badge>
                      {entry.whitelist_source === 'nft_automatic' && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          NFT
                        </Badge>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-game-text/70 truncate">
                        {entry.notes}
                      </p>
                    )}
                    <p className="text-xs text-game-text/50">
                      Добавлен: {new Date(entry.added_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <Button
                    onClick={() => removeFromWhitelist(entry.wallet_address)}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                    className="ml-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};