import { createContext, useEffect, useMemo, useState, ReactNode, useRef } from 'react';

interface MusicContextValue {
  volume: number;
  setVolume: (value: number) => void;
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  getSoundEffectVolume: () => number;
}

export const MusicContext = createContext<MusicContextValue | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('game-music-volume');
    return saved ? parseFloat(saved) : 50;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    const saved = localStorage.getItem('game-music-playing');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('game-music-volume', volume.toString());
    if (audioRef.current) {
      // Квадратичная шкала для более точного контроля на низких значениях
      audioRef.current.volume = Math.pow(volume / 100, 2);
    }
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('game-music-playing', isPlaying.toString());
    
    const audio = audioRef.current;
    if (!audio) return;

    // Проверяем, что аудио загружено достаточно для воспроизведения
    const handlePlayPause = () => {
      if (isPlaying) {
        // Устанавливаем громкость перед воспроизведением
        audio.volume = Math.pow(volume / 100, 2);
        audio.play().catch(err => console.log('Audio play failed:', err));
      } else {
        audio.pause();
        audio.currentTime = 0; // Сбрасываем позицию при остановке
      }
    };

    // Если аудио уже загружено, сразу управляем воспроизведением
    if (audio.readyState >= 2) {
      handlePlayPause();
    } else {
      // Если еще не загружено, ждем события canplay
      audio.addEventListener('canplay', handlePlayPause, { once: true });
      return () => audio.removeEventListener('canplay', handlePlayPause);
    }
  }, [isPlaying, volume]);

  const getSoundEffectVolume = () => {
    return Math.pow(volume / 100, 2);
  };

  const value = useMemo(() => ({ 
    volume, 
    setVolume, 
    isPlaying, 
    setIsPlaying,
    audioRef,
    getSoundEffectVolume
  }), [volume, isPlaying]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
