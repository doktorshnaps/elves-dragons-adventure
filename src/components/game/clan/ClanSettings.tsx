import { useState } from 'react';
import { Save, Globe, MessageSquare, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type SocialLinks = Record<string, string>;

interface ClanSettingsProps {
  currentDescription: string | null;
  currentSocialLinks: SocialLinks;
  onSave: (description: string, socialLinks: SocialLinks) => Promise<boolean>;
}

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string; icon: string }[] = [
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/your_channel', icon: '✈️' },
  { key: 'discord', label: 'Discord', placeholder: 'https://discord.gg/invite', icon: '💬' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/username', icon: '𝕏' },
  { key: 'website', label: 'Сайт', placeholder: 'https://your-site.com', icon: '🌐' },
];

export const ClanSettings = ({ currentDescription, currentSocialLinks, onSave }: ClanSettingsProps) => {
  const [description, setDescription] = useState(currentDescription || '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(currentSocialLinks || {});
  const [saving, setSaving] = useState(false);

  const handleSocialChange = (key: keyof SocialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean empty strings from social links
      const cleanedLinks: SocialLinks = {};
      for (const [key, value] of Object.entries(socialLinks)) {
        if (value && value.trim()) {
          cleanedLinks[key as keyof SocialLinks] = value.trim();
        }
      }
      await onSave(description.trim(), cleanedLinks);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Description */}
      <div className="space-y-2">
        <Label className="text-white/80 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          Описание клана
        </Label>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Расскажите о своём клане..."
          className="bg-black/40 border-white/20 text-white placeholder:text-white/30 resize-none"
        />
        <p className="text-[10px] text-white/40 text-right">{description.length}/500</p>
      </div>

      {/* Social Links */}
      <div className="space-y-3">
        <Label className="text-white/80 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          Соцсети и ссылки
        </Label>
        {SOCIAL_FIELDS.map(({ key, label, placeholder, icon }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-base w-6 text-center flex-shrink-0">{icon}</span>
            <Input
              value={socialLinks[key] || ''}
              onChange={e => handleSocialChange(key, e.target.value)}
              placeholder={placeholder}
              className="bg-black/40 border-white/20 text-white placeholder:text-white/30 text-sm h-9"
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {saving ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </div>
  );
};

/** Small inline display for social links (read-only, shown in clan overview) */
export const SocialLinksDisplay = ({ links }: { links: SocialLinks }) => {
  const entries = Object.entries(links).filter(([, v]) => v && v.trim());
  if (entries.length === 0) return null;

  const icons: Record<string, string> = {
    telegram: '✈️',
    discord: '💬',
    twitter: '𝕏',
    website: '🌐',
  };

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      {entries.map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1 text-white/80 hover:text-white transition-colors"
        >
          <span>{icons[key] || '🔗'}</span>
          <span className="capitalize">{key === 'twitter' ? 'X' : key}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-50" />
        </a>
      ))}
    </div>
  );
};
