import { useState, useEffect, useRef } from 'react';
import { useVisualizationStore } from '../../stores/visualizationStore';
import { usePresetStore } from '../../stores/presetStore';
import { VisualizationCanvas } from '../shared/VisualizationCanvas';
import { DEFAULT_PARAMS } from '../../types';
import type { Sequence, VisualizationParams } from '../../types';

interface PreviewCanvasProps {
  previewingSequence?: Sequence | null;
}

// Easing function for smoother crossfade
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function PreviewCanvas({ previewingSequence }: PreviewCanvasProps) {
  const params = useVisualizationStore((state) => state.params);
  const { getPreset } = usePresetStore();

  // Sequence playback state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [layerAParams, setLayerAParams] = useState<VisualizationParams>(DEFAULT_PARAMS);
  const [layerBParams, setLayerBParams] = useState<VisualizationParams>(DEFAULT_PARAMS);
  const [layerAOpacity, setLayerAOpacity] = useState(1);
  const [layerBOpacity, setLayerBOpacity] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  
  const activeLayerRef = useRef<'A' | 'B'>('A');
  const isTransitioningRef = useRef(false);
  const lastOpacityRef = useRef({ a: 1, b: 0 });

  // Initialize sequence when it changes
  useEffect(() => {
    if (previewingSequence && previewingSequence.presetIds.length > 0) {
      const firstPreset = getPreset(previewingSequence.presetIds[0]);
      if (firstPreset) {
        setLayerAParams(firstPreset.params);
        setLayerBParams(firstPreset.params);
        setLayerAOpacity(1);
        setLayerBOpacity(0);
        activeLayerRef.current = 'A';
        setCurrentIndex(0);
        setIsPlayingSequence(true);
        lastOpacityRef.current = { a: 1, b: 0 };
      }
    } else {
      setIsPlayingSequence(false);
    }
  }, [previewingSequence, getPreset]);

  // Sequence playback animation loop
  useEffect(() => {
    if (!isPlayingSequence || !previewingSequence || previewingSequence.presetIds.length === 0) {
      return;
    }

    const presetDuration = previewingSequence.presetDuration * 1000;
    const transitionDuration = previewingSequence.transitionDuration * 1000;
    const totalDuration = presetDuration + transitionDuration;

    let animationFrame: number;
    let startTime = performance.now();
    isTransitioningRef.current = false;

    const setOpacities = (a: number, b: number) => {
      if (Math.abs(lastOpacityRef.current.a - a) > 0.001) {
        lastOpacityRef.current.a = a;
        setLayerAOpacity(a);
      }
      if (Math.abs(lastOpacityRef.current.b - b) > 0.001) {
        lastOpacityRef.current.b = b;
        setLayerBOpacity(b);
      }
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      // Check for transition complete FIRST
      if (elapsed >= totalDuration) {
        // Set final opacities
        if (activeLayerRef.current === 'A') {
          setOpacities(0, 1);
        } else {
          setOpacities(1, 0);
        }

        const nextIndex = (currentIndex + 1) % previewingSequence.presetIds.length;
        
        if (nextIndex === 0 && !previewingSequence.looping) {
          // Sequence ended, stay on last preset
          return;
        }

        // Swap active layer
        activeLayerRef.current = activeLayerRef.current === 'A' ? 'B' : 'A';
        setCurrentIndex(nextIndex);
        startTime = currentTime;
        isTransitioningRef.current = false;
        
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const cycleTime = elapsed % totalDuration;

      if (cycleTime < presetDuration) {
        // Preset phase
        if (isTransitioningRef.current) {
          isTransitioningRef.current = false;
        }
        if (activeLayerRef.current === 'A') {
          setOpacities(1, 0);
        } else {
          setOpacities(0, 1);
        }
      } else {
        // Transition phase
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          
          const nextIndex = (currentIndex + 1) % previewingSequence.presetIds.length;
          const nextPreset = getPreset(previewingSequence.presetIds[nextIndex]);
          if (nextPreset) {
            if (activeLayerRef.current === 'A') {
              setLayerBParams(nextPreset.params);
            } else {
              setLayerAParams(nextPreset.params);
            }
          }
        }
        
        const transitionElapsed = cycleTime - presetDuration;
        const rawProgress = Math.min(transitionElapsed / transitionDuration, 1);
        const progress = easeInOutCubic(rawProgress);
        
        if (activeLayerRef.current === 'A') {
          setOpacities(1 - progress, progress);
        } else {
          setOpacities(progress, 1 - progress);
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [currentIndex, previewingSequence, isPlayingSequence, getPreset]);

  // Get current preset name for display
  const currentPresetName = previewingSequence && previewingSequence.presetIds.length > 0
    ? getPreset(previewingSequence.presetIds[currentIndex])?.name || 'Unknown'
    : null;

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-[var(--border-color)]">
      {isPlayingSequence ? (
        <>
          {/* Layer A */}
          <div 
            className="absolute inset-0"
            style={{ 
              opacity: layerAOpacity,
              visibility: layerAOpacity < 0.01 ? 'hidden' : 'visible',
            }}
          >
            <VisualizationCanvas params={layerAParams} className="w-full h-full" />
          </div>
          {/* Layer B */}
          <div 
            className="absolute inset-0"
            style={{ 
              opacity: layerBOpacity,
              visibility: layerBOpacity < 0.01 ? 'hidden' : 'visible',
            }}
          >
            <VisualizationCanvas params={layerBParams} className="w-full h-full" />
          </div>
        </>
      ) : (
        <VisualizationCanvas params={params} />
      )}
      
      {/* Label */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm
        text-xs text-white/70 font-medium pointer-events-none">
        {isPlayingSequence && previewingSequence ? (
          <span>
            🎬 {previewingSequence.name} • {currentPresetName} ({currentIndex + 1}/{previewingSequence.presetIds.length})
          </span>
        ) : (
          'Preview'
        )}
      </div>
    </div>
  );
}
