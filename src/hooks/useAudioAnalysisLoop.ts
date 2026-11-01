import { useCallback, useEffect, useRef } from 'react';
import { useAudioStore } from '../stores/audioStore';
import type { FrequencyBand } from '../types';

// Reads the analyser every animation frame and publishes the levels to the
// audio store. Mounted once by App so audio keeps updating in every mode,
// including fullscreen playback (it used to live in the Audio panel, so it
// stopped whenever that panel unmounted).
export function useAudioAnalysisLoop() {
  const isActive = useAudioStore((state) => state.isActive);
  const analyser = useAudioStore((state) => state.analyser);
  const setAudioData = useAudioStore((state) => state.setAudioData);

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

  useEffect(() => {
    if (!isActive || !analyser) return;

    let frame = 0;
    const analyze = () => {
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

      frame = requestAnimationFrame(analyze);
    };
    analyze();

    return () => cancelAnimationFrame(frame);
  }, [isActive, analyser, setAudioData, getFrequencyValue]);

}
