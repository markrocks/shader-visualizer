import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { MidiMapping, MidiTarget } from '../midi/types';
import { defaultPadMappings, upsertMapping } from '../midi/mapping';

export type MidiAccessStatus = 'idle' | 'requesting' | 'ready' | 'unsupported' | 'denied';

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

export interface MonitorEntry {
  id: number;
  time: number;
  text: string;
  deviceName: string;
}

const MONITOR_LIMIT = 16;
let monitorSeq = 0;

interface MidiState {
  status: MidiAccessStatus;
  devices: MidiDevice[];
  /** 'all' listens to every connected input. */
  selectedInputId: string;
  monitor: MonitorEntry[];
  mappings: MidiMapping[];
  learnMode: boolean;
  learnTarget: MidiTarget | null;
  /** Id of the mapping that fired last, for a brief highlight in the UI. */
  lastFiredMappingId: string | null;

  setStatus: (status: MidiAccessStatus) => void;
  setDevices: (devices: MidiDevice[]) => void;
  setSelectedInputId: (id: string) => void;
  pushMonitor: (text: string, deviceName: string) => void;
  clearMonitor: () => void;
  setLearnMode: (on: boolean) => void;
  setLearnTarget: (target: MidiTarget | null) => void;
  addLearnedMapping: (mapping: Omit<MidiMapping, 'id'>) => void;
  removeMapping: (id: string) => void;
  clearMappings: () => void;
  loadDefaultPads: () => void;
  setLastFired: (id: string | null) => void;
}

export const useMidiStore = create<MidiState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      devices: [],
      selectedInputId: 'all',
      monitor: [],
      mappings: defaultPadMappings(uuidv4),
      learnMode: false,
      learnTarget: null,
      lastFiredMappingId: null,

      setStatus: (status) => set({ status }),
      setDevices: (devices) => set({ devices }),
      setSelectedInputId: (selectedInputId) => set({ selectedInputId }),
      pushMonitor: (text, deviceName) =>
        set((s) => ({
          monitor: [{ id: ++monitorSeq, time: Date.now(), text, deviceName }, ...s.monitor].slice(0, MONITOR_LIMIT),
        })),
      clearMonitor: () => set({ monitor: [] }),
      setLearnMode: (learnMode) => set({ learnMode, learnTarget: learnMode ? get().learnTarget : null }),
      setLearnTarget: (learnTarget) => set({ learnTarget }),
      addLearnedMapping: (mapping) =>
        set((s) => ({
          mappings: upsertMapping(s.mappings, { ...mapping, id: uuidv4() }),
          learnTarget: null,
        })),
      removeMapping: (id) => set((s) => ({ mappings: s.mappings.filter((m) => m.id !== id) })),
      clearMappings: () => set({ mappings: [] }),
      loadDefaultPads: () =>
        set((s) => {
          let next = s.mappings;
          for (const m of defaultPadMappings(uuidv4)) next = upsertMapping(next, m);
          return { mappings: next };
        }),
      setLastFired: (lastFiredMappingId) => set({ lastFiredMappingId }),
    }),
    {
      name: 'visualizer-midi',
      partialize: (s) => ({ mappings: s.mappings, selectedInputId: s.selectedInputId }),
    }
  )
);
