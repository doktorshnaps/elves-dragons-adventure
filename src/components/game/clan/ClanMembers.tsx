import { Crown, Shield, Swords, User, UserMinus, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { ClanMember } from '@/hooks/useClan';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface ClanMembersProps {
  members: ClanMember[];
  myRole: string | null;
  onKick: (wallet: string) => Promise<boolean | undefined>;
  onChangeRole: (wallet: string, role: string) => Promise<boolean | undefined>;
  onTransferLeadership: (wallet: string) => Promise<boolean | undefined>;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  leader: <Crown className="w-3.5 h-3.5 text-yellow-400" />,
  deputy: <Swords className="w-3.5 h-3.5 text-purple-400" />,
  officer: <Shield className="w-3.5 h-3.5 text-blue-400" />,
  member: <User className="w-3.5 h-3.5 text-white/50" />,
};

const ROLE_LABEL: Record<string, string> = {
  leader: 'Глава',
  deputy: 'Заместитель',
  officer: 'Офицер',
  member: 'Участник',
};

const ROLE_COLOR: Record<string, string> = {
  leader: 'border-yellow-500/50 text-yellow-400',
  deputy: 'border-purple-500/50 text-purple-400',
  officer: 'border-blue-500/50 text-blue-400',
  member: 'border-white/20 text-white/60',
};

export const ClanMembers = ({ members, myRole, onKick, onChangeRole, onTransferLeadership }: ClanMembersProps) => {
  const { accountId } = useWalletContext();
  const canManage = myRole === 'leader' || myRole === 'deputy';

  const canKick = (targetRole: string, targetWallet: string) => {
    if (targetWallet === accountId) return false;
    if (myRole === 'leader') return true;
    if (myRole === 'deputy' && (targetRole === 'officer' || targetRole === 'member')) return true;
    if (myRole === 'officer' && targetRole === 'member') return true;
    return false;
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        Участники ({members.length})
      </h3>

      <div className="space-y-2">
        {members.map(member => (
          <div
            key={member.wallet_address}
            className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {ROLE_ICON[member.role]}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {member.display_name || `${member.wallet_address.slice(0, 8)}...`}
                  {member.wallet_address === accountId && (
                    <span className="text-xs text-white/40 ml-1">(вы)</span>
                  )}
                </div>
                <div className="text-xs text-white/40">Elo: {member.elo}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] ${ROLE_COLOR[member.role]}`}>
                {ROLE_LABEL[member.role]}
              </Badge>

              {canManage && member.wallet_address !== accountId && member.role !== 'leader' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/50 hover:text-white">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {myRole === 'leader' && (
                      <>
                        {member.role !== 'deputy' && (
                          <DropdownMenuItem onClick={() => onChangeRole(member.wallet_address, 'deputy')}>
                            Назначить заместителем
                          </DropdownMenuItem>
                        )}
                        {member.role !== 'officer' && (
                          <DropdownMenuItem onClick={() => onChangeRole(member.wallet_address, 'officer')}>
                            Назначить офицером
                          </DropdownMenuItem>
                        )}
                        {member.role !== 'member' && (
                          <DropdownMenuItem onClick={() => onChangeRole(member.wallet_address, 'member')}>
                            Понизить до участника
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onTransferLeadership(member.wallet_address)} className="text-yellow-500">
                          Передать лидерство
                        </DropdownMenuItem>
                      </>
                    )}
                    {canKick(member.role, member.wallet_address) && (
                      <DropdownMenuItem onClick={() => onKick(member.wallet_address)} className="text-red-500">
                        Исключить
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
