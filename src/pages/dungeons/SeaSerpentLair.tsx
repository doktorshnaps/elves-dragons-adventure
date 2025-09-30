import { TeamBattlePage } from '@/components/game/battle/TeamBattlePage';
import { dungeonBackgrounds } from '@/constants/dungeons';

export const SeaSerpentLair = () => {
  const bg = dungeonBackgrounds['sea_serpent'];
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url("${bg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10">
        <TeamBattlePage dungeonType="sea_serpent" />
      </div>
    </div>
  );
};