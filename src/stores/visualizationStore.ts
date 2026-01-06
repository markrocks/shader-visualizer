import { create } from 'zustand';
import { DEFAULT_PARAMS } from '../types';
import type { VisualizationParams, AppMode } from '../types';

interface VisualizationState {
  params: VisualizationParams;
  mode: AppMode;
  isPlaying: boolean;
  currentPresetIndex: number;
  setParams: (params: Partial<VisualizationParams>) => void;
  setMode: (mode: AppMode) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentPresetIndex: (index: number) => void;
  resetParams: () => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  params: DEFAULT_PARAMS,
  mode: 'config',
  isPlaying: false,
  currentPresetIndex: 0,
  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),
  setMode: (mode) => set({ mode }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentPresetIndex: (currentPresetIndex) => set({ currentPresetIndex }),
  resetParams: () => set({ params: DEFAULT_PARAMS }),
}));
