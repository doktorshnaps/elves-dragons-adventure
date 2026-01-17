import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface DropRate {
  id: string;
  card_type: 'hero' | 'dragon';
  class_key: string;
  class_name: string;
  drop_chance: number;
  display_order: number;
}

export const CardClassDropRates = () => {
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();
  const [heroRates, setHeroRates] = useState<DropRate[]>([]);
  const [dragonRates, setDragonRates] = useState<DropRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDropRates();
  }, []);

  const loadDropRates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_card_class_drop_rates');

      if (error) throw error;

      const heroes = (data as DropRate[]).filter(r => r.card_type === 'hero');
      const dragons = (data as DropRate[]).filter(r => r.card_type === 'dragon');

      setHeroRates(heroes);
      setDragonRates(dragons);
    } catch (error) {
      console.error('Error loading drop rates:', error);
      toast.error('Ошибка загрузки настроек шансов выпадения');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (
    type: 'hero' | 'dragon',
    id: string,
    field: 'class_name' | 'drop_chance',
    value: string
  ) => {
    const updateRates = type === 'hero' ? setHeroRates : setDragonRates;
    
    updateRates(prev => prev.map(rate => 
      rate.id === id 
        ? { ...rate, [field]: field === 'drop_chance' ? parseFloat(value) || 0 : value }
        : rate
    ));
  };

  const handleSave = async () => {
    if (!accountId) {
      toast.error('Кошелек не подключен');
      return;
    }

    setSaving(true);
    try {
      const allRates = [...heroRates, ...dragonRates].map(rate => ({
        id: rate.id,
        class_name: rate.class_name,
        drop_chance: rate.drop_chance
      }));

      const { error } = await supabase.rpc('admin_update_card_class_drop_rates', {
        p_rates: allRates
      });

      if (error) throw error;

      // Инвалидируем кэш React Query чтобы обновить UI
      await queryClient.invalidateQueries({ queryKey: ['cardDropRates'] });
      
      toast.success('Настройки шансов выпадения успешно сохранены и обновлены в UI');
      await loadDropRates();
    } catch (error: any) {
      console.error('Error saving drop rates:', error);
      toast.error(error.message || 'Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = (rates: DropRate[]) => {
    return rates.reduce((sum, rate) => sum + rate.drop_chance, 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Настройка шансов выпадения карт</h2>
          <p className="text-white/70 mt-1">Управление вероятностями выпадения классов героев и драконов при открытии колод</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить изменения
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heroes */}
        <Card className="bg-black/50 border-white/30 p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">Герои (50%)</h3>
            <p className="text-sm text-white/60">
              Сумма вероятностей: {calculateTotal(heroRates)}%
            </p>
          </div>
          
          <div className="space-y-3">
            {heroRates.map(rate => (
              <div key={rate.id} className="flex items-center gap-3">
                <Input
                  value={rate.class_name}
                  onChange={(e) => handleRateChange('hero', rate.id, 'class_name', e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white"
                  placeholder="Название класса"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={rate.drop_chance}
                    onChange={(e) => handleRateChange('hero', rate.id, 'drop_chance', e.target.value)}
                    className="w-24 bg-white/10 border-white/20 text-white"
                  />
                  <span className="text-white/70">%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Dragons */}
        <Card className="bg-black/50 border-white/30 p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">Драконы (50%)</h3>
            <p className="text-sm text-white/60">
              Сумма вероятностей: {calculateTotal(dragonRates)}%
            </p>
          </div>
          
          <div className="space-y-3">
            {dragonRates.map(rate => (
              <div key={rate.id} className="flex items-center gap-3">
                <Input
                  value={rate.class_name}
                  onChange={(e) => handleRateChange('dragon', rate.id, 'class_name', e.target.value)}
                  className="flex-1 bg-white/10 border-white/20 text-white"
                  placeholder="Название класса"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={rate.drop_chance}
                    onChange={(e) => handleRateChange('dragon', rate.id, 'drop_chance', e.target.value)}
                    className="w-24 bg-white/10 border-white/20 text-white"
                  />
                  <span className="text-white/70">%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
        <p className="text-sm text-yellow-200">
          <strong>Важно:</strong> Сумма всех вероятностей для каждого типа (герои/драконы) должна равняться 100%. 
          Система использует эти значения для определения, какой класс карты выпадет при открытии колоды.
        </p>
      </Card>
    </div>
  );
};
