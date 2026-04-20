/* ════════════════════════════════════════════════════════════════════════
   useSoundEffects.ts — HTML5 Audio sound effects for Guess Who game
   
   Sound files must exist at public/sounds/:
     heart-lost.mp3, hint-unlock.mp3, danger-alert.mp3,
     success.mp3, game-over.mp3
   
   All plays are fire-and-forget. Errors are silently swallowed.
   ════════════════════════════════════════════════════════════════════════ */
'use client';

import { useCallback, useRef } from 'react';

function playAudio(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.6;
    void audio.play().catch(() => {/* file may not exist — silent fail */});
  } catch {
    // Audio API not available (e.g. SSR)
  }
}

export function useSoundEffects() {
  const dangerFiredRef = useRef(false);

  const playHeartLost = useCallback(() => {
    playAudio('/sounds/heart-lost.mp3');
  }, []);

  const playHintUnlock = useCallback(() => {
    playAudio('/sounds/hint-unlock.mp3');
  }, []);

  /** Only fires once per word (when hearts drop to ≤ 3 for the first time). */
  const playDangerAlert = useCallback((hearts: number) => {
    if (hearts <= 3 && !dangerFiredRef.current) {
      dangerFiredRef.current = true;
      playAudio('/sounds/danger-alert.mp3');
    }
  }, []);

  const resetDangerFlag = useCallback(() => {
    dangerFiredRef.current = false;
  }, []);

  const playSuccess = useCallback(() => {
    playAudio('/sounds/success.mp3');
  }, []);

  const playGameOver = useCallback(() => {
    playAudio('/sounds/game-over.mp3');
  }, []);

  return { playHeartLost, playHintUnlock, playDangerAlert, resetDangerFlag, playSuccess, playGameOver };
}
