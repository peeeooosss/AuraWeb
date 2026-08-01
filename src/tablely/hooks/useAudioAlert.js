import { useState, useEffect, useRef, useCallback } from "react";

const MUTED_KEY = "tablely-alerts-muted";

export function useAudioAlert() {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const audioCtxRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(MUTED_KEY, String(isMuted));
    } catch {
      // localStorage not available
    }
  }, [isMuted]);

  const play = useCallback(() => {
    if (isMuted) return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create a professional "ding" tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      // Second ding for a pleasant double-chime
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1100, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
          gain2.gain.setValueAtTime(0.4, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.25);
        } catch {
          // ignore
        }
      }, 150);
    } catch {
      // Web Audio API not supported
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return { play, isMuted, toggleMute };
}
