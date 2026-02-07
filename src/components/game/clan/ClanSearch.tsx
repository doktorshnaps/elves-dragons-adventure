import { useState, useEffect } from 'react';
import { Search, Users, Shield, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ClanSearchResult } from '@/hooks/useClan';

interface ClanSearchProps {
  onSearch: (query?: string) => Promise<ClanSearchResult[]>;
  onJoin: (clanId: string, message?: string) => Promise<boolean | undefined>;
  hasClan: boolean;
}

const POLICY_LABELS: Record<string, string> = {
  open: '🟢 Открытый',
  approval: '🟡 По заявке',
  invite_only: '🔴 По приглашению',
};

export const ClanSearch = ({ onSearch, onJoin, hasClan }: ClanSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClanSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await onSearch();
        setResults(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await onSearch(query || undefined);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (clanId: string) => {
    setJoining(clanId);
    try {
      const success = await onJoin(clanId);
      if (success) {
        // Refresh search results to update member counts
        const data = await onSearch(query || undefined);
        setResults(data);
      }
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск кланов..."
          className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-white/50 py-8">Загрузка...</div>
      ) : results.length === 0 ? (
        <div className="text-center text-white/50 py-8">Кланы не найдены</div>
      ) : (
        <div className="space-y-2">
          {results.map(clan => (
            <div key={clan.id} className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center overflow-hidden">
                    {clan.emblem?.startsWith('http') ? (
                      <img src={clan.emblem} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">{clan.name}</div>
                    {clan.description && (
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{clan.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/40">
                        <Users className="w-3 h-3 inline mr-0.5" />
                        {clan.member_count}/{clan.max_members}
                      </span>
                      <span className="text-xs text-white/40">Ур. {clan.level}</span>
                      <span className="text-xs">{POLICY_LABELS[clan.join_policy]}</span>
                    </div>
                  </div>
                </div>

                {!hasClan && clan.join_policy !== 'invite_only' && clan.member_count < clan.max_members && (
                  <Button
                    size="sm"
                    onClick={() => handleJoin(clan.id)}
                    disabled={joining === clan.id}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    {clan.join_policy === 'open' ? 'Вступить' : 'Подать заявку'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
