import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VisualizationParams } from '../types';
import { bpmFromTaps } from '../midi/mapping';

interface PerformState {
  bpm: number;
  taps: number[];
  strobe: boolean;
  blackout: boolean;
  invert: boolean;
  /** Seconds for the crossfade when a preset is launched. */
  crossfadeSeconds: number;
  activePresetIndex: number | null;
  /** Increments on each preset launch so the live view knows to crossfade. */
  launchId: number;
  /** Params on screen just before the last launch (the layer that fades out). */
  outgoingParams: VisualizationParams | null;

  tap: (now?: number) => void;
  setBpm: (bpm: number) => void;
  setMomentary: (fx: 'strobe' | 'blackout' | 'invert', on: boolean) => void;
  setCrossfadeSeconds: (s: number) => void;
  markLaunch: (presetIndex: number, outgoing: VisualizationParams) => void;
}

const TAP_RESET_MS = 2000;
const MAX_TAPS = 8;

export const usePerformStore = create<PerformState>()(
  persist(
    (set, get) => ({
      bpm: 120,
      taps: [],
      strobe: false,
      blackout: false,
      invert: false,
      crossfadeSeconds: 1,
      activePresetIndex: null,
      launchId: 0,
      outgoingParams: null,

      tap: (now = performance.now()) => {
        const prev = get().taps;
        const last = prev[prev.length - 1];
        const taps = last !== undefined && now - last < TAP_RESET_MS ? [...prev, now].slice(-MAX_TAPS) : [now];
        const bpm = bpmFromTaps(taps);
        set(bpm ? { taps, bpm: Math.min(Math.max(bpm, 40), 300) } : { taps });
      },
      setBpm: (bpm) => set({ bpm }),
      setMomentary: (fx, on) => set({ [fx]: on } as Pick<PerformState, typeof fx>),
      setCrossfadeSeconds: (crossfadeSeconds) => set({ crossfadeSeconds }),
      markLaunch: (activePresetIndex, outgoingParams) =>
        set((s) => ({ activePresetIndex, outgoingParams, launchId: s.launchId + 1 })),
    }),
    {
      name: 'visualizer-perform',
      partialize: (s) => ({ bpm: s.bpm, crossfadeSeconds: s.crossfadeSeconds }),
    }
  )
);
