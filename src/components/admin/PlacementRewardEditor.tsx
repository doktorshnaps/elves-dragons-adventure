import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, X, ChevronDown, ChevronRight, Award } from "lucide-react";
import { BonusRewardEditor, BonusRewardDisplay, BonusReward } from "./BonusRewardEditor";

export interface PlacementReward {
  from_rank: number;
  to_rank: number;
  ell_reward: number;
  bonus_rewards?: BonusReward[];
}

interface PlacementRewardEditorProps {
  rewards: PlacementReward[];
  onChange: (rewards: PlacementReward[]) => void;
}

const formatRankRange = (from: number, to: number): string => {
  if (from === to) return `Топ ${from}`;
  return `Топ ${from}-${to}`;
};

export const PlacementRewardEditor: React.FC<PlacementRewardEditorProps> = ({ rewards, onChange }) => {
  const [expanded, setExpanded] = useState(rewards.length > 0);
  const [addingNew, setAddingNew] = useState(false);
  const [newFromRank, setNewFromRank] = useState(1);
  const [newToRank, setNewToRank] = useState(1);
  const [newEllReward, setNewEllReward] = useState(0);

  const sortedRewards = [...rewards].sort((a, b) => a.from_rank - b.from_rank);

  const handleAdd = () => {
    if (newFromRank < 1 || newToRank < newFromRank) return;

    const newReward: PlacementReward = {
      from_rank: newFromRank,
      to_rank: newToRank,
      ell_reward: newEllReward,
    };

    onChange([...rewards, newReward]);
    // Auto-increment for next entry
    setNewFromRank(newToRank + 1);
    setNewToRank(newToRank + 1);
    setNewEllReward(0);
    setAddingNew(false);
  };

  const handleRemove = (index: number) => {
    const sorted = [...rewards].sort((a, b) => a.from_rank - b.from_rank);
    const toRemove = sorted[index];
    onChange(rewards.filter(r => !(r.from_rank === toRemove.from_rank && r.to_rank === toRemove.to_rank)));
  };

  const handleUpdateEll = (index: number, value: number) => {
    const sorted = [...rewards].sort((a, b) => a.from_rank - b.from_rank);
    const target = sorted[index];
    onChange(rewards.map(r =>
      r.from_rank === target.from_rank && r.to_rank === target.to_rank
        ? { ...r, ell_reward: value }
        : r
    ));
  };

  const handleUpdateBonusRewards = (index: number, bonusRewards: BonusReward[]) => {
    const sorted = [...rewards].sort((a, b) => a.from_rank - b.from_rank);
    const target = sorted[index];
    onChange(rewards.map(r =>
      r.from_rank === target.from_rank && r.to_rank === target.to_rank
        ? { ...r, bonus_rewards: bonusRewards }
        : r
    ));
  };

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Award className="w-3 h-3" />
        Награды по местам {rewards.length > 0 && `(${rewards.length})`}
      </button>

      {expanded && (
        <div className="mt-1.5 ml-2 space-y-1.5 border-l border-white/10 pl-2">
          {sortedRewards.map((reward, index) => (
            <div key={`${reward.from_rank}-${reward.to_rank}`} className="p-1.5 bg-white/5 rounded space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  {formatRankRange(reward.from_rank, reward.to_rank)}
                </Badge>
                <Input
                  type="number"
                  value={reward.ell_reward}
                  onChange={e => handleUpdateEll(index, parseInt(e.target.value) || 0)}
                  className="w-20 h-6 text-[10px]"
                />
                <span className="text-[10px] text-white/50">ELL</span>
                <button
                  onClick={() => handleRemove(index)}
                  className="ml-auto p-0.5 hover:bg-white/10 rounded text-white/40 hover:text-white/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <BonusRewardEditor
                rewards={reward.bonus_rewards || []}
                onChange={(bonusRewards) => handleUpdateBonusRewards(index, bonusRewards)}
                compact
              />
            </div>
          ))}

          {addingNew ? (
            <div className="p-2 bg-white/5 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/60">С</span>
                  <Input
                    type="number"
                    min={1}
                    value={newFromRank}
                    onChange={e => {
                      const v = parseInt(e.target.value) || 1;
                      setNewFromRank(v);
                      if (newToRank < v) setNewToRank(v);
                    }}
                    className="w-14 h-6 text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/60">по</span>
                  <Input
                    type="number"
                    min={newFromRank}
                    value={newToRank}
                    onChange={e => setNewToRank(parseInt(e.target.value) || newFromRank)}
                    className="w-14 h-6 text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={newEllReward}
                    onChange={e => setNewEllReward(parseInt(e.target.value) || 0)}
                    className="w-20 h-6 text-[10px]"
                    placeholder="ELL"
                  />
                  <span className="text-[10px] text-white/50">ELL</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-[10px] flex-1" onClick={handleAdd}>
                  Добавить
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setAddingNew(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] text-white/40 hover:text-white/70 px-1"
              onClick={() => setAddingNew(true)}
            >
              <Plus className="w-2.5 h-2.5 mr-0.5" />
              Место
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Read-only display for placement rewards
export const PlacementRewardDisplay: React.FC<{ rewards?: PlacementReward[] }> = ({ rewards }) => {
  if (!rewards || rewards.length === 0) return null;

  const sorted = [...rewards].sort((a, b) => a.from_rank - b.from_rank);

  return (
    <div className="mt-1 ml-2 space-y-0.5 border-l border-white/10 pl-2">
      {sorted.map((reward, index) => (
        <div key={index} className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            {formatRankRange(reward.from_rank, reward.to_rank)}
          </Badge>
          {reward.ell_reward > 0 && (
            <span className="text-[10px] text-yellow-400">{reward.ell_reward} ELL</span>
          )}
          <BonusRewardDisplay rewards={reward.bonus_rewards} />
        </div>
      ))}
    </div>
  );
};
