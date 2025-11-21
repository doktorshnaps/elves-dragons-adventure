import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DropRate {
  name: string;
  chance: string;
}

interface DropRates {
  heroes: Record<string, DropRate>;
  dragons: Record<string, DropRate>;
}

const defaultDropRates: DropRates = {
  heroes: {
    recruit: { name: 'Рекрут', chance: '16.61%' },
    guard: { name: 'Страж', chance: '15.23%' },
    veteran: { name: 'Ветеран', chance: '13.86%' },
    wizard: { name: 'Маг', chance: '12.48%' },
    healer: { name: 'Мастер Целитель', chance: '11.12%' },
    defender: { name: 'Защитник', chance: '9.74%' },
    veteran_defender: { name: 'Ветеран Защитник', chance: '8.36%' },
    strategist: { name: 'Стратег', chance: '6.99%' },
    supreme_strategist: { name: 'Верховный Стратег', chance: '5.61%' }
  },
  dragons: {
    ordinary: { name: 'Обычный', chance: '16.61%' },
    unusual: { name: 'Необычный', chance: '15.23%' },
    rare: { name: 'Редкий', chance: '13.86%' },
    epic: { name: 'Эпический', chance: '12.48%' },
    legendary: { name: 'Легендарный', chance: '11.12%' },
    mythical: { name: 'Мифический', chance: '9.74%' },
    eternal: { name: 'Этернал', chance: '8.36%' },
    imperial: { name: 'Империал', chance: '6.99%' },
    titan: { name: 'Титан', chance: '5.61%' }
  }
};

export const useCardDropRates = () => {
  return useQuery({
    queryKey: ['cardDropRates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_card_class_drop_rates');
      
      if (error || !data) {
        console.error('Failed to load drop rates from DB, using defaults:', error);
        return defaultDropRates;
      }
      
      const heroes: Record<string, DropRate> = {};
      const dragons: Record<string, DropRate> = {};
      
      data.forEach((rate: any) => {
        const entry = { name: rate.class_name, chance: `${rate.drop_chance}%` };
        if (rate.card_type === 'hero') {
          heroes[rate.class_key] = entry;
        } else if (rate.card_type === 'dragon') {
          dragons[rate.class_key] = entry;
        }
      });
      
      return { heroes, dragons };
    },
    staleTime: 0, // Всегда получать свежие данные
    gcTime: 10 * 60 * 1000, // 10 минут
    placeholderData: defaultDropRates // Использовать как placeholder, а не initialData
  });
};
