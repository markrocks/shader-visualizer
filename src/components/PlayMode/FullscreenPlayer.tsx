import { useRef, useEffect, useCallback, useState, type RefObject } from 'react';
import { useFullscreen } from '../../hooks/useFullscreen';
import { usePresetStore } from '../../stores/presetStore';
import { useVisualizationStore } from '../../stores/visualizationStore';
import { TransitionCanvas, type TransitionState } from '../shared/TransitionCanvas';
import { useSequencePlayback } from '../../hooks/useSequencePlayback';
import type { Sequence } from '../../types';

interface FullscreenPlayerProps {
  sequence: Sequence;
  onExit: () => void;
}

interface ProgressBarProps {
  currentIndex: number;
  count: number;
  transitionRef: RefObject<TransitionState>;
  active: boolean;
}

// Sequence progress, including the in-flight transition. Updates the bar's
// width directly each frame instead of re-rendering React.
function ProgressBar({ currentIndex, count, transitionRef, active }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const update = () => {
      if (barRef.current) {
        const progress = transitionRef.current?.progress ?? 0;
        barRef.current.style.width = `${((currentIndex + progress) / count) * 100}%`;
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [active, currentIndex, count, transitionRef]);

  return (
    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
      <div ref={barRef} className="h-full bg-white/80" style={{ width: `${(currentIndex / count) * 100}%` }} />
    </div>
  );
}

export function FullscreenPlayer({ sequence, onExit }: FullscreenPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(containerRef);
  const getPreset = usePresetStore((state) => state.getPreset);
  const setParams = useVisualizationStore((state) => state.setParams);

  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);
  const hideControlsTimerRef = useRef<number | null>(null);

  const handleEnd = useCallback(() => {
    exitFullscreen();
    onExit();
  }, [exitFullscreen, onExit]);

  const { paramsA, paramsB, transitionRef, currentIndex, jumpTo } = useSequencePlayback({
    sequenceId: sequence.id,
    paused: isPaused,
    onEnd: handleEnd,
    // Keep the shared params in sync with what's on screen
    onPresetChange: setParams,
  });

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

  const count = sequence.presetIds.length;
  const handleSkipNext = useCallback(() => jumpTo((currentIndex + 1) % count), [jumpTo, currentIndex, count]);
  const handleSkipPrev = useCallback(() => jumpTo((currentIndex - 1 + count) % count), [jumpTo, currentIndex, count]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Both presets render on one canvas and are blended by the transition shader */}
      <div className="absolute inset-0">
        <TransitionCanvas paramsA={paramsA} paramsB={paramsB} transitionRef={transitionRef} />
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
              {currentIndex + 1} / {count}
            </span>
          </div>
          <ProgressBar currentIndex={currentIndex} count={count} transitionRef={transitionRef} active={showControls} />
        </div>

        <div className="text-center mt-3 text-xs text-white/40">
          Press ESC to exit
        </div>
      </div>
    </div>
  );
}
