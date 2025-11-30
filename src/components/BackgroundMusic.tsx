import { useEffect } from 'react';
import { useMusic } from '@/hooks/useMusic';

export const BackgroundMusic = () => {
  const { audioRef, volume, isPlaying } = useMusic();

  useEffect(() => {
    if (audioRef.current) {
      // Квадратичная шкала для более точного контроля на низких значениях
      audioRef.current.volume = Math.pow(volume / 100, 2);
    }
  }, [volume, audioRef]);

  return (
    <audio
      ref={audioRef}
      src="/audio/background-music.mp3"
      loop
      preload="auto"
      style={{ display: 'none' }}
    />
  );
};
