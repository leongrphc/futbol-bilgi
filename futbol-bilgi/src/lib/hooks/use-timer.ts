'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerState } from '@/types';

interface UseTimerOptions {
  initialTime: number; // seconds
  autoStart?: boolean;
  onTick?: (remaining: number) => void;
  onExpire?: () => void;
}

interface UseTimerReturn extends TimerState {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newTime?: number) => void;
  addTime: (seconds: number) => void;
}

export function useTimer({
  initialTime,
  autoStart = false,
  onTick,
  onExpire,
}: UseTimerOptions): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  // Keep callback refs fresh
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isRunning || isExpired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;

        if (next <= 0) {
          setIsRunning(false);
          setIsExpired(true);
          onExpireRef.current?.();
          return 0;
        }

        onTickRef.current?.(next);
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isExpired]);

  const start = useCallback(() => {
    setIsExpired(false);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (!isExpired) {
      setIsRunning(true);
    }
  }, [isExpired]);

  const reset = useCallback(
    (newTime?: number) => {
      setTimeRemaining(newTime ?? initialTime);
      setIsRunning(false);
      setIsExpired(false);
    },
    [initialTime]
  );

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
  }, []);

  const totalTime = initialTime;
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;

  return {
    timeRemaining,
    totalTime,
    isRunning,
    isExpired,
    progress,
    start,
    pause,
    resume,
    reset,
    addTime,
  };
}
