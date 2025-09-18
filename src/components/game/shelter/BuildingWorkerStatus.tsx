import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { Clock, Zap, Users } from "lucide-react";

interface ActiveWorker {
  id: string;
  workerId: string;
  cardInstanceId: string;
  name: string;
  speedBoost: number;
  startTime: number;
  duration: number;
  building: string;
}

interface BuildingWorkerStatusProps {
  buildingId: string;
  activeWorkers: ActiveWorker[];
}

export const BuildingWorkerStatus = ({ buildingId, activeWorkers }: BuildingWorkerStatusProps) => {
  const { language } = useLanguage();
  // Фильтруем рабочих по зданию и исключаем тех, у кого время работы закончилось
  const buildingWorkers = activeWorkers.filter(worker => {
    if (worker.building !== buildingId) return false;
    const now = Date.now();
    const elapsed = now - worker.startTime;
    return elapsed < worker.duration; // Показываем только активных рабочих
  });
  
  if (buildingWorkers.length === 0) {
    return null;
  }

  const totalBonus = buildingWorkers.reduce((sum, worker) => sum + worker.speedBoost, 0);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = (worker: ActiveWorker) => {
    const now = Date.now();
    const elapsed = now - worker.startTime;
    return Math.min(100, (elapsed / worker.duration) * 100);
  };

  const getRemainingTime = (worker: ActiveWorker) => {
    const now = Date.now();
    const elapsed = now - worker.startTime;
    return Math.max(0, worker.duration - elapsed);
  };

  return (
    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          {t(language, 'shelter.activeWorkers')} ({buildingWorkers.length})
        </span>
        <Badge variant="secondary" className="ml-auto">
          <Zap className="w-3 h-3 mr-1" />
          +{totalBonus}%
        </Badge>
      </div>

      <div className="space-y-2">
        {buildingWorkers.map(worker => (
          <div key={worker.id} className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{worker.name}</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTime(getRemainingTime(worker))}</span>
              </div>
            </div>
            <Progress value={getProgress(worker)} className="h-1" />
          </div>
        ))}
      </div>
    </div>
  );
};