import { TeamBattlePage } from '@/components/game/battle/TeamBattlePage';
import { dungeonBackgrounds } from '@/constants/dungeons';

export const ForgottenSoulsCave = () => {
  const bg = dungeonBackgrounds['forgotten_souls'];
  return (
    <div 
      className="h-screen relative flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url("${bg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="flex-1 overflow-y-auto relative z-10">
        <TeamBattlePage dungeonType="forgotten_souls" />
      </div>
    </div>
  );
};