import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Layout, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface ClanCustomizationProps {
  clanId: string;
  currentEmblem: string | null;
  currentBackground: string | null;
  currentHeaderBackground: string | null;
  onUpdate: () => void;
}

const SUPABASE_URL = 'https://oimhwdymghkwxznjarkv.supabase.co';

type AssetType = 'emblem' | 'background' | 'header_background';

export const ClanCustomization = ({
  clanId,
  currentEmblem,
  currentBackground,
  currentHeaderBackground,
  onUpdate,
}: ClanCustomizationProps) => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const [uploading, setUploading] = useState<AssetType | null>(null);
  const emblemRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const headerBgRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const uploadFile = async (
    file: File,
    type: AssetType
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

    const image_base64 = await fileToBase64(file);

    const { data, error } = await supabase.functions.invoke('upload-clan-asset', {
      body: {
        wallet_address: accountId,
        clan_id: clanId,
        asset_type: type,
        image_base64,
        content_type: file.type || 'image/webp',
      },
    });

    if (error) {
      console.error('Upload invoke error:', error);
      toast({ title: 'Ошибка загрузки', description: error.message, variant: 'destructive' });
      return null;
    }
    if (!data?.success || !data?.url) {
      toast({ title: 'Ошибка загрузки', description: data?.error || 'Неизвестная ошибка', variant: 'destructive' });
      return null;
    }
    return data.url as string;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: AssetType) => {
    const file = e.target.files?.[0];
    if (!file || !accountId) return;
    setUploading(type);
    try {
      const url = await uploadFile(file, type);
      if (!url) return;

      const rpcParams: any = { p_wallet: accountId };
      if (type === 'emblem') rpcParams.p_emblem = url;
      if (type === 'background') rpcParams.p_background_image = url;
      if (type === 'header_background') rpcParams.p_header_background = url;

      const { data, error } = await supabase.rpc('update_clan_customization', rpcParams);
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
        return;
      }

      const labels: Record<AssetType, string> = {
        emblem: 'Эмблема обновлена!',
        background: 'Фон страницы обновлён!',
        header_background: 'Панель обновлена!',
      };
      toast({ title: labels[type] });
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(null);
      if (emblemRef.current) emblemRef.current.value = '';
      if (bgRef.current) bgRef.current.value = '';
      if (headerBgRef.current) headerBgRef.current.value = '';
    }
  };

  const renderSlot = (
    label: string,
    icon: React.ReactNode,
    currentImage: string | null,
    inputRef: React.RefObject<HTMLInputElement>,
    type: AssetType,
    aspect: string = 'aspect-square'
  ) => (
    <div className="space-y-2">
      <label className="text-xs text-white/60 block">{label}</label>
      <div
        className={`w-full ${aspect} rounded-lg border-2 border-dashed border-white/20 hover:border-amber-500/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors relative group`}
        onClick={() => inputRef.current?.click()}
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {icon}
            </div>
          </>
        ) : (
          <div className="text-center p-2">
            <div className="text-white/30 mx-auto mb-1 flex justify-center">{icon}</div>
            <span className="text-[10px] text-white/30">Загрузить</span>
          </div>
        )}
        {uploading === type && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/webp"
        className="hidden"
        onChange={(e) => handleUpload(e, type)}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {renderSlot(
          'Иконка (рейтинг)',
          <Camera className="w-5 h-5 text-white" />,
          currentEmblem,
          emblemRef,
          'emblem'
        )}
        {renderSlot(
          'Центральная панель',
          <Layout className="w-5 h-5 text-white" />,
          currentHeaderBackground,
          headerBgRef,
          'header_background'
        )}
        {renderSlot(
          'Фон страницы',
          <ImageIcon className="w-5 h-5 text-white" />,
          currentBackground,
          bgRef,
          'background'
        )}
      </div>

      <p className="text-[10px] text-white/40">
        Макс. 2 МБ · Формат: только WEBP
      </p>
    </div>
  );
};
