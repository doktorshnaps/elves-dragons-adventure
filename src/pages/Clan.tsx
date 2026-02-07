import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Search, Trophy, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useClan } from '@/hooks/useClan';
import { ClanOverview } from '@/components/game/clan/ClanOverview';
import { ClanCreate } from '@/components/game/clan/ClanCreate';
import { ClanSearch } from '@/components/game/clan/ClanSearch';
import { ClanLeaderboard } from '@/components/game/clan/ClanLeaderboard';
import { ClanRequests } from '@/components/game/clan/ClanRequests';
import { usePageMeta } from '@/hooks/usePageTitle';

export const ClanPage = () => {
  usePageMeta({ title: 'Клан', description: 'Управление кланом' });
  const navigate = useNavigate();
  const {
    myClan,
    myMembers,
    myRole,
    pendingRequests,
    leaderboard,
    requests,
    loadingMyClan,
    loadingLeaderboard,
    loadingRequests,
    createClan,
    joinClan,
    reviewRequest,
    leaveClan,
    kickMember,
    changeRole,
    transferLeadership,
    disbandClan,
    searchClans,
  } = useClan();

  if (loadingMyClan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-game-background">
        <div className="text-white text-lg">Загрузка клана...</div>
      </div>
    );
  }

  const showRequests = myRole && ['leader', 'deputy', 'officer'].includes(myRole);

  return (
    <div className="min-h-screen bg-game-background p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="text-white p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white">Клан</h1>
          </div>
        </div>

        {myClan ? (
          /* Has clan - show clan management */
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full bg-black/40 border border-white/10">
              <TabsTrigger value="overview" className="flex-1 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Клан
              </TabsTrigger>
              {showRequests && (
                <TabsTrigger value="requests" className="flex-1 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white relative">
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Заявки
                  {pendingRequests > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] h-4 min-w-4 px-1">
                      {pendingRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="leaderboard" className="flex-1 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Trophy className="w-3.5 h-3.5 mr-1" />
                Рейтинг
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <ClanOverview
                clan={myClan}
                members={myMembers}
                myRole={myRole}
                onLeave={leaveClan}
                onDisband={disbandClan}
                onKick={kickMember}
                onChangeRole={changeRole}
                onTransferLeadership={transferLeadership}
              />
            </TabsContent>

            {showRequests && (
              <TabsContent value="requests">
                <ClanRequests
                  requests={requests}
                  loading={loadingRequests}
                  onReview={reviewRequest}
                />
              </TabsContent>
            )}

            <TabsContent value="leaderboard">
              <ClanLeaderboard
                leaderboard={leaderboard}
                loading={loadingLeaderboard}
                myClanId={myClan.id}
              />
            </TabsContent>
          </Tabs>
        ) : (
          /* No clan - show create/search/leaderboard */
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="w-full bg-black/40 border border-white/10">
              <TabsTrigger value="search" className="flex-1 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Search className="w-3.5 h-3.5 mr-1" />
                Поиск
              </TabsTrigger>
              <TabsTrigger value="create" className="flex-1 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Создать
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1 text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Trophy className="w-3.5 h-3.5 mr-1" />
                Рейтинг
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <ClanSearch onSearch={searchClans} onJoin={joinClan} hasClan={false} />
            </TabsContent>

            <TabsContent value="create">
              <ClanCreate onCreateClan={createClan} />
            </TabsContent>

            <TabsContent value="leaderboard">
              <ClanLeaderboard
                leaderboard={leaderboard}
                loading={loadingLeaderboard}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
