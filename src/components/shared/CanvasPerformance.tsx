import { useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { usePerfStore } from '../../stores/perfStore';
import { useSettingsStore } from '../../stores/settingsStore';

interface AutoQualityProps {
  range: [number, number];
  onDpr: (dpr: number) => void;
}

// Auto quality: watches the frame rate and moves the pixel ratio within
// `range`, starting at the top and stepping down when frames run slow.
// Must render inside the Canvas.
export function AutoQuality({ range, onDpr }: AutoQualityProps) {
  const [min, max] = range;
  return (
    <PerformanceMonitor
      factor={1}
      step={0.1}
      // Step down below 75% of the display's refresh rate, back up above 95%
      bounds={(refreshRate) => [refreshRate * 0.75, refreshRate * 0.95]}
      // Settle at the lowest setting if it keeps flip-flopping
      flipflops={6}
      onChange={({ factor }) => onDpr(Math.round((min + (max - min) * factor) * 20) / 20)}
      onFallback={() => onDpr(min)}
    />
  );
}

const SAMPLE_MS = 500;
const HISTORY_LENGTH = 60;

// Measures frame rate and frame times and publishes them twice a second for
// PerformanceOverlay. Must render inside the Canvas.
export function PerformanceProbe({ renderScaleRef }: { renderScaleRef: RefObject<number> }) {
  const gl = useThree((state) => state.gl);
  const enabled = useSettingsStore((state) => state.showPerformance);
  // Times start at 0 and are set on the first frame (no clock reads during render)
  const sample = useRef({ start: 0, last: 0, frames: 0, worst: 0 });
  const history = useRef<number[]>([]);

  useFrame(() => {
    if (!enabled) return;
    const now = performance.now();
    const s = sample.current;
    if (s.start === 0) {
      s.start = now;
      s.last = now;
      return;
    }
    s.frames += 1;
    s.worst = Math.max(s.worst, now - s.last);
    s.last = now;

    const elapsed = now - s.start;
    if (elapsed < SAMPLE_MS) return;

    const fps = (s.frames * 1000) / elapsed;
    history.current = [...history.current, fps].slice(-HISTORY_LENGTH);
    usePerfStore.getState().setStats({
      fps,
      frameMs: elapsed / s.frames,
      worstMs: s.worst,
      dpr: gl.getPixelRatio(),
      width: gl.domElement.width,
      height: gl.domElement.height,
      renderScale: renderScaleRef.current,
      programs: gl.info.programs?.length ?? 0,
      history: history.current,
    });
    s.start = now;
    s.frames = 0;
    s.worst = 0;
  });

  return null;
}
