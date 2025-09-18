import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Sword, Shield, Gem, Heart, Hammer, Trophy, Coins } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const formatStats = (stats: any) => {
    if (!stats) return [];
    return Object.entries(stats).map(([key, value]) => {
      const statName = key === 'power' ? 'Сила' : 
                      key === 'defense' ? 'Защита' : 
                      key === 'health' ? 'Здоровье' :
                      key === 'heal' ? 'Лечение' :
                      key === 'fire_damage' ? 'Урон огнем' :
                      key === 'magic_resistance' ? 'Сопр. магии' : key;
      return { name: statName, value: value as number };
    });
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

  const stats = formatStats(item.stats);

  const CardContent = () => (
    <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full">
      {/* Placeholder image area - можно добавить изображения предметов позже */}
      <div className="w-full aspect-[3/4] mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-game-surface/30 border border-game-accent/20">
        <div className="text-game-accent opacity-50">
          {getTypeIcon(item.type)}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-game-accent text-[10px] sm:text-xs">
          {item.name}
        </h3>
        <Badge className={`text-[8px] px-1 py-0 text-white ${getRarityColor(item.rarity)}`}>
          {item.rarity}
        </Badge>
      </div>
      
      <p className="text-gray-400 mb-2 text-[10px] sm:text-xs line-clamp-2">
        {item.description}
      </p>
      
      {stats.length > 0 && (
        <div className="mb-2">
          <div className="text-green-400 text-[8px] sm:text-[10px] mb-1">
            Характеристики:
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
            {stats.slice(0, 4).map((stat, index) => (
              <div key={index} className="text-game-secondary flex items-center gap-1">
                <span className="text-green-400">+{stat.value}</span>
                <span className="text-gray-400 text-[8px] sm:text-[10px]">{stat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-[8px] sm:text-[10px] text-blue-400 mb-1">
        {getSourceIcon(item.source_type)}
        <span>{getSourceLabel(item.source_type)}</span>
      </div>
      
      <div className="mt-auto pt-2 border-t border-game-accent/20">
        <div className="text-game-accent text-[8px] sm:text-[10px] flex items-center gap-1 mb-1">
          <Coins className="w-2 h-2" />
          Детали:
        </div>
        <div className="text-[8px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-400">Уровень</span>
            <span className="text-yellow-400">{item.level_requirement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Стоимость</span>
            <span className="text-green-400">{item.value}</span>
          </div>
          {item.drop_chance && (
            <div className="flex justify-between">
              <span className="text-gray-400">Шанс</span>
              <span className="text-orange-400">{(item.drop_chance * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const ExpandedCardContent = () => (
    <Card className="p-4 bg-game-background border-game-accent w-80 max-w-sm">
      <div className="w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden flex items-center justify-center bg-game-surface/30 border border-game-accent/20">
        <div className="text-game-accent opacity-50 text-4xl">
          {getTypeIcon(item.type)}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-game-accent text-lg">
          {item.name}
        </h3>
        <Badge className={`text-xs px-2 py-1 text-white ${getRarityColor(item.rarity)}`}>
          {item.rarity}
        </Badge>
      </div>
      
      <p className="text-gray-300 mb-4 text-sm leading-relaxed">
        {item.description}
      </p>
      
      {stats.length > 0 && (
        <div className="mb-4">
          <div className="text-green-400 text-sm font-medium mb-2">
            Характеристики:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat, index) => (
              <div key={index} className="text-game-secondary flex items-center gap-2">
                <span className="text-green-400 font-medium">+{stat.value}</span>
                <span>{stat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="pt-3 border-t border-game-accent/20">
        <div className="text-game-accent text-sm flex items-center gap-2 mb-3">
          {getSourceIcon(item.source_type)}
          <span className="font-medium">{getSourceLabel(item.source_type)}</span>
        </div>
        
        {formatSourceDetails(item.source_type, item.source_details) && (
          <div className="text-sm text-gray-400 mb-3">
            {formatSourceDetails(item.source_type, item.source_details)}
          </div>
        )}
        
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Требуемый уровень</span>
            <span className="text-yellow-400 font-medium">{item.level_requirement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Стоимость</span>
            <span className="text-green-400 font-medium">{item.value} монет</span>
          </div>
          {item.drop_chance && (
            <div className="flex justify-between">
              <span className="text-gray-400">Шанс выпадения</span>
              <span className="text-orange-400 font-medium">{(item.drop_chance * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (isMobile) {
    return <CardContent />;
  }

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div>
          <CardContent />
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start"
        className="p-0 border-0 bg-transparent shadow-none z-50"
        sideOffset={10}
      >
        <ExpandedCardContent />
      </HoverCardContent>
    </HoverCard>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weapons" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
            {weaponItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="armor" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
            {armorItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accessories" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
            {accessoryItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consumables" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
            {consumableItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};