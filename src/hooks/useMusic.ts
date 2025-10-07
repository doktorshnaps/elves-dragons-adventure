import { useContext } from 'react';
import { MusicContext } from '@/contexts/MusicContext';

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    console.warn('useMusic used outside of MusicProvider.');
    const volume = parseFloat(localStorage.getItem('game-music-volume') || '50');
    const setVolume = (value: number) => localStorage.setItem('game-music-volume', value.toString());
    const isPlaying = localStorage.getItem('game-music-playing') === 'true';
    const setIsPlaying = (value: boolean) => localStorage.setItem('game-music-playing', value.toString());
    return { volume, setVolume, isPlaying, setIsPlaying, audioRef: { current: null } };
  }
  return ctx;
};
