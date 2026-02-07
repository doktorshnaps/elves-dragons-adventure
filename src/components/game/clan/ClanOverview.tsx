import { useState } from 'react';
import { Shield, Crown, Users, Coins, LogOut, Trash2, Paintbrush, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClanMembers } from './ClanMembers';
import { ClanCustomization } from './ClanCustomization';
import { ClanSettings, SocialLinksDisplay } from './ClanSettings';
import type { ClanInfo, ClanMember } from '@/hooks/useClan';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ClanOverviewProps {
  clan: ClanInfo;
  members: ClanMember[];
  myRole: string | null;
  onLeave: () => Promise<boolean | undefined>;
  onDisband: () => Promise<boolean | undefined>;
  onKick: (wallet: string) => Promise<boolean | undefined>;
  onChangeRole: (wallet: string, role: string) => Promise<boolean | undefined>;
  onTransferLeadership: (wallet: string) => Promise<boolean | undefined>;
  onCustomizationUpdate: () => void;
  onUpdateClanInfo: (description: string, socialLinks: Record<string, string>) => Promise<boolean>;
}

const ROLE_LABELS: Record<string, string> = {
  leader: '👑 Глава',
  deputy: '⚔️ Заместитель',
  officer: '🛡️ Офицер',
  member: '👤 Участник',
};

const POLICY_LABELS: Record<string, string> = {
  open: 'Свободный вход',
  approval: 'По заявке',
  invite_only: 'По приглашению',
};

export const ClanOverview = ({
  clan,
  members,
  myRole,
  onLeave,
  onDisband,
  onKick,
  onChangeRole,
  onTransferLeadership,
  onCustomizationUpdate,
  onUpdateClanInfo,
}: ClanOverviewProps) => {
  const isEmblemUrl = clan.emblem?.startsWith('http');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Clan header with optional background */}
      <div
        className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 relative overflow-hidden"
      >
        {/* Header background image (central panel) */}
        {clan.header_background && (
          <div className="absolute inset-0">
            <img src={clan.header_background} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center overflow-hidden">
                {isEmblemUrl ? (
                  <img src={clan.emblem} alt="Эмблема" className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{clan.name}</h2>
                {clan.description && (
                  <p className="text-sm text-white/60 mt-0.5">{clan.description}</p>
                )}
                {clan.social_links && <SocialLinksDisplay links={clan.social_links} />}
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500/50 text-amber-400">
              Ур. {clan.level}
            </Badge>
          </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-white font-bold">{members.length}/{clan.max_members}</div>
            <div className="text-xs text-white/50">Участники</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <Coins className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <div className="text-white font-bold">{clan.treasury_ell}</div>
            <div className="text-xs text-white/50">Казна ELL</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <Crown className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <div className="text-white font-bold text-sm">{POLICY_LABELS[clan.join_policy] || clan.join_policy}</div>
            <div className="text-xs text-white/50">Вступление</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          {(myRole === 'leader' || myRole === 'deputy') && (
            <>
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20">
                    <Settings className="w-3.5 h-3.5 mr-1" />
                    Настройки
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-white/10 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Настройки клана</DialogTitle>
                  </DialogHeader>
                  <ClanSettings
                    currentDescription={clan.description}
                    currentSocialLinks={clan.social_links || {}}
                    onSave={async (desc, links) => {
                      const ok = await onUpdateClanInfo(desc, links);
                      if (ok) setSettingsOpen(false);
                      return ok;
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20">
                    <Paintbrush className="w-3.5 h-3.5 mr-1" />
                    Оформление
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-white/10 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Оформление клана</DialogTitle>
                  </DialogHeader>
                  <ClanCustomization
                    clanId={clan.id}
                    currentEmblem={isEmblemUrl ? clan.emblem : null}
                    currentBackground={clan.background_image}
                    currentHeaderBackground={clan.header_background}
                    onUpdate={() => {
                      onCustomizationUpdate();
                      setCustomizeOpen(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
          {myRole !== 'leader' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Покинуть
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Покинуть клан?</AlertDialogTitle>
                  <AlertDialogDescription>Вы уверены, что хотите покинуть клан "{clan.name}"?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onLeave()} className="bg-red-600">Покинуть</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {myRole === 'leader' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Расформировать
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Расформировать клан?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Все участники будут исключены, казна будет потеряна.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDisband()} className="bg-red-600">Расформировать</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        </div>
      </div>

      {/* Customization dialog (leader/deputy only) — no inline block */}

      {/* Members */}
      <ClanMembers
        members={members}
        myRole={myRole}
        onKick={onKick}
        onChangeRole={onChangeRole}
        onTransferLeadership={onTransferLeadership}
      />
    </div>
  );
};
