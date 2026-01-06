import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Preset, Sequence, VisualizationParams } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  savePresetsToFolder, 
  saveSequencesToFolder,
  loadPresetsFromFolder,
  loadSequencesFromFolder 
} from '../utils/fileStorage';
import { useSettingsStore } from './settingsStore';

interface PresetState {
  presets: Preset[];
  sequences: Sequence[];
  activeSequenceId: string | null;
  isLoading: boolean;
  lastSyncError: string | null;
  addPreset: (name: string, params: VisualizationParams) => Promise<Preset>;
  updatePreset: (id: string, updates: Partial<Preset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  getPreset: (id: string) => Preset | undefined;
  addSequence: (name: string) => Promise<Sequence>;
  updateSequence: (id: string, updates: Partial<Sequence>) => Promise<void>;
  deleteSequence: (id: string) => Promise<void>;
  getSequence: (id: string) => Sequence | undefined;
  setActiveSequence: (id: string | null) => void;
  addPresetToSequence: (sequenceId: string, presetId: string) => Promise<void>;
  removePresetFromSequence: (sequenceId: string, presetIndex: number) => Promise<void>;
  reorderSequencePresets: (sequenceId: string, fromIndex: number, toIndex: number) => Promise<void>;
  loadFromFolder: (handle: FileSystemDirectoryHandle) => Promise<void>;
  syncToFolder: () => Promise<void>;
  setPresets: (presets: Preset[]) => void;
  setSequences: (sequences: Sequence[]) => void;
}

// Helper to get directory handle from settings store
const getDirectoryHandle = (): FileSystemDirectoryHandle | null => {
  return useSettingsStore.getState().directoryHandle;
};

// Helper to save presets to folder if available
const syncPresetsToFolder = async (presets: Preset[]): Promise<void> => {
  const handle = getDirectoryHandle();
  if (handle) {
    try {
      await savePresetsToFolder(handle, presets);
    } catch (error) {
      console.error('Failed to sync presets to folder:', error);
    }
  }
};

// Helper to save sequences to folder if available
const syncSequencesToFolder = async (sequences: Sequence[]): Promise<void> => {
  const handle = getDirectoryHandle();
  if (handle) {
    try {
      await saveSequencesToFolder(handle, sequences);
    } catch (error) {
      console.error('Failed to sync sequences to folder:', error);
    }
  }
};

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      sequences: [],
      activeSequenceId: null,
      isLoading: false,
      lastSyncError: null,

      addPreset: async (name, params) => {
        const preset: Preset = {
          id: uuidv4(),
          name,
          params,
          createdAt: Date.now(),
        };
        const newPresets = [...get().presets, preset];
        set({ presets: newPresets, lastSyncError: null });
        await syncPresetsToFolder(newPresets);
        return preset;
      },

      updatePreset: async (id, updates) => {
        const newPresets = get().presets.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        set({ presets: newPresets, lastSyncError: null });
        await syncPresetsToFolder(newPresets);
      },

      deletePreset: async (id) => {
        const newPresets = get().presets.filter((p) => p.id !== id);
        const newSequences = get().sequences.map((s) => ({
          ...s,
          presetIds: s.presetIds.filter((pid) => pid !== id),
        }));
        set({ presets: newPresets, sequences: newSequences, lastSyncError: null });
        await Promise.all([
          syncPresetsToFolder(newPresets),
          syncSequencesToFolder(newSequences),
        ]);
      },

      getPreset: (id) => get().presets.find((p) => p.id === id),

      addSequence: async (name) => {
        const sequence: Sequence = {
          id: uuidv4(),
          name,
          presetIds: [],
          transitionDuration: 2,
          presetDuration: 10,
          looping: true,
        };
        const newSequences = [...get().sequences, sequence];
        set({ sequences: newSequences, lastSyncError: null });
        await syncSequencesToFolder(newSequences);
        return sequence;
      },

      updateSequence: async (id, updates) => {
        const newSequences = get().sequences.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        );
        set({ sequences: newSequences, lastSyncError: null });
        await syncSequencesToFolder(newSequences);
      },

      deleteSequence: async (id) => {
        const newSequences = get().sequences.filter((s) => s.id !== id);
        set({
          sequences: newSequences,
          activeSequenceId: get().activeSequenceId === id ? null : get().activeSequenceId,
          lastSyncError: null,
        });
        await syncSequencesToFolder(newSequences);
      },

      getSequence: (id) => get().sequences.find((s) => s.id === id),

      setActiveSequence: (id) => set({ activeSequenceId: id }),

      addPresetToSequence: async (sequenceId, presetId) => {
        const newSequences = get().sequences.map((s) =>
          s.id === sequenceId
            ? { ...s, presetIds: [...s.presetIds, presetId] }
            : s
        );
        set({ sequences: newSequences, lastSyncError: null });
        await syncSequencesToFolder(newSequences);
      },

      removePresetFromSequence: async (sequenceId, presetIndex) => {
        const newSequences = get().sequences.map((s) =>
          s.id === sequenceId
            ? {
                ...s,
                presetIds: s.presetIds.filter((_, i) => i !== presetIndex),
              }
            : s
        );
        set({ sequences: newSequences, lastSyncError: null });
        await syncSequencesToFolder(newSequences);
      },

      reorderSequencePresets: async (sequenceId, fromIndex, toIndex) => {
        const newSequences = get().sequences.map((s) => {
          if (s.id !== sequenceId) return s;
          const newPresetIds = [...s.presetIds];
          const [removed] = newPresetIds.splice(fromIndex, 1);
          newPresetIds.splice(toIndex, 0, removed);
          return { ...s, presetIds: newPresetIds };
        });
        set({ sequences: newSequences, lastSyncError: null });
        await syncSequencesToFolder(newSequences);
      },

      loadFromFolder: async (handle) => {
        set({ isLoading: true, lastSyncError: null });
        try {
          const [presets, sequences] = await Promise.all([
            loadPresetsFromFolder(handle),
            loadSequencesFromFolder(handle),
          ]);
          set({ presets, sequences, isLoading: false });
        } catch (error) {
          set({ 
            isLoading: false, 
            lastSyncError: (error as Error).message 
          });
          throw error;
        }
      },

      syncToFolder: async () => {
        const handle = getDirectoryHandle();
        if (!handle) return;
        
        set({ lastSyncError: null });
        try {
          await Promise.all([
            syncPresetsToFolder(get().presets),
            syncSequencesToFolder(get().sequences),
          ]);
        } catch (error) {
          set({ lastSyncError: (error as Error).message });
          throw error;
        }
      },

      setPresets: (presets) => set({ presets }),
      setSequences: (sequences) => set({ sequences }),
    }),
    {
      name: 'visualizer-presets',
      // Only persist to localStorage as backup
      partialize: (state) => ({
        presets: state.presets,
        sequences: state.sequences,
        activeSequenceId: state.activeSequenceId,
      }),
    }
  )
);
