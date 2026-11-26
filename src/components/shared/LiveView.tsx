import { useEffect, useRef, useState } from 'react';
import { useVisualizationStore } from '../../stores/visualizationStore';
import { usePerformStore } from '../../stores/performStore';
import { VisualizationCanvas } from './VisualizationCanvas';
import type { VisualizationParams } from '../../types';

type Layer = 'A' | 'B';

interface FadeState {
  layer: Layer;
  params: VisualizationParams;
  /** false for the first frame (opacity 1), then true so the CSS transition runs to 0. */
  running: boolean;
}

/**
 * The live output: whatever is in the visualization store, with a crossfade
 * when a preset is launched and the momentary FX (strobe/blackout/invert)
 * layered on top. Used by the editor preview and the fullscreen Live mode.
 *
 * Two canvases stay mounted so a launch never has to compile a new WebGL
 * context mid-set; the idle one is paused.
 */
export function LiveView({ className = '' }: { className?: string }) {
  const params = useVisualizationStore((s) => s.params);
  const launchId = usePerformStore((s) => s.launchId);
  const crossfadeSeconds = usePerformStore((s) => s.crossfadeSeconds);
  const strobe = usePerformStore((s) => s.strobe);
  const blackout = usePerformStore((s) => s.blackout);
  const invert = usePerformStore((s) => s.invert);
  const bpm = usePerformStore((s) => s.bpm);

  const [active, setActive] = useState<Layer>('A');
  const [fade, setFade] = useState<FadeState | null>(null);
  const lastLaunchRef = useRef(launchId);
  const fadeTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (launchId === lastLaunchRef.current) return;
    lastLaunchRef.current = launchId;
    const outgoing = usePerformStore.getState().outgoingParams;
    window.clearTimeout(fadeTimerRef.current);

    if (!outgoing || crossfadeSeconds <= 0) {
      setFade(null);
      return;
    }

    // The current layer freezes on the old look and fades out on top;
    // the other layer takes over the live params underneath.
    setFade({ layer: active, params: outgoing, running: false });
    setActive(active === 'A' ? 'B' : 'A');
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setFade((f) => (f ? { ...f, running: true } : f)))
    );
    fadeTimerRef.current = window.setTimeout(() => setFade(null), crossfadeSeconds * 1000 + 50);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new launches
  }, [launchId]);

  useEffect(() => () => window.clearTimeout(fadeTimerRef.current), []);

  const renderLayer = (layer: Layer) => {
    const isActive = layer === active;
    const isFading = fade?.layer === layer;
    const visible = isActive || isFading;
    return (
      <div
        key={layer}
        className="absolute inset-0"
        style={{
          zIndex: isFading ? 2 : 1,
          opacity: isFading ? (fade.running ? 0 : 1) : visible ? 1 : 0,
          transition: isFading ? `opacity ${crossfadeSeconds}s ease-in-out` : undefined,
          visibility: visible ? 'visible' : 'hidden',
        }}
      >
        <VisualizationCanvas params={isFading ? fade.params : params} paused={!visible} />
      </div>
    );
  };

  const strobePeriod = 60 / Math.max(bpm, 1) / 2; // eighth notes

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black ${className}`} style={{ filter: invert ? 'invert(1)' : undefined }}>
      {renderLayer('A')}
      {renderLayer('B')}
      {strobe && (
        <div
          className="absolute inset-0 bg-white pointer-events-none"
          style={{ zIndex: 3, animation: `vj-strobe ${strobePeriod}s steps(1, end) infinite` }}
        />
      )}
      {blackout && <div className="absolute inset-0 bg-black pointer-events-none" style={{ zIndex: 4 }} />}
    </div>
  );
}
