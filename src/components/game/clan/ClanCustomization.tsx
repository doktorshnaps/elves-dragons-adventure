import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface ClanCustomizationProps {
  clanId: string;
  currentEmblem: string | null;
  currentBackground: string | null;
  onUpdate: () => void;
}

const SUPABASE_URL = 'https://oimhwdymghkwxznjarkv.supabase.co';

export const ClanCustomization = ({
  clanId,
  currentEmblem,
  currentBackground,
  onUpdate,
}: ClanCustomizationProps) => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [uploadingEmblem, setUploadingEmblem] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const emblemRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (
    file: File,
    type: 'emblem' | 'background'
  ): Promise<string | null> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    if (ext !== 'webp') {
      toast({ title: 'Ошибка', description: 'Допустимый формат: только WEBP', variant: 'destructive' });
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Ошибка', description: 'Максимальный размер файла: 2 МБ', variant: 'destructive' });
      return null;
    }

    const path = `${clanId}/${type}.${ext}`;

    const { error } = await supabase.storage
      .from('clan-assets')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      console.error('Upload error:', error);
      toast({ title: 'Ошибка загрузки', description: error.message, variant: 'destructive' });
      return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/clan-assets/${path}?t=${Date.now()}`;
  };

  const handleEmblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accountId) return;
    setUploadingEmblem(true);
    try {
      const url = await uploadFile(file, 'emblem');
      if (!url) return;
      const { data, error } = await supabase.rpc('update_clan_customization', {
        p_wallet: accountId,
        p_emblem: url,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Эмблема обновлена!' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingEmblem(false);
      if (emblemRef.current) emblemRef.current.value = '';
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accountId) return;
    setUploadingBg(true);
    try {
      const url = await uploadFile(file, 'background');
      if (!url) return;
      const { data, error } = await supabase.rpc('update_clan_customization', {
        p_wallet: accountId,
        p_background_image: url,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Фон обновлён!' });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingBg(false);
      if (bgRef.current) bgRef.current.value = '';
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
        <Camera className="w-4 h-4 text-amber-400" />
        Оформление клана
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Emblem */}
        <div className="space-y-2">
          <label className="text-xs text-white/60 block">Эмблема</label>
          <div
            className="w-full aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-amber-500/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors relative group"
            onClick={() => emblemRef.current?.click()}
          >
            {currentEmblem ? (
              <>
                <img src={currentEmblem} alt="Эмблема" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </>
            ) : (
              <div className="text-center p-2">
                <Camera className="w-6 h-6 text-white/30 mx-auto mb-1" />
                <span className="text-[10px] text-white/30">Загрузить</span>
              </div>
            )}
            {uploadingEmblem && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={emblemRef}
            type="file"
            accept="image/webp"
            className="hidden"
            onChange={handleEmblemUpload}
          />
        </div>

        {/* Background */}
        <div className="space-y-2">
          <label className="text-xs text-white/60 block">Фон страницы</label>
          <div
            className="w-full aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-amber-500/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors relative group"
            onClick={() => bgRef.current?.click()}
          >
            {currentBackground ? (
              <>
                <img src={currentBackground} alt="Фон" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
              </>
            ) : (
              <div className="text-center p-2">
                <ImageIcon className="w-6 h-6 text-white/30 mx-auto mb-1" />
                <span className="text-[10px] text-white/30">Загрузить</span>
              </div>
            )}
            {uploadingBg && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={bgRef}
            type="file"
            accept="image/webp"
            className="hidden"
            onChange={handleBgUpload}
          />
        </div>
      </div>

      <p className="text-[10px] text-white/30 mt-2">
        Макс. 2 МБ. Формат: только WEBP. Доступно главе и заместителю.
      </p>
    </div>
  );
};
