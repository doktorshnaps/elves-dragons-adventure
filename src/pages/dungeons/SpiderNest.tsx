import { TeamBattlePage } from '@/components/game/battle/TeamBattlePage';
import { useSearchParams } from 'react-router-dom';

export const SpiderNest = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/76e1f373-c075-4b97-9cde-84e2869f0f4d.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10">
        <TeamBattlePage dungeonType="spider_nest" />
      </div>
    </div>
  );
};