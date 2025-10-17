import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/hooks/useLanguage";

interface ActiveDungeonWarningProps {
  open: boolean;
  onContinue: () => void;
  onEndAndRestart: () => void;
  onCancel: () => void;
  activeSessions: Array<{
    device_id: string;
    dungeon_type: string;
    level: number;
    last_activity: number;
  }>;
}

export const ActiveDungeonWarning = ({
  open,
  onContinue,
  onEndAndRestart,
  onCancel,
  activeSessions
}: ActiveDungeonWarningProps) => {
  const { language } = useLanguage();

  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} сек. назад`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} мин. назад`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-black/90 border-2 border-red-500/50 backdrop-blur-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400 text-xl">
            ⚠️ Обнаружено активное подземелье
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white space-y-4">
            <div>
              У вас уже запущено подземелье на другом устройстве:
            </div>
            {activeSessions.map((session, index) => (
              <div key={index} className="bg-white/10 p-3 rounded-lg border border-white/20">
                <div className="text-sm">
                  <div className="text-purple-300 font-semibold">
                    {session.dungeon_type} - Уровень {session.level}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Последняя активность: {formatTimeSince(session.last_activity)}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-yellow-300 text-sm mt-4">
              Вы не можете проходить подземелье одновременно с нескольких устройств.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onEndAndRestart}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Завершить старое и начать новое
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
