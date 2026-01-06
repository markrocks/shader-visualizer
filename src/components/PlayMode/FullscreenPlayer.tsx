import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
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
  const [currentParams, setCurrentParams] = useState<VisualizationParams>(DEFAULT_PARAMS);
  const [nextParams, setNextParams] = useState<VisualizationParams | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const hideControlsTimerRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const nextParamsSetRef = useRef(false);

  // Enter fullscreen on mount
  useEffect(() => {
    enterFullscreen();
    // Mark that we've attempted to enter fullscreen
    const timer = setTimeout(() => {
      setHasEnteredFullscreen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [enterFullscreen]);

  // Handle ESC key manually (more reliable than the hook)
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

  // Watch for fullscreen exit - only after we've entered fullscreen
  useEffect(() => {
    if (!hasEnteredFullscreen) return;
    
    if (!isFullscreen) {
      // Small delay to check if we actually exited
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
        setCurrentParams(firstPreset.params);
        setParams(firstPreset.params);
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
    
    // Reset refs when effect starts
    isTransitioningRef.current = false;
    nextParamsSetRef.current = false;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const cycleTime = elapsed % totalDuration;

      if (cycleTime < presetDuration) {
        // Showing current preset (not transitioning)
        if (isTransitioningRef.current) {
          isTransitioningRef.current = false;
          nextParamsSetRef.current = false;
          setIsTransitioning(false);
          setNextParams(null);
        }
        setTransitionProgress(0);
      } else {
        // Transitioning to next
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          setIsTransitioning(true);
          
          // Prepare next preset params at the start of transition
          if (!nextParamsSetRef.current) {
            nextParamsSetRef.current = true;
            const nextIndex = (currentIndex + 1) % sequence.presetIds.length;
            const nextPreset = getPreset(sequence.presetIds[nextIndex]);
            if (nextPreset) {
              setNextParams(nextPreset.params);
            }
          }
        }
        
        const transitionElapsed = cycleTime - presetDuration;
        const progress = Math.min(transitionElapsed / transitionDuration, 1);
        setTransitionProgress(progress);
      }

      // Check if we should move to next preset
      if (elapsed >= totalDuration) {
        const nextIndex = (currentIndex + 1) % sequence.presetIds.length;
        
        if (nextIndex === 0 && !sequence.looping) {
          // End of non-looping sequence
          exitFullscreen();
          onExit();
          return;
        }

        // IMPORTANT: Update current params FIRST before clearing transition
        // This prevents the old preset from flashing at full opacity
        const nextPreset = getPreset(sequence.presetIds[nextIndex]);
        if (nextPreset) {
          setCurrentParams(nextPreset.params);
          setParams(nextPreset.params);
        }
        
        // Clear transition state AFTER params are updated
        setNextParams(null);
        setTransitionProgress(0);
        isTransitioningRef.current = false;
        nextParamsSetRef.current = false;
        setIsTransitioning(false);
        
        // Update index last
        setCurrentIndex(nextIndex);
        startTime = currentTime;
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

  // Calculate crossfade opacity with easing
  const crossfadeOpacity = useMemo(() => {
    if (!isTransitioning || transitionProgress === 0) {
      return { current: 1, next: 0 };
    }
    const easedProgress = easeInOutCubic(transitionProgress);
    return {
      current: 1 - easedProgress,
      next: easedProgress,
    };
  }, [isTransitioning, transitionProgress]);

  const handleMouseMove = useCallback(() => {
    // Clear any existing timer
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    
    setShowControls(true);
    
    // Set new timer to hide controls
    hideControlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  const handleSkipNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % sequence.presetIds.length;
    setCurrentIndex(nextIndex);
    const nextPreset = getPreset(sequence.presetIds[nextIndex]);
    if (nextPreset) {
      setCurrentParams(nextPreset.params);
      setParams(nextPreset.params);
    }
  }, [currentIndex, sequence, getPreset, setParams]);

  const handleSkipPrev = useCallback(() => {
    const prevIndex = currentIndex === 0 ? sequence.presetIds.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    const prevPreset = getPreset(sequence.presetIds[prevIndex]);
    if (prevPreset) {
      setCurrentParams(prevPreset.params);
      setParams(prevPreset.params);
    }
  }, [currentIndex, sequence, getPreset, setParams]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Current visualization layer */}
      <div 
        className="absolute inset-0"
        style={{ opacity: crossfadeOpacity.current }}
      >
        <VisualizationCanvas params={currentParams} className="w-full h-full" />
      </div>

      {/* Next visualization layer (only rendered during transition) */}
      {isTransitioning && nextParams && (
        <div 
          className="absolute inset-0"
          style={{ opacity: crossfadeOpacity.next }}
        >
          <VisualizationCanvas params={nextParams} className="w-full h-full" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent
          transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
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
