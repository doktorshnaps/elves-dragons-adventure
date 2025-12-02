import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Trophy, Sword, Package, Heart } from 'lucide-react';
import { DungeonReward } from '@/hooks/adventure/useDungeonRewards';
import { TeamPair } from '@/types/teamBattle';
import { Progress } from '@/components/ui/progress';

interface DungeonRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  reward: DungeonReward;
  canContinue?: boolean;
  currentLevel?: number;
  teamPairs?: TeamPair[];
}
export const DungeonRewardModal: React.FC<DungeonRewardModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  reward,
  canContinue = false,
  currentLevel = 1,
  teamPairs = []
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Логирование получаемой награды
  React.useEffect(() => {
    if (isOpen && reward) {
      console.log('🎁 ============ МОДАЛЬНОЕ ОКНО НАГРАДЫ ОТКРЫТО ============');
      console.log('💰 Reward данные:', JSON.stringify(reward, null, 2));
      console.log('📊 Breakdown:', reward.breakdown);
      console.log('🎯 Total ELL:', reward.totalELL);
      console.log('💀 Monsters killed:', reward.monstersKilled);
      console.log('📦 Looted items count:', reward.lootedItems?.length || 0);
      console.log('🎁 =======================================================\n');
    }
  }, [isOpen, reward]);
  const handleClaim = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onClose();
  };
  const handleContinue = () => {
    if (isSubmitting || !onContinue) return;
    onContinue();
  };
  return <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto bg-card/95 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Пройден уровень {currentLevel}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Общая награда */}
          <Card className="border-primary/20 bg-background/50">
            <CardContent className="p-4 text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                Убито монстров: <span className="font-bold text-foreground">{reward.monstersKilled}</span>
              </div>
              {reward.isFullCompletion && <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                  Полное завершение подземелья!
                </Badge>}
            </CardContent>
          </Card>

          {/* Детализация по уровням */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sword className="w-4 h-4" />
              Убито монстров:
            </h3>
            
            <ScrollArea className="max-h-[120px]">
              <div className="space-y-2 pr-3">
                {reward.breakdown.level1to3.count > 0 && <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                    <span className="text-sm">
                      Уровни 1-3: {reward.breakdown.level1to3.count} монстров
                    </span>
                    <Badge variant="outline">
                      {reward.breakdown.level1to3.reward} ELL
                    </Badge>
                  </div>}
                
                {reward.breakdown.level4to7.count > 0 && <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                    <span className="text-sm">
                      Уровни 4-7: {reward.breakdown.level4to7.count} монстров
                    </span>
                    <Badge variant="outline">
                      {reward.breakdown.level4to7.reward} ELL
                    </Badge>
                  </div>}
                
                {reward.breakdown.level8to10.count > 0 && <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                    <span className="text-sm">
                      Уровни 8-10: {reward.breakdown.level8to10.count} монстров
                    </span>
                    <Badge variant="outline">
                      {reward.breakdown.level8to10.reward} ELL
                    </Badge>
                  </div>}

                {reward.completionBonus > 0 && <div className="flex justify-between items-center p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <span className="text-sm text-yellow-300">
                      Бонус за завершение
                    </span>
                    <Badge className="bg-yellow-500/20 text-yellow-300">
                      {reward.completionBonus} ELL
                    </Badge>
                  </div>}
              </div>
            </ScrollArea>
          </div>

          {/* Полученные предметы */}
          {reward.lootedItems && reward.lootedItems.length > 0 && (() => {
            // Группируем одинаковые предметы
            const groupedItems = reward.lootedItems.reduce((acc, item) => {
              const key = item.name;
              if (!acc[key]) {
                acc[key] = { ...item, count: 1 };
              } else {
                acc[key].count += 1;
              }
              return acc;
            }, {} as Record<string, any>);
            
            return <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Полученные предметы:
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {Object.values(groupedItems).map((item: any) => <div key={item.id} className="flex items-center gap-2 p-2 bg-background/50 rounded border">
                    {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium break-words">
                        {item.name}
                        {item.count > 1 && <span className="ml-1 text-primary font-bold">x{item.count}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.value} ELL
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>;
          })()}

          {/* Состояние команды */}
          {teamPairs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Состояние команды:
              </h3>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {teamPairs.map((pair, index) => {
                  // КРИТИЧНО: pair.health - это СУММА текущего здоровья героя+дракона
                  // pair.maxHealth - это СУММА максимального здоровья героя+дракона
                  // Нужно показывать индивидуальное здоровье каждой карты
                  
                  const heroHealth = pair.hero?.currentHealth || 0;
                  const heroMaxHealth = pair.hero?.health || 1;
                  const heroHealthPercent = heroMaxHealth > 0 ? (heroHealth / heroMaxHealth) * 100 : 0;
                  
                  const dragonHealth = pair.dragon?.currentHealth || 0;
                  const dragonMaxHealth = pair.dragon?.health || 1;
                  const dragonHealthPercent = dragonMaxHealth > 0 && pair.dragon ? (dragonHealth / dragonMaxHealth) * 100 : 0;
                  
                  const isDead = heroHealth <= 0;
                  
                  console.log(`🩺 [Reward Modal] Pair ${index}:`, {
                    heroName: pair.hero?.name,
                    heroHealth,
                    heroMaxHealth,
                    dragonName: pair.dragon?.name,
                    dragonHealth,
                    dragonMaxHealth,
                    pairHealth: pair.health,
                    pairMaxHealth: pair.maxHealth
                  });
                  
                  return (
                    <div 
                      key={pair.id || index}
                      className={`p-3 rounded border ${
                        isDead 
                          ? 'bg-red-950/20 border-red-500/30' 
                          : 'bg-background/50 border-border/50'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Герой */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium ${isDead ? 'text-red-400' : 'text-foreground'}`}>
                                {pair.hero?.name || `Пара ${index + 1}`}
                                {isDead && <span className="ml-2 text-red-500 font-bold">✝</span>}
                              </span>
                              <span className={`text-xs ${
                                heroHealthPercent <= 20 ? 'text-red-400' : 
                                heroHealthPercent <= 50 ? 'text-yellow-400' : 
                                'text-green-400'
                              }`}>
                                {Math.floor(heroHealth)}/{heroMaxHealth}
                              </span>
                            </div>
                            <Progress 
                              value={heroHealthPercent} 
                              className="h-1.5"
                            />
                          </div>
                        </div>
                        
                        {/* Дракон */}
                        {pair.dragon && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-foreground/80">
                                  {pair.dragon.name}
                                </span>
                                <span className={`text-xs ${
                                  dragonHealthPercent <= 20 ? 'text-red-400' : 
                                  dragonHealthPercent <= 50 ? 'text-yellow-400' : 
                                  'text-green-400'
                                }`}>
                                  {Math.floor(dragonHealth)}/{dragonMaxHealth}
                                </span>
                              </div>
                              <Progress 
                                value={dragonHealthPercent} 
                                className="h-1.5"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {canContinue ? <div className="space-y-3">
              <div className="p-3 border border-blue-500/30 text-sm text-blue-200 bg-blue-900/30 rounded-sm">
                ℹ️ Все награды будут начислены после нажатия кнопки "Забрать и выйти"
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleClaim} variant="default" size="lg" disabled={isSubmitting} className="w-full">
                  Забрать и выйти
                </Button>
                
                <Button onClick={handleContinue} variant="outline" size="lg" disabled={isSubmitting} className="w-full border-primary/50 hover:bg-primary/20">
                  Рискнуть дальше
                </Button>
              </div>
            </div> : <Button onClick={handleClaim} className="w-full" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Начисление...' : 'Забрать награду'}
            </Button>}
        </div>
      </DialogContent>
    </Dialog>;
};