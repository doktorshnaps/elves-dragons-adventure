import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getXPProgress } from '@/utils/accountLeveling';
import { Crown, Star } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

interface AccountLevelDisplayProps {
  experience?: number;
  level?: number;
}

export const AccountLevelDisplay = ({ experience: propExperience, level: propLevel }: AccountLevelDisplayProps) => {
  const { accountLevel, accountExperience } = useGameStore();
  
  // Используем props если переданы, иначе данные из store
  const experience = propExperience ?? accountExperience;
  const level = propLevel ?? accountLevel;
  
  const xpProgress = getXPProgress(experience);
  const progressPercentage = Math.round(xpProgress.progress * 100);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Crown className="h-4 w-4 text-primary" />
          Уровень Аккаунта
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {level}
            </span>
          </div>
          {level < 100 && (
            <span className="text-sm text-muted-foreground">
              до {level + 1}
            </span>
          )}
        </div>
        
        {level < 100 ? (
          <>
            <Progress 
              value={progressPercentage} 
              className="h-2"
              indicatorClassName="bg-gradient-to-r from-primary to-primary-glow"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {xpProgress.currentLevelXP.toLocaleString()} XP
              </span>
              <span>
                {xpProgress.nextLevelXP.toLocaleString()} XP
              </span>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              {progressPercentage}% до следующего уровня
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-sm font-medium text-primary mb-1">
              Максимальный уровень!
            </div>
            <div className="text-xs text-muted-foreground">
              Общий опыт: {experience.toLocaleString()} XP
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};