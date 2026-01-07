import { useRef, useEffect, useCallback, useState } from 'react';
import { useFullscreen } from '../../hooks/useFullscreen';
import { usePresetStore } from '../../stores/presetStore';
import { useVisualizationStore } from '../../stores/visualizationStore';
import { VisualizationCanvas } from '../shared/VisualizationCanvas';
import { DEFAULT_PARAMS } from '../../types';
import type { Sequence, VisualizationParams } from '../../types';

interface FullscreenPlayerProps {
  sequence: Sequence;
  onExit: () => void;
}

// Easing function for smoother crossfade
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function FullscreenPlayer({ sequence, onExit }: FullscreenPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(containerRef);
  const { getPreset } = usePresetStore();
  const { setParams } = useVisualizationStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [debugPhase, setDebugPhase] = useState<'preset' | 'transitioning' | 'complete'>('preset');
  
  // Two-layer approach: layers never unmount, just swap visibility
  const [layerAParams, setLayerAParams] = useState<VisualizationParams>(DEFAULT_PARAMS);
  const [layerBParams, setLayerBParams] = useState<VisualizationParams>(DEFAULT_PARAMS);
  const [layerAOpacity, setLayerAOpacity] = useState(1);
  const [layerBOpacity, setLayerBOpacity] = useState(0);
  // Track which layer is currently "front" (the one fading in during transition)
  const activeLayerRef = useRef<'A' | 'B'>('A');
  const isTransitioningRef = useRef(false);
  // Track last set opacity to avoid unnecessary state updates
  const lastOpacityRef = useRef({ a: 1, b: 0 });
  
  const hideControlsTimerRef = useRef<number | null>(null);

  // Enter fullscreen on mount
  useEffect(() => {
    enterFullscreen();
    const timer = setTimeout(() => {
      setHasEnteredFullscreen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [enterFullscreen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        exitFullscreen();
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitFullscreen, onExit]);

  // Watch for fullscreen exit
  useEffect(() => {
    if (!hasEnteredFullscreen) return;
    if (!isFullscreen) {
      const timer = setTimeout(() => {
        if (!document.fullscreenElement) {
          onExit();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, onExit, hasEnteredFullscreen]);

  // Initialize first preset
  useEffect(() => {
    if (sequence.presetIds.length > 0) {
      const firstPreset = getPreset(sequence.presetIds[0]);
      if (firstPreset) {
        setLayerAParams(firstPreset.params);
        setLayerBParams(firstPreset.params);
        setParams(firstPreset.params);
        setLayerAOpacity(1);
        setLayerBOpacity(0);
        activeLayerRef.current = 'A';
      }
    }
  }, [sequence, getPreset, setParams]);

  // Sequence playback logic
  useEffect(() => {
    if (isPaused || sequence.presetIds.length === 0) return;

    const presetDuration = sequence.presetDuration * 1000;
    const transitionDuration = sequence.transitionDuration * 1000;
    const totalDuration = presetDuration + transitionDuration;

    let animationFrame: number;
    let startTime = performance.now();
    isTransitioningRef.current = false;

    // Helper to set opacity only when changed (avoids unnecessary re-renders)
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
      const cycleTime = elapsed % totalDuration;

      if (cycleTime < presetDuration) {
        // Not transitioning - keep current opacities stable
        if (isTransitioningRef.current) {
          isTransitioningRef.current = false;
        }
        setDebugPhase('preset');
        // Active layer stays at 1, inactive at 0 - only set once
        if (activeLayerRef.current === 'A') {
          setOpacities(1, 0);
        } else {
          setOpacities(0, 1);
        }
      } else {
        // Transitioning
        setDebugPhase('transitioning');
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          
          // Set up the next preset on the INACTIVE layer
          const nextIndex = (currentIndex + 1) % sequence.presetIds.length;
          const nextPreset = getPreset(sequence.presetIds[nextIndex]);
          if (nextPreset) {
            // Put next preset on the inactive layer
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
        
        // Crossfade: active fades out, inactive fades in
        if (activeLayerRef.current === 'A') {
          setOpacities(1 - progress, progress);
        } else {
          setOpacities(progress, 1 - progress);
        }
      }

      // Check if we should move to next preset
      if (elapsed >= totalDuration) {
        setDebugPhase('complete');
        const nextIndex = (currentIndex + 1) % sequence.presetIds.length;
        
        if (nextIndex === 0 && !sequence.looping) {
          exitFullscreen();
          onExit();
          return;
        }

        // Swap which layer is active (the one that just faded in is now active)
        activeLayerRef.current = activeLayerRef.current === 'A' ? 'B' : 'A';
        
        // Update the store params
        const nextPreset = getPreset(sequence.presetIds[nextIndex]);
        if (nextPreset) {
          setParams(nextPreset.params);
        }
        
        setCurrentIndex(nextIndex);
        startTime = currentTime;
        isTransitioningRef.current = false;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [currentIndex, sequence, isPaused, getPreset, setParams, exitFullscreen, onExit]);

  const handleMouseMove = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    setShowControls(true);
    hideControlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  const handleSkipNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % sequence.presetIds.length;
    const nextPreset = getPreset(sequence.presetIds[nextIndex]);
    if (nextPreset) {
      // Set both layers to the same preset for instant switch
      setLayerAParams(nextPreset.params);
      setLayerBParams(nextPreset.params);
      setParams(nextPreset.params);
      setLayerAOpacity(1);
      setLayerBOpacity(0);
      activeLayerRef.current = 'A';
    }
    setCurrentIndex(nextIndex);
  }, [currentIndex, sequence, getPreset, setParams]);

  const handleSkipPrev = useCallback(() => {
    const prevIndex = currentIndex === 0 ? sequence.presetIds.length - 1 : currentIndex - 1;
    const prevPreset = getPreset(sequence.presetIds[prevIndex]);
    if (prevPreset) {
      setLayerAParams(prevPreset.params);
      setLayerBParams(prevPreset.params);
      setParams(prevPreset.params);
      setLayerAOpacity(1);
      setLayerBOpacity(0);
      activeLayerRef.current = 'A';
    }
    setCurrentIndex(prevIndex);
  }, [currentIndex, sequence, getPreset, setParams]);

  // For progress bar display
  const transitionProgress = (() => {
    if (!isTransitioningRef.current) return 0;
    // Calculate based on current opacity
    if (activeLayerRef.current === 'A') {
      return layerBOpacity;
    } else {
      return layerAOpacity;
    }
  })();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Layer A - hidden when opacity is very low */}
      <div 
        className="absolute inset-0"
        style={{ 
          opacity: layerAOpacity,
          visibility: layerAOpacity < 0.01 ? 'hidden' : 'visible',
          transform: layerAOpacity < 0.01 ? 'translateX(-9999px)' : 'none',
          pointerEvents: layerAOpacity < 0.5 ? 'none' : 'auto'
        }}
      >
        <VisualizationCanvas params={layerAParams} className="w-full h-full" />
      </div>

      {/* Layer B - hidden when opacity is very low */}
      <div 
        className="absolute inset-0"
        style={{ 
          opacity: layerBOpacity,
          visibility: layerBOpacity < 0.01 ? 'hidden' : 'visible',
          transform: layerBOpacity < 0.01 ? 'translateX(-9999px)' : 'none',
          pointerEvents: layerBOpacity < 0.5 ? 'none' : 'auto'
        }}
      >
        <VisualizationCanvas params={layerBParams} className="w-full h-full" />
      </div>

      {/* Debug label */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded z-20">
        {debugPhase === 'preset' && 'Preset Phase'}
        {debugPhase === 'transitioning' && 'Transition Phase'}
        {debugPhase === 'complete' && 'Transition Complete'}
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent
          transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="max-w-lg mx-auto flex items-center justify-center gap-4">
          <button
            onClick={handleSkipPrev}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            ⏮️
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-4 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={handleSkipNext}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            ⏭️
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 max-w-lg mx-auto">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>
              {getPreset(sequence.presetIds[currentIndex])?.name || 'Unknown'}
            </span>
            <span>
              {currentIndex + 1} / {sequence.presetIds.length}
            </span>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 transition-all duration-100"
              style={{
                width: `${((currentIndex + transitionProgress) / sequence.presetIds.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="text-center mt-3 text-xs text-white/40">
          Press ESC to exit
        </div>
      </div>
    </div>
  );
}
