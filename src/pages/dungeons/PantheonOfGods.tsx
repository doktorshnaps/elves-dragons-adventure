import { TeamBattlePage } from '@/components/game/battle/TeamBattlePage';

export const PantheonOfGods = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/pantheon-of-gods.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10">
        <TeamBattlePage dungeonType="pantheon_gods" />
      </div>
    </div>
  );
};
