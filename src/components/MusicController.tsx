import { useLocation } from 'react-router-dom';
import { BackgroundMusic } from './BackgroundMusic';

export function MusicController() {
  const location = useLocation();
  const shouldPlayMusic = location.pathname !== '/' && location.pathname !== '/auth';
  
  return shouldPlayMusic ? <BackgroundMusic /> : null;
}
