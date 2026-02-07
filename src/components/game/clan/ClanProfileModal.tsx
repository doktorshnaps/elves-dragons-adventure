import { useState, useEffect } from 'react';
import { Shield, Users, Coins, Crown, Trophy, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface ClanProfileData {
  id: string;
  name: string;
  description: string | null;
  emblem: string | null;
  header_background: string | null;
  level: number;
  experience: number;
  treasury_ell: number;
  max_members: number;
  join_policy: string;
  leader_wallet: string;
  created_at: string;
  social_links: Record<string, string> | null;
  member_count: number;
  total_elo: number;
}

interface ClanProfileMember {
  wallet_address: string;
  role: string;
  display_name: string | null;
  elo: number;
}

interface ClanProfileModalProps {
  clanId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POLICY_LABELS: Record<string, string> = {
  open: 'Свободный вход',
  approval: 'По заявке',
  invite_only: 'По приглашению',
};

const ROLE_LABELS: Record<string, string> = {
  leader: '👑',
  deputy: '⚔️',
  officer: '🛡️',
  member: '',
};

const SOCIAL_ICONS: Record<string, string> = {
  telegram: '✈️',
  discord: '💬',
  twitter: '𝕏',
  website: '🌐',
};

export const ClanProfileModal = ({ clanId, open, onOpenChange }: ClanProfileModalProps) => {
  const [clan, setClan] = useState<ClanProfileData | null>(null);
  const [members, setMembers] = useState<ClanProfileMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clanId || !open) return;
    setLoading(true);
    setClan(null);
    setMembers([]);

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.rpc('get_clan_profile', { p_clan_id: clanId });
        if (error) {
          console.error('Error fetching clan profile:', error);
          return;
        }
        const result = data as any;
        if (result?.success) {
          setClan(result.clan);
          setMembers(result.members || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [clanId, open]);

  const isEmblemUrl = clan?.emblem?.startsWith('http');
  const socialEntries = clan?.social_links
    ? Object.entries(clan.social_links).filter(([, v]) => v && v.trim())
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-white/10 max-w-md p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
          </div>
        ) : clan ? (
          <div>
            {/* Header with optional background */}
            <div className="relative p-5 pb-4">
              {clan.header_background && (
                <div className="absolute inset-0">
                  <img src={clan.header_background} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60" />
                </div>
              )}
              <div className="relative z-10">
                <DialogHeader className="mb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {isEmblemUrl ? (
                        <img src={clan.emblem!} alt="Эмблема" className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-7 h-7 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-white text-lg">{clan.name}</DialogTitle>
                      {clan.description && (
                        <p className="text-sm text-white/60 mt-1 line-clamp-3">{clan.description}</p>
                      )}
                      {/* Social links */}
                      {socialEntries.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          {socialEntries.map(([key, url]) => (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 rounded-full px-2 py-0.5 text-white/80 hover:text-white transition-colors"
                            >
                              <span>{SOCIAL_ICONS[key] || '🔗'}</span>
                              <span className="capitalize">{key === 'twitter' ? 'X' : key}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="border-amber-500/50 text-amber-400 flex-shrink-0">
                      Ур. {clan.level}
                    </Badge>
                  </div>
                </DialogHeader>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 px-5 pb-4">
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <Users className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                <div className="text-white font-bold text-sm">{clan.member_count}/{clan.max_members}</div>
                <div className="text-[10px] text-white/50">Участники</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <Trophy className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                <div className="text-white font-bold text-sm">{clan.total_elo}</div>
                <div className="text-[10px] text-white/50">Общий Elo</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <Coins className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-0.5" />
                <div className="text-white font-bold text-sm">{clan.treasury_ell}</div>
                <div className="text-[10px] text-white/50">Казна</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center">
                <Crown className="w-3.5 h-3.5 text-purple-400 mx-auto mb-0.5" />
                <div className="text-white font-bold text-[10px]">{POLICY_LABELS[clan.join_policy] || clan.join_policy}</div>
                <div className="text-[10px] text-white/50">Вступление</div>
              </div>
            </div>

            {/* Members list */}
            {members.length > 0 && (
              <div className="px-5 pb-5">
                <h4 className="text-xs font-semibold text-white/50 uppercase mb-2">Участники</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {members.map((m) => (
                    <div key={m.wallet_address} className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5">
                      <span className="text-sm w-5">{ROLE_LABELS[m.role] || ''}</span>
                      <span className="text-sm text-white flex-1 truncate">
                        {m.display_name || `${m.wallet_address.slice(0, 8)}...`}
                      </span>
                      <span className="text-xs text-amber-400/70">{m.elo} Elo</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-white/50">Клан не найден</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
