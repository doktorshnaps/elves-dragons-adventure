import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ban, Unlock, UserX, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBannedUsersData } from '@/hooks/useBannedUsersData';
import { useQueryClient } from '@tanstack/react-query';

interface BannedUser {
  id: string;
  banned_wallet_address: string;
  banned_by_wallet_address: string;
  reason: string | null;
  banned_at: string;
  is_active: boolean;
}

export const BannedUsersManager = () => {
  const [newAddress, setNewAddress] = useState('');
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: bannedUsers = [], isLoading: usersLoading, refetch } = useBannedUsersData();

  const banUser = async () => {
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
      const { error } = await supabase.rpc('admin_ban_user', {
        p_target_wallet_address: newAddress.trim(),
        p_reason: banReason.trim() || 'Нарушение правил',
      });

      if (error) throw error;

      toast({
        title: 'Успех',
        description: 'Пользователь заблокирован',
      });

      setNewAddress('');
      setBanReason('');
      queryClient.invalidateQueries({ queryKey: ['bannedUsers'] });
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось заблокировать пользователя',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const unbanUser = async (walletAddress: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_unban_user', {
        p_target_wallet_address: walletAddress,
      });

      if (error) throw error;

      toast({
        title: 'Успех',
        description: 'Пользователь разблокирован',
      });

      queryClient.invalidateQueries({ queryKey: ['bannedUsers'] });
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось разблокировать пользователя',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeBans = bannedUsers.filter(user => user.is_active);

  return (
    <Card className="bg-game-surface border-game-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-400">
          <UserX className="w-5 h-5" />
          Управление заблокированными пользователями
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ban new user */}
        <div className="space-y-4 p-4 bg-game-background/50 rounded-lg border border-game-border">
          <h3 className="text-lg font-semibold text-game-text">Заблокировать пользователя</h3>
          <div className="grid gap-3">
            <Input
              placeholder="Адрес кошелька (например: user.near)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="bg-game-surface border-game-border text-game-text"
            />
            <Textarea
              placeholder="Причина блокировки"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="bg-game-surface border-game-border text-game-text min-h-[80px]"
            />
            <Button
              onClick={banUser}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Ban className="w-4 h-4 mr-2" />
              Заблокировать пользователя
            </Button>
          </div>
        </div>

        {/* Banned users list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-game-text">
              Заблокированные пользователи ({activeBans.length})
            </h3>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-game-border text-game-text"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
          </div>

          {activeBans.length === 0 ? (
            <p className="text-game-text/60 text-center py-8">
              Нет заблокированных пользователей
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activeBans.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-game-background/30 rounded-lg border border-red-500/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-game-text font-medium">
                        {user.banned_wallet_address}
                      </span>
                      <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                        Заблокирован
                      </Badge>
                    </div>
                    {user.reason && (
                      <p className="text-sm text-game-text/70 truncate">
                        Причина: {user.reason}
                      </p>
                    )}
                    <p className="text-xs text-game-text/50">
                      Заблокирован: {new Date(user.banned_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <Button
                    onClick={() => unbanUser(user.banned_wallet_address)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="ml-3 border-green-500/50 text-green-400 hover:bg-green-500/20"
                  >
                    <Unlock className="w-4 h-4" />
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