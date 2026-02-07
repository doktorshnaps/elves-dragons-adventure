import { Trophy, Shield, Users, Crown } from 'lucide-react';
import type { ClanLeaderboardEntry } from '@/hooks/useClan';

interface ClanLeaderboardProps {
  leaderboard: ClanLeaderboardEntry[];
  loading: boolean;
  myClanId?: string;
}

export const ClanLeaderboard = ({ leaderboard, loading, myClanId }: ClanLeaderboardProps) => {
  if (loading) {
    return <div className="text-center text-white/50 py-8">Загрузка рейтинга...</div>;
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
        <Trophy className="w-8 h-8 text-white/30 mx-auto mb-2" />
        <p className="text-white/50">Пока нет кланов в рейтинге</p>
      </div>
    );
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return 'text-yellow-400 font-bold';
    if (index === 1) return 'text-gray-300 font-bold';
    if (index === 2) return 'text-amber-600 font-bold';
    return 'text-white/60';
  };

  const getRankBg = (index: number) => {
    if (index === 0) return 'border-yellow-500/30 bg-yellow-500/5';
    if (index === 1) return 'border-gray-400/30 bg-gray-400/5';
    if (index === 2) return 'border-amber-600/30 bg-amber-600/5';
    return 'border-white/10';
  };

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, index) => (
        <div
          key={entry.id}
          className={`bg-black/40 backdrop-blur-sm border rounded-xl p-3 ${getRankBg(index)} ${
            entry.id === myClanId ? 'ring-1 ring-amber-500/50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 text-center text-lg ${getRankStyle(index)}`}>
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
            </div>

            <div className="w-9 h-9 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center overflow-hidden">
              {entry.emblem?.startsWith('http') ? (
                <img src={entry.emblem} alt="" className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-4 h-4 text-amber-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">
                {entry.name}
                {entry.id === myClanId && <span className="text-amber-400 text-xs ml-1">(ваш)</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span><Users className="w-3 h-3 inline" /> {entry.member_count}/{entry.max_members}</span>
                <span>Ур. {entry.level}</span>
                {entry.leader_name && <span><Crown className="w-3 h-3 inline" /> {entry.leader_name}</span>}
              </div>
            </div>

            <div className="text-right">
              <div className="text-amber-400 font-bold text-sm">{entry.total_elo}</div>
              <div className="text-[10px] text-white/40">Общий Elo</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
