import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus } from 'lucide-react';

interface ClanCreateProps {
  onCreateClan: (name: string, description: string, joinPolicy: string) => Promise<boolean | undefined>;
}

export const ClanCreate = ({ onCreateClan }: ClanCreateProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinPolicy, setJoinPolicy] = useState('approval');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || name.length < 3) return;
    setCreating(true);
    try {
      await onCreateClan(name.trim(), description.trim(), joinPolicy);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-bold text-white">Создать клан</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-white/70 mb-1 block">Название (3-20 символов)</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            placeholder="Введите название клана"
            className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="text-sm text-white/70 mb-1 block">Описание (необязательно, макс 200)</label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={200}
            placeholder="Описание клана"
            className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="text-sm text-white/70 mb-1 block">Политика вступления</label>
          <Select value={joinPolicy} onValueChange={setJoinPolicy}>
            <SelectTrigger className="bg-black/30 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Свободный вход</SelectItem>
              <SelectItem value="approval">По заявке</SelectItem>
              <SelectItem value="invite_only">Только по приглашению</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleCreate}
          disabled={creating || name.length < 3}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {creating ? 'Создание...' : 'Создать клан'}
        </Button>
      </div>
    </div>
  );
};
