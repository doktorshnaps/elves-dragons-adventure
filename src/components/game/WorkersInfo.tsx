import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Users, Clock, Zap, Coins } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { translateItemName, translateItemType, translateRarity, translateSourceType, translateStat, translateItemText } from "@/utils/itemTranslations";
import { workerImagesByName } from "@/constants/workerImages";

interface WorkerTemplate {
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

const getWorkerImage = (workerName: string): string | null => {
  return workerImagesByName[workerName] || null;
};

const WorkerCard = ({ worker }: { worker: WorkerTemplate }) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();

  const formatStats = (stats: any) => {
    if (!stats) return [];
    return Object.entries(stats).map(([key, value]) => {
      const statName = translateStat(language, key);
      return { name: statName, value: value as number };
    });
  };

  const formatWorkDuration = (duration: number) => {
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
  };

  const stats = formatStats(worker.stats);
  const workDuration = worker.stats?.workDuration || 0;

  const CardContent = () => (
    <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full">
      <div className="w-full aspect-[3/4] mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-game-surface/30 border border-game-accent/20">
        {getWorkerImage(worker.name) ? (
          <img 
            src={getWorkerImage(worker.name)!} 
            alt={worker.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`text-game-accent opacity-50 ${getWorkerImage(worker.name) ? 'hidden' : ''}`}>
          <Users className="w-8 h-8" />
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-game-accent text-[10px] sm:text-xs">
          {translateItemName(language, worker.name)}
        </h3>
        <Badge className={`text-[8px] px-1 py-0 text-white ${getRarityColor(worker.rarity)}`}>
          {translateRarity(language, worker.rarity)}
        </Badge>
      </div>
      
      <p className="text-gray-400 mb-2 text-[10px] sm:text-xs line-clamp-2">
        {worker.description}
      </p>
      
      <div className="mb-2">
        <div className="text-green-400 text-[8px] sm:text-[10px] mb-1">
          {translateItemText(language, 'Характеристики:')}
        </div>
        <div className="space-y-1 text-[10px] sm:text-xs">
          <div className="text-game-secondary flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400">+{worker.value}%</span>
            <span className="text-gray-400 text-[8px] sm:text-[10px]">{translateStat(language, 'speedBoost')}</span>
          </div>
          {workDuration > 0 && (
            <div className="text-game-secondary flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400">{formatWorkDuration(workDuration)}</span>
              <span className="text-gray-400 text-[8px] sm:text-[10px]">работы</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-auto pt-2 border-t border-game-accent/20">
        <div className="text-game-accent text-[8px] sm:text-[10px] flex items-center gap-1 mb-1">
          <Coins className="w-2 h-2" />
          {translateItemText(language, 'Детали:')}
        </div>
        <div className="text-[8px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Уровень')}</span>
            <span className="text-yellow-400">{worker.level_requirement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Стоимость')}</span>
            <span className="text-green-400">{worker.value}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const ExpandedCardContent = () => (
    <Card className="p-4 bg-game-background border-game-accent w-80 max-w-sm">
      <div className="w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden flex items-center justify-center bg-game-surface/30 border border-game-accent/20">
        {getWorkerImage(worker.name) ? (
          <img 
            src={getWorkerImage(worker.name)!} 
            alt={worker.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`text-game-accent opacity-50 text-4xl ${getWorkerImage(worker.name) ? 'hidden' : ''}`}>
          <Users className="w-16 h-16" />
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-game-accent text-lg">
          {translateItemName(language, worker.name)}
        </h3>
        <Badge className={`text-xs px-2 py-1 text-white ${getRarityColor(worker.rarity)}`}>
          {translateRarity(language, worker.rarity)}
        </Badge>
      </div>
      
      <p className="text-gray-300 mb-4 text-sm leading-relaxed">
        {worker.description}
      </p>
      
      <div className="mb-4">
        <div className="text-green-400 text-sm font-medium mb-2">
          {translateItemText(language, 'Характеристики:')}
        </div>
        <div className="space-y-2">
          <div className="text-game-secondary flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">+{worker.value}%</span>
            <span>Ускорение работы зданий</span>
          </div>
          {workDuration > 0 && (
            <div className="text-game-secondary flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium">{formatWorkDuration(workDuration)}</span>
              <span>Время работы</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-3 border-t border-game-accent/20">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Требуемый уровень')}</span>
            <span className="text-yellow-400 font-medium">{worker.level_requirement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{translateItemText(language, 'Стоимость')}</span>
            <span className="text-green-400 font-medium">{worker.value} {translateItemText(language, 'монет')}</span>
          </div>
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

export const WorkersInfo = () => {
  const [workers, setWorkers] = useState<WorkerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data, error } = await supabase
          .from('item_templates')
          .select('*')
          .eq('type', 'worker')
          .order('rarity', { ascending: false })
          .order('level_requirement', { ascending: true });

        if (error) {
          console.error('Error fetching workers:', error);
          return;
        }

        setWorkers(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-game-accent">{translateItemText(language, 'Загрузка предметов...')}</div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Нет доступных рабочих</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
        {workers.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>
    </div>
  );
};