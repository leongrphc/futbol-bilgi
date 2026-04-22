'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useUserStore } from '@/lib/stores/user-store';

// ==========================================
// Sound Effects Map
// ==========================================

const SOUND_EFFECTS = {
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  tick: '/sounds/tick.mp3',
  timeout: '/sounds/timeout.mp3',
  joker: '/sounds/joker.mp3',
  levelUp: '/sounds/level-up.mp3',
  coin: '/sounds/coin.mp3',
  click: '/sounds/click.mp3',
  gameStart: '/sounds/game-start.mp3',
  gameOver: '/sounds/game-over.mp3',
  victory: '/sounds/victory.mp3',
  safePoint: '/sounds/safe-point.mp3',
  countdown: '/sounds/countdown.mp3',
  duelMatch: '/sounds/duel-match.mp3',
} as const;

export type SoundEffect = keyof typeof SOUND_EFFECTS;

// ==========================================
// useSound Hook
// ==========================================

interface UseSoundReturn {
  play: (sound: SoundEffect) => void;
  playMusic: (src: string) => void;
  stopMusic: () => void;
  setVolume: (volume: number) => void;
}

export function useSound(): UseSoundReturn {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(0.5);

  // Cleanup on unmount
  useEffect(() => {
    const cachedAudio = audioCache.current;
    const music = musicRef.current;

    return () => {
      cachedAudio.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      cachedAudio.clear();

      if (music) {
        music.pause();
        music.src = '';
      }
    };
  }, []);

  const play = useCallback((sound: SoundEffect) => {
    // Check if sound is enabled (read from store outside React lifecycle)
    const user = useUserStore.getState().user;
    if (user && !user.settings.sound_enabled) return;

    try {
      const src = SOUND_EFFECTS[sound];
      let audio = audioCache.current.get(src);

      if (!audio) {
        audio = new Audio(src);
        audioCache.current.set(src, audio);
      }

      audio.volume = volumeRef.current;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay may be blocked; silently ignore
      });
    } catch {
      // Audio not available (SSR or missing file); silently ignore
    }
  }, []);

  const playMusic = useCallback((src: string) => {
    const user = useUserStore.getState().user;
    if (user && !user.settings.music_enabled) return;

    try {
      if (musicRef.current) {
        musicRef.current.pause();
      }

      musicRef.current = new Audio(src);
      musicRef.current.loop = true;
      musicRef.current.volume = volumeRef.current * 0.3; // Music is quieter
      musicRef.current.play().catch(() => {
        // Autoplay may be blocked
      });
    } catch {
      // Audio not available
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
    if (musicRef.current) {
      musicRef.current.volume = volumeRef.current * 0.3;
    }
  }, []);

  return { play, playMusic, stopMusic, setVolume };
}
