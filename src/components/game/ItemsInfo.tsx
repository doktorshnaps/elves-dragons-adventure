import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Sword, Shield, Gem, Heart, Hammer, Trophy, Coins, Diamond, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { translateItemName, translateItemType, translateRarity, translateSourceType, translateStat, translateItemText } from "@/utils/itemTranslations";

// Temporarily using placeholders until webp files are uploaded
const spiderSilk = "/placeholder.svg";
const spiderPoison = "/placeholder.svg";
const spiderFang = "/placeholder.svg";
const spiderEye = "/placeholder.svg";
const chelicerae = "/placeholder.svg";
const chitinFragment = "/placeholder.svg";
const spiderLimbs = "/placeholder.svg";
const spiderTendons = "/placeholder.svg";
const poisonGland = "/placeholder.svg";
const spiderEggs = "/placeholder.svg";
const skeletonSpiderBone = "/placeholder.svg";
const illusionPollen = "/placeholder.svg";
const wyvernWing = "/placeholder.svg";
const hunterClaw = "/placeholder.svg";
const silkCore = "/placeholder.svg";
const enhancedGuardianChitin = "/placeholder.svg";
const queenLarvaStinger = "/placeholder.svg";
const concentratedPoisonGland = "/placeholder.svg";
const ancientHermitEye = "/placeholder.svg";
const shadowWebGland = "/placeholder.svg";
const berserkerFang = "/placeholder.svg";
const wyvernHeart = "/placeholder.svg";
const titanShell = "/placeholder.svg";
const carrionClaw = "/placeholder.svg";
const parasiteGland = "/placeholder.svg";
const guardianEgg = "/placeholder.svg";
const webSymbol = "/placeholder.svg";
const archmageStaff = "/placeholder.svg";
const livingShadowMantle = "/placeholder.svg";
const arachnidGrimoire = "/placeholder.svg";

import { itemImagesByItemId } from "@/constants/itemImages";

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
  sell_price?: number;
  dungeon_drop_settings?: any;
  image_url?: string;
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
    case 'material': return <Gem className="w-4 h-4" />;
    case 'worker': return <Hammer className="w-4 h-4" />;
    case 'cardPack': return <Sparkles className="w-4 h-4" />;
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

const getSourceLabel = (sourceType: string, language: 'ru' | 'en') => {
  return translateSourceType(language, sourceType);
};

// Map item IDs to imported images
const getItemImage = (itemId: string): string | null => {
  return itemImagesByItemId[itemId] || null;
};

// Resolve image for item template with fallbacks
const resolveItemImage = (item: ItemTemplate): string | null => {
  // 1) For workers and materials - prioritize image_url from database
  if ((item.type === 'worker' || item.type === 'material') && item.image_url) {
    if (!item.image_url.startsWith('/src/')) {
      return item.image_url;
    }
  }

  // 2) Try imported static map
  const mapped = getItemImage(item.item_id);
  if (mapped) return mapped;

  // 3) Use image_url from DB if it's a web path (not /src/)
  if (item.image_url) {
    if (item.image_url.startsWith('/src/')) {
      // Invalid in browser bundle; fallback to known mappings
      return null;
    }
    return item.image_url;
  }

  return null;
};

const ItemCard = ({ item }: { item: ItemTemplate }) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const formatStats = (stats: any) => {
    if (!stats) return [];
    return Object.entries(stats).map(([key, value]) => {
      const statName = translateStat(language, key);
      return { name: statName, value: value as number };
    });
  };

  const formatSourceDetails = (sourceType: string, details: any) => {
    if (!details) return '';
    
    if (sourceType === 'monster_drop') {
      const monsters = details.monster_types?.join(', ') || translateItemText(language, 'Любые монстры');
      const level = details.dungeon_level ? ` (${translateItemText(language, 'Уровень')} ${details.dungeon_level}+)` : '';
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

  // Функция для извлечения максимального шанса дропа из dungeon_drop_settings
  const getActualDropChance = (): number | null => {
    if (!item.dungeon_drop_settings || !Array.isArray(item.dungeon_drop_settings)) {
      return null;
    }
    
    const chances = item.dungeon_drop_settings
      .filter((setting: any) => setting && typeof setting.drop_chance === 'number')
      .map((setting: any) => setting.drop_chance);
    
    if (chances.length === 0) return null;
    
    // Возвращаем максимальный шанс дропа
    return Math.max(...chances);
  };

  const actualDropChance = getActualDropChance();

  const CardContent = () => (
    <Card variant="menu" className="p-2 h-full flex flex-col">
      <div className="w-full aspect-[3/4] mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 border border-white/20">
        {(() => {
          const src = resolveItemImage(item);
          return src ? (
            <img 
              src={src}
              alt={translateItemName(language, item.name)}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          ) : null;
        })()}
        <div className={`text-white opacity-50 ${resolveItemImage(item) ? 'hidden' : ''}`}>
          {getTypeIcon(item.type)}
        </div>
      </div>
      
      <div className="flex items-start justify-between gap-1 min-h-[2rem]">
        <h3 className="font-semibold text-white text-[10px] sm:text-xs leading-tight">
          {translateItemName(language, item.name)}
        </h3>
        <Badge className={`text-[8px] px-1 py-0 text-white flex-shrink-0 ${getRarityColor(item.rarity)}`}>
          {translateRarity(language, item.rarity)}
        </Badge>
      </div>
    </Card>
  );

  const ExpandedCardContent = () => (
    <Card variant="menu" className="p-4 w-80 max-w-sm">
      <div className="w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 border border-white/20">
        {(() => {
          const src = resolveItemImage(item);
          return src ? (
            <img 
              src={src}
              alt={translateItemName(language, item.name)}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
            />
          ) : null;
        })()}
        <div className={`text-white opacity-50 text-4xl ${resolveItemImage(item) ? 'hidden' : ''}`}>
          {getTypeIcon(item.type)}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white text-lg">
          {translateItemName(language, item.name)}
        </h3>
        <Badge className={`text-xs px-2 py-1 text-white ${getRarityColor(item.rarity)}`}>
          {translateRarity(language, item.rarity)}
        </Badge>
      </div>
      
      <p className="text-white/80 mb-4 text-sm leading-relaxed">
        {item.description}
      </p>
      
      <div className="pt-3 border-t border-white/20">
        <div className="text-white text-sm flex items-center gap-2 mb-3">
          {getSourceIcon(item.source_type)}
          <span className="font-medium">{getSourceLabel(item.source_type, language)}</span>
        </div>
        
        {formatSourceDetails(item.source_type, item.source_details) && (
          <div className="text-sm text-white/70 mb-3">
            {formatSourceDetails(item.source_type, item.source_details)}
          </div>
        )}
        
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-white/60">{translateItemText(language, 'Требуемый уровень')}</span>
            <span className="text-yellow-400 font-medium">{item.level_requirement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">{translateItemText(language, 'Цена продажи')}</span>
            <span className="text-green-400 font-medium">{item.sell_price || 0} ELL</span>
          </div>
          {actualDropChance !== null && (
            <div className="flex justify-between">
              <span className="text-white/60">{translateItemText(language, 'Шанс выпадения')}</span>
              <span className="text-orange-400 font-medium">{actualDropChance.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            <CardContent />
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm">
          <ExpandedCardContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <CardContent />
        </div>
      </DialogTrigger>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-sm">
        <ExpandedCardContent />
      </DialogContent>
    </Dialog>
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
          .select('*, sell_price, dungeon_drop_settings')
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

  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-game-accent">{translateItemText(language, 'Загрузка предметов...')}</div>
      </div>
    );
  }

  const weaponItems = items.filter(item => item.type === 'weapon');
  const armorItems = items.filter(item => item.type === 'armor');
  const accessoryItems = items.filter(item => item.type === 'accessory');
  const consumableItems = items.filter(item => item.type === 'consumable');
  const magicalItems = items.filter(item => 
    ['material', 'scroll', 'tool', 'gem'].includes(item.type)
  );

  return (
    <div className="h-full">
      <Tabs defaultValue="all" className="h-full">
        <TabsList className="grid w-full grid-cols-6 bg-black/40 border-2 border-white/50 backdrop-blur-sm rounded-3xl mb-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-3xl text-xs">
            {translateItemText(language, 'Все')}
          </TabsTrigger>
          <TabsTrigger value="weapons" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-3xl text-xs">
            <Sword className="w-3 h-3 mr-1" />
            {translateItemType(language, 'weapon')}
          </TabsTrigger>
          <TabsTrigger value="armor" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-3xl text-xs">
            <Shield className="w-3 h-3 mr-1" />
            {translateItemType(language, 'armor')}
          </TabsTrigger>
          <TabsTrigger value="accessories" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-3xl text-xs">
            <Gem className="w-3 h-3 mr-1" />
            {translateItemType(language, 'accessory')}
          </TabsTrigger>
          <TabsTrigger value="consumables" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-3xl text-xs">
            <Heart className="w-3 h-3 mr-1" />
            {translateItemType(language, 'consumable')}
          </TabsTrigger>
          <TabsTrigger value="magical" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-3xl text-xs">
            <Diamond className="w-3 h-3 mr-1" />
            {translateItemText(language, 'Магические')}
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

         <TabsContent value="magical" className="mt-0 h-[calc(100%-60px)] overflow-y-auto">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
             {magicalItems.map((item) => (
               <ItemCard key={item.id} item={item} />
             ))}
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 };