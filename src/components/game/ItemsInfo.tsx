import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sword, Shield, Gem, Heart, Hammer, Trophy } from "lucide-react";

interface ItemTemplate {
  id: number;
  item_id: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  stats: any;
  source_type: string;
  source_details: any;
  drop_chance: number;
  slot: string;
  level_requirement: number;
  value: number;
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-500';
    case 'rare': return 'bg-blue-500';
    case 'epic': return 'bg-purple-500';
    case 'legendary': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'weapon': return <Sword className="w-4 h-4" />;
    case 'armor': return <Shield className="w-4 h-4" />;
    case 'accessory': return <Gem className="w-4 h-4" />;
    case 'consumable': return <Heart className="w-4 h-4" />;
    default: return <Gem className="w-4 h-4" />;
  }
};

const getSourceIcon = (sourceType: string) => {
  switch (sourceType) {
    case 'monster_drop': return <Sword className="w-4 h-4" />;
    case 'craft': return <Hammer className="w-4 h-4" />;
    case 'quest_reward': return <Trophy className="w-4 h-4" />;
    default: return <Gem className="w-4 h-4" />;
  }
};

const getSourceLabel = (sourceType: string) => {
  switch (sourceType) {
    case 'monster_drop': return 'Добыча с монстров';
    case 'craft': return 'Крафт';
    case 'quest_reward': return 'Награда за квест';
    default: return 'Неизвестно';
  }
};

const ItemCard = ({ item }: { item: ItemTemplate }) => {
  const formatStats = (stats: any) => {
    if (!stats) return '';
    return Object.entries(stats)
      .map(([key, value]) => {
        const statName = key === 'power' ? 'Сила' : 
                        key === 'defense' ? 'Защита' : 
                        key === 'health' ? 'Здоровье' :
                        key === 'heal' ? 'Лечение' :
                        key === 'fire_damage' ? 'Урон огнем' :
                        key === 'magic_resistance' ? 'Сопр. магии' : key;
        return `${statName}: +${value}`;
      })
      .join(', ');
  };

  const formatSourceDetails = (sourceType: string, details: any) => {
    if (!details) return '';
    
    if (sourceType === 'monster_drop') {
      const monsters = details.monster_types?.join(', ') || 'Любые монстры';
      const level = details.dungeon_level ? ` (Уровень ${details.dungeon_level}+)` : '';
      return monsters + level;
    }
    
    if (sourceType === 'craft') {
      return details.materials?.map((mat: any) => `${mat.item} x${mat.count}`).join(', ') || '';
    }
    
    if (sourceType === 'quest_reward') {
      return details.quest || '';
    }
    
    return '';
  };

  return (
    <Card className="bg-game-surface/80 border-game-accent/30 hover:border-game-accent/60 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-game-accent flex items-center gap-2">
            {getTypeIcon(item.type)}
            {item.name}
          </CardTitle>
          <Badge className={`text-xs text-white ${getRarityColor(item.rarity)}`}>
            {item.rarity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <p className="text-xs text-gray-300">{item.description}</p>
        
        {item.stats && (
          <div className="text-xs text-green-400">
            {formatStats(item.stats)}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-blue-400">
          {getSourceIcon(item.source_type)}
          <span>{getSourceLabel(item.source_type)}</span>
        </div>
        
        {formatSourceDetails(item.source_type, item.source_details) && (
          <div className="text-xs text-gray-400">
            {formatSourceDetails(item.source_type, item.source_details)}
          </div>
        )}
        
        {item.drop_chance && (
          <div className="text-xs text-yellow-400">
            Шанс выпадения: {(item.drop_chance * 100).toFixed(1)}%
          </div>
        )}
        
        <div className="flex justify-between text-xs text-gray-400">
          <span>Уровень: {item.level_requirement}</span>
          <span>Стоимость: {item.value} монет</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const ItemsInfo = () => {
  const [items, setItems] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('item_templates')
          .select('*')
          .order('rarity', { ascending: false })
          .order('level_requirement', { ascending: true });

        if (error) {
          console.error('Error fetching items:', error);
          return;
        }

        setItems(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-game-accent">Загрузка предметов...</div>
      </div>
    );
  }

  const weaponItems = items.filter(item => item.type === 'weapon');
  const armorItems = items.filter(item => item.type === 'armor');
  const accessoryItems = items.filter(item => item.type === 'accessory');
  const consumableItems = items.filter(item => item.type === 'consumable');

  return (
    <div className="h-full">
      <Tabs defaultValue="all" className="h-full">
        <TabsList className="grid w-full grid-cols-5 bg-game-surface/50 border border-game-accent/30 mb-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            Все
          </TabsTrigger>
          <TabsTrigger value="weapons" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Sword className="w-4 h-4 mr-1" />
            Оружие
          </TabsTrigger>
          <TabsTrigger value="armor" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Shield className="w-4 h-4 mr-1" />
            Броня
          </TabsTrigger>
          <TabsTrigger value="accessories" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Gem className="w-4 h-4 mr-1" />
            Аксессуары
          </TabsTrigger>
          <TabsTrigger value="consumables" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Heart className="w-4 h-4 mr-1" />
            Расходники
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weapons" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {weaponItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="armor" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {armorItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accessories" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accessoryItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consumables" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {consumableItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};