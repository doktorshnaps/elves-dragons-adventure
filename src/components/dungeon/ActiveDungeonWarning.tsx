import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

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
    if (seconds < 60) return `${seconds} ${t(language, 'activeDungeonWarning.secondsAgo')}`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${t(language, 'activeDungeonWarning.minutesAgo')}`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-black/90 border-2 border-red-500/50 backdrop-blur-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-400 text-xl">
            {t(language, 'activeDungeonWarning.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white space-y-4">
            <div>
              {t(language, 'activeDungeonWarning.message')}
            </div>
            {activeSessions.map((session, index) => (
              <div key={index} className="bg-white/10 p-3 rounded-lg border border-white/20">
                <div className="text-sm">
                  <div className="text-purple-300 font-semibold">
                    {session.dungeon_type} - {t(language, 'activeDungeonWarning.level')} {session.level}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {t(language, 'activeDungeonWarning.lastActivity')} {formatTimeSince(session.last_activity)}
                  </div>
                </div>
              </div>
            ))}
            <div className="text-yellow-300 text-sm mt-4">
              {t(language, 'activeDungeonWarning.warning')}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            {t(language, 'activeDungeonWarning.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onEndAndRestart}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {t(language, 'activeDungeonWarning.endAndRestart')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
