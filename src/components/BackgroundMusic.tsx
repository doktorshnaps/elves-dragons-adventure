import { useEffect } from 'react';
import { useMusic } from '@/hooks/useMusic';

export const BackgroundMusic = () => {
  const { audioRef, volume, isPlaying } = useMusic();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume, audioRef]);

  return (
    <audio
      ref={audioRef}
      src="/audio/background-music.mp3"
      loop
      autoPlay={isPlaying}
      style={{ display: 'none' }}
    />
  );
};
