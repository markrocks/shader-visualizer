import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Preset, Sequence, VisualizationParams } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface PresetState {
  presets: Preset[];
  sequences: Sequence[];
  activeSequenceId: string | null;
  addPreset: (name: string, params: VisualizationParams) => Preset;
  updatePreset: (id: string, updates: Partial<Preset>) => void;
  deletePreset: (id: string) => void;
  getPreset: (id: string) => Preset | undefined;
  addSequence: (name: string) => Sequence;
  updateSequence: (id: string, updates: Partial<Sequence>) => void;
  deleteSequence: (id: string) => void;
  getSequence: (id: string) => Sequence | undefined;
  setActiveSequence: (id: string | null) => void;
  addPresetToSequence: (sequenceId: string, presetId: string) => void;
  removePresetFromSequence: (sequenceId: string, presetIndex: number) => void;
  reorderSequencePresets: (sequenceId: string, fromIndex: number, toIndex: number) => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      sequences: [],
      activeSequenceId: null,

      addPreset: (name, params) => {
        const preset: Preset = {
          id: uuidv4(),
          name,
          params,
          createdAt: Date.now(),
        };
        set((state) => ({ presets: [...state.presets, preset] }));
        return preset;
      },

      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          sequences: state.sequences.map((s) => ({
            ...s,
            presetIds: s.presetIds.filter((pid) => pid !== id),
          })),
        })),

      getPreset: (id) => get().presets.find((p) => p.id === id),

      addSequence: (name) => {
        const sequence: Sequence = {
          id: uuidv4(),
          name,
          presetIds: [],
          transitionDuration: 2,
          presetDuration: 10,
          looping: true,
        };
        set((state) => ({ sequences: [...state.sequences, sequence] }));
        return sequence;
      },

      updateSequence: (id, updates) =>
        set((state) => ({
          sequences: state.sequences.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSequence: (id) =>
        set((state) => ({
          sequences: state.sequences.filter((s) => s.id !== id),
          activeSequenceId:
            state.activeSequenceId === id ? null : state.activeSequenceId,
        })),

      getSequence: (id) => get().sequences.find((s) => s.id === id),

      setActiveSequence: (id) => set({ activeSequenceId: id }),

      addPresetToSequence: (sequenceId, presetId) =>
        set((state) => ({
          sequences: state.sequences.map((s) =>
            s.id === sequenceId
              ? { ...s, presetIds: [...s.presetIds, presetId] }
              : s
          ),
        })),

      removePresetFromSequence: (sequenceId, presetIndex) =>
        set((state) => ({
          sequences: state.sequences.map((s) =>
            s.id === sequenceId
              ? {
                  ...s,
                  presetIds: s.presetIds.filter((_, i) => i !== presetIndex),
                }
              : s
          ),
        })),

      reorderSequencePresets: (sequenceId, fromIndex, toIndex) =>
        set((state) => ({
          sequences: state.sequences.map((s) => {
            if (s.id !== sequenceId) return s;
            const newPresetIds = [...s.presetIds];
            const [removed] = newPresetIds.splice(fromIndex, 1);
            newPresetIds.splice(toIndex, 0, removed);
            return { ...s, presetIds: newPresetIds };
          }),
        })),
    }),
    {
      name: 'visualizer-presets',
    }
  )
);
