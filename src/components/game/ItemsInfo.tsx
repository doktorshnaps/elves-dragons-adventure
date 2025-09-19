import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Sword, Shield, Gem, Heart, Hammer, Trophy, Coins } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { translateItemName, translateItemType, translateRarity, translateSourceType, translateStat, translateItemText } from "@/utils/itemTranslations";

// Import item images
import spiderSilk from "@/assets/items/spider_silk.png";
import spiderPoison from "@/assets/items/spider_poison.jpg";
import spiderFang from "@/assets/items/spider_fang.png";
import spiderEye from "@/assets/items/spider_eye.png";
import chelicerae from "@/assets/items/chelicerae.png";
import chitinFragment from "@/assets/items/chitin_fragment.png";
import spiderLimbs from "@/assets/items/spider_limbs.png";
import spiderTendons from "@/assets/items/spider_tendons.png";
import poisonGland from "@/assets/items/poison_gland.png";
import spiderEggs from "@/assets/items/spider_eggs.png";
import skeletonSpiderBone from "@/assets/items/skeleton_spider_bone.png";
import illusionPollen from "@/assets/items/illusion_pollen.png";
import wyvernWing from "@/assets/items/wyvern_wing.png";
import hunterClaw from "@/assets/items/hunter_claw.png";
import silkCore from "@/assets/items/silk_core.png";
import enhancedGuardianChitin from "@/assets/items/enhanced_guardian_chitin.png";
import queenLarvaStinger from "@/assets/items/queen_larva_stinger.png";
import concentratedPoisonGland from "@/assets/items/concentrated_poison_gland.png";
import ancientHermitEye from "@/assets/items/ancient_hermit_eye.png";
import shadowWebGland from "@/assets/items/shadow_web_gland.png";
import berserkerFang from "@/assets/items/berserker-fang.png";
import wyvernHeart from "@/assets/items/wyvern-heart.png";
import titanShell from "@/assets/items/titan-shell.png";
import carrionClaw from "@/assets/items/carrion-claw.png";
import parasiteGland from "@/assets/items/parasite-gland.png";
import guardianEgg from "@/assets/items/guardian-egg.png";
import webSymbol from "@/assets/items/web-symbol.png";
import archmageStaff from "@/assets/items/archmage-staff.png";
import livingShadowMantle from "@/assets/items/living-shadow-mantle.png";
import arachnidGrimoire from "@/assets/items/arachnid-grimoire.png";

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
  const imageMap: Record<string, string> = {
    spider_silk: spiderSilk,
    spider_poison_small: spiderPoison,
    spider_fang: spiderFang,
    spider_eye: spiderEye,
    chelicerae: chelicerae,
    chitin_fragment: chitinFragment,
    spider_limbs: spiderLimbs,
    spider_tendons: spiderTendons,
    poison_gland: poisonGland,
    spider_eggs: spiderEggs,
    skeleton_spider_bone: skeletonSpiderBone,
    illusion_pollen: illusionPollen,
    wyvern_wing: wyvernWing,
    hunter_claw: hunterClaw,
    silk_core: silkCore,
    enhanced_guardian_chitin: enhancedGuardianChitin,
    queen_larva_stinger: queenLarvaStinger,
    concentrated_poison_gland: concentratedPoisonGland,
    ancient_hermit_eye: ancientHermitEye,
    shadow_web_gland: shadowWebGland,
    berserker_fang: berserkerFang,
    wyvern_heart: wyvernHeart,
    titan_shell: titanShell,
    carrion_claw: carrionClaw,
    parasite_gland: parasiteGland,
    guardian_egg: guardianEgg,
    web_symbol: webSymbol,
    archmage_staff: archmageStaff,
    living_shadow_mantle: livingShadowMantle,
    arachnid_grimoire: arachnidGrimoire,
  };
  
  return imageMap[itemId] || null;
};

const ItemCard = ({ item }: { item: ItemTemplate }) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();

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

  const CardContent = () => (
    <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full">
      <div className="w-full aspect-[3/4] mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-game-surface/30 border border-game-accent/20">
        {getItemImage(item.item_id) ? (
          <img 
            src={getItemImage(item.item_id)!} 
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`text-game-accent opacity-50 ${getItemImage(item.item_id) ? 'hidden' : ''}`}>
          {getTypeIcon(item.type)}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-game-accent text-[10px] sm:text-xs">
          {translateItemName(language, item.name)}
        </h3>
        <Badge className={`text-[8px] px-1 py-0 text-white ${getRarityColor(item.rarity)}`}>
          {translateRarity(language, item.rarity)}
        </Badge>
      </div>
      
      <p className="text-gray-400 mb-2 text-[10px] sm:text-xs line-clamp-2">
        {item.description}
      </p>
      
      {stats.length > 0 && (
        <div className="mb-2">
          <div className="text-green-400 text-[8px] sm:text-[10px] mb-1">
            {translateItemText(language, 'Характеристики:')}
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
        <span>{getSourceLabel(item.source_type, language)}</span>
      </div>
      
      <div className="mt-auto pt-2 border-t border-game-accent/20">
        <div className="text-game-accent text-[8px] sm:text-[10px] flex items-center gap-1 mb-1">
          <Coins className="w-2 h-2" />
          {translateItemText(language, 'Детали:')}
        </div>
        <div className="text-[8px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Уровень')}</span>
            <span className="text-yellow-400">{item.level_requirement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Стоимость')}</span>
            <span className="text-green-400">{item.value}</span>
          </div>
          {item.drop_chance && (
            <div className="flex justify-between">
              <span className="text-gray-400">{translateItemText(language, 'Шанс')}</span>
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
        {getItemImage(item.item_id) ? (
          <img 
            src={getItemImage(item.item_id)!} 
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`text-game-accent opacity-50 text-4xl ${getItemImage(item.item_id) ? 'hidden' : ''}`}>
          {getTypeIcon(item.type)}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-game-accent text-lg">
          {translateItemName(language, item.name)}
        </h3>
        <Badge className={`text-xs px-2 py-1 text-white ${getRarityColor(item.rarity)}`}>
          {translateRarity(language, item.rarity)}
        </Badge>
      </div>
      
      <p className="text-gray-300 mb-4 text-sm leading-relaxed">
        {item.description}
      </p>
      
      {stats.length > 0 && (
        <div className="mb-4">
          <div className="text-green-400 text-sm font-medium mb-2">
            {translateItemText(language, 'Характеристики:')}
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
          <span className="font-medium">{getSourceLabel(item.source_type, language)}</span>
        </div>
        
        {formatSourceDetails(item.source_type, item.source_details) && (
          <div className="text-sm text-gray-400 mb-3">
            {formatSourceDetails(item.source_type, item.source_details)}
          </div>
        )}
        
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Требуемый уровень')}</span>
            <span className="text-yellow-400 font-medium">{item.level_requirement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Стоимость')}</span>
            <span className="text-green-400 font-medium">{item.value} {translateItemText(language, 'монет')}</span>
          </div>
          {item.drop_chance && (
            <div className="flex justify-between">
              <span className="text-gray-400">{translateItemText(language, 'Шанс выпадения')}</span>
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

  return (
    <div className="h-full">
      <Tabs defaultValue="all" className="h-full">
        <TabsList className="grid w-full grid-cols-5 bg-game-surface/50 border border-game-accent/30 mb-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            {translateItemText(language, 'Все')}
          </TabsTrigger>
          <TabsTrigger value="weapons" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Sword className="w-4 h-4 mr-1" />
            {translateItemType(language, 'weapon')}
          </TabsTrigger>
          <TabsTrigger value="armor" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Shield className="w-4 h-4 mr-1" />
            {translateItemType(language, 'armor')}
          </TabsTrigger>
          <TabsTrigger value="accessories" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Gem className="w-4 h-4 mr-1" />
            {translateItemType(language, 'accessory')}
          </TabsTrigger>
          <TabsTrigger value="consumables" className="data-[state=active]:bg-game-accent data-[state=active]:text-black">
            <Heart className="w-4 h-4 mr-1" />
            {translateItemType(language, 'consumable')}
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