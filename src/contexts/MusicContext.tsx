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
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

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
