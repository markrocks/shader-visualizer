import { useEffect, useRef, useState } from 'react';
import { useFullscreen } from '../../hooks/useFullscreen';
import { LiveView } from '../shared/LiveView';
import { usePerformStore } from '../../stores/performStore';
import { usePresetStore } from '../../stores/presetStore';
import { useVisualizationStore } from '../../stores/visualizationStore';

interface LivePerformerProps {
  onExit: () => void;
}

/**
 * Fullscreen live output driven by MIDI/keyboard. Unlike the sequence
 * player it follows the live params, so every knob move shows up here.
 */
export function LivePerformer({ onExit }: LivePerformerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(containerRef);
  const [hudVisible, setHudVisible] = useState(true);
  const hudTimer = useRef<number | undefined>(undefined);
  const enteredRef = useRef(false);

  const bpm = usePerformStore((s) => s.bpm);
  const activePresetIndex = usePerformStore((s) => s.activePresetIndex);
  const presetName = usePresetStore((s) => (activePresetIndex !== null ? s.presets[activePresetIndex]?.name : undefined));
  const effectType = useVisualizationStore((s) => s.params.effectType);

  useEffect(() => {
    enterFullscreen().then(() => {
      enteredRef.current = true;
    });
  }, [enterFullscreen]);

  // Leaving browser fullscreen (ESC) ends live mode
  useEffect(() => {
    if (enteredRef.current && !isFullscreen) onExit();
  }, [isFullscreen, onExit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFullscreen();
        onExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exitFullscreen, onExit]);

  const pokeHud = () => {
    setHudVisible(true);
    window.clearTimeout(hudTimer.current);
    hudTimer.current = window.setTimeout(() => setHudVisible(false), 2500);
  };

  useEffect(() => {
    hudTimer.current = window.setTimeout(() => setHudVisible(false), 2500);
    return () => window.clearTimeout(hudTimer.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black"
      style={{ cursor: hudVisible ? 'default' : 'none' }}
      onMouseMove={pokeHud}
    >
      <LiveView />
      <div
        className={`absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white/80 pointer-events-none
          transition-opacity duration-300 z-10 ${hudVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
          🔴 LIVE · {presetName ?? effectType} · {Math.round(bpm)} bpm
        </span>
        <span className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">ESC to exit</span>
      </div>
    </div>
  );
}
