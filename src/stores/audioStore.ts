import { create } from 'zustand';
import type { AudioData, AudioSource } from '../types';

interface AudioState {
  isInitialized: boolean;
  isActive: boolean;
  audioSource: AudioSource;
  audioData: AudioData;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  mediaStream: MediaStream | null;
  audioElement: HTMLAudioElement | null;
  setIsActive: (active: boolean) => void;
  setAudioSource: (source: AudioSource) => void;
  setAudioData: (data: Partial<AudioData>) => void;
  initialize: () => Promise<void>;
  startMicrophone: () => Promise<void>;
  stopMicrophone: () => void;
  loadAudioFile: (file: File) => Promise<void>;
  cleanup: () => void;
}

const defaultAudioData: AudioData = {
  bass: 0,
  mid: 0,
  treble: 0,
  full: 0,
  waveform: new Float32Array(256),
  frequencies: new Uint8Array(256),
};

export const useAudioStore = create<AudioState>((set, get) => ({
  isInitialized: false,
  isActive: false,
  audioSource: 'microphone',
  audioData: defaultAudioData,
  audioContext: null,
  analyser: null,
  mediaStream: null,
  audioElement: null,

  setIsActive: (isActive) => set({ isActive }),
  setAudioSource: (audioSource) => set({ audioSource }),
  setAudioData: (data) =>
    set((state) => ({ audioData: { ...state.audioData, ...data } })),

  initialize: async () => {
    const state = get();
    if (state.isInitialized) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;

    set({ audioContext, analyser, isInitialized: true });
  },

  startMicrophone: async () => {
    const state = get();
    if (!state.audioContext || !state.analyser) {
      await get().initialize();
    }

    const { audioContext, analyser } = get();
    if (!audioContext || !analyser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      set({ mediaStream: stream, isActive: true, audioSource: 'microphone' });
    } catch (error) {
      console.error('Failed to start microphone:', error);
    }
  },

  stopMicrophone: () => {
    const { mediaStream } = get();
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      set({ mediaStream: null, isActive: false });
    }
  },

  loadAudioFile: async (file: File) => {
    const state = get();
    if (!state.audioContext || !state.analyser) {
      await get().initialize();
    }

    const { audioContext, analyser } = get();
    if (!audioContext || !analyser) return;

    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    audioElement.loop = true;

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    set({ audioElement, isActive: true, audioSource: 'file' });
  },

  cleanup: () => {
    const { audioContext, mediaStream, audioElement } = get();

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    if (audioContext) {
      audioContext.close();
    }

    set({
      isInitialized: false,
      isActive: false,
      audioContext: null,
      analyser: null,
      mediaStream: null,
      audioElement: null,
      audioData: defaultAudioData,
    });
  },
}));
