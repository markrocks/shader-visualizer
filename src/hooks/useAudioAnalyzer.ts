import { useCallback, useEffect, useRef } from 'react';
import { useAudioStore } from '../stores/audioStore';
import type { FrequencyBand } from '../types';

export function useAudioAnalyzer() {
  const {
    isActive,
    analyser,
    setAudioData,
    startMicrophone,
    stopMicrophone,
    loadAudioFile,
    initialize,
  } = useAudioStore();
  
  const animationFrameRef = useRef<number | undefined>(undefined);
  const frequencyDataRef = useRef<Uint8Array | undefined>(undefined);
  const waveformDataRef = useRef<Float32Array | undefined>(undefined);

  const getFrequencyValue = useCallback(
    (band: FrequencyBand, frequencies: Uint8Array): number => {
      const length = frequencies.length;
      let start: number, end: number;

      switch (band) {
        case 'bass':
          start = 0;
          end = Math.floor(length * 0.1);
          break;
        case 'mid':
          start = Math.floor(length * 0.1);
          end = Math.floor(length * 0.5);
          break;
        case 'treble':
          start = Math.floor(length * 0.5);
          end = length;
          break;
        case 'full':
        default:
          start = 0;
          end = length;
      }

      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += frequencies[i];
      }
      return sum / (end - start) / 255;
    },
    []
  );

  const analyze = useCallback(() => {
    if (!analyser || !isActive) return;

    if (!frequencyDataRef.current) {
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    if (!waveformDataRef.current) {
      waveformDataRef.current = new Float32Array(analyser.frequencyBinCount);
    }

    analyser.getByteFrequencyData(frequencyDataRef.current as Uint8Array<ArrayBuffer>);
    analyser.getFloatTimeDomainData(waveformDataRef.current as Float32Array<ArrayBuffer>);

    const frequencies = frequencyDataRef.current;
    const waveform = waveformDataRef.current;

    // Copy data to new arrays with explicit ArrayBuffer type
    const freqCopy = new Uint8Array(frequencies.length);
    freqCopy.set(frequencies);
    const waveformCopy = new Float32Array(waveform.length);
    waveformCopy.set(waveform);

    setAudioData({
      bass: getFrequencyValue('bass', frequencies),
      mid: getFrequencyValue('mid', frequencies),
      treble: getFrequencyValue('treble', frequencies),
      full: getFrequencyValue('full', frequencies),
      frequencies: freqCopy,
      waveform: waveformCopy,
    });

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [analyser, isActive, setAudioData, getFrequencyValue]);

  useEffect(() => {
    if (isActive && analyser) {
      analyze();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, analyser, analyze]);

  return {
    isActive,
    startMicrophone,
    stopMicrophone,
    loadAudioFile,
    initialize,
  };
}
