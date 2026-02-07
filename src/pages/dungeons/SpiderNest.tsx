import { TeamBattlePage } from '@/components/game/battle/TeamBattlePage';

export const SpiderNest = () => {
  return (
    <div 
      className="h-screen relative flex flex-col bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/lovable-uploads/76e1f373-c075-4b97-9cde-84e2869f0f4d.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="flex-1 overflow-y-auto relative z-10">
        <TeamBattlePage dungeonType="spider_nest" />
      </div>
    </div>
  );
};