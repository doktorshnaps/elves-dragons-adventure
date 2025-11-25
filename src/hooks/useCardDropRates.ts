import { useMemo } from 'react';
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';

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
    wizard: { name: 'Чародей', chance: '12.48%' },
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
  const { data: staticData, isLoading, error } = useStaticGameDataContext();

  const data = useMemo(() => {
    if (!staticData?.card_drop_rates) {
      return defaultDropRates;
    }

    const heroes: Record<string, DropRate> = {};
    const dragons: Record<string, DropRate> = {};

    staticData.card_drop_rates.forEach((rate: any) => {
      const entry = { name: rate.class_name, chance: `${rate.drop_chance}%` };
      if (rate.card_type === 'hero') {
        heroes[rate.class_key] = entry;
      } else if (rate.card_type === 'dragon') {
        dragons[rate.class_key] = entry;
      }
    });

    return { heroes, dragons };
  }, [staticData?.card_drop_rates]);

  return { data, isLoading, error };
};
