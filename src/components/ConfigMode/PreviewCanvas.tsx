import { useVisualizationStore } from '../../stores/visualizationStore';
import { usePresetStore } from '../../stores/presetStore';
import { VisualizationCanvas } from '../shared/VisualizationCanvas';
import { TransitionCanvas } from '../shared/TransitionCanvas';
import { useSequencePlayback } from '../../hooks/useSequencePlayback';
import type { Sequence } from '../../types';

interface PreviewCanvasProps {
  previewingSequence?: Sequence | null;
}

export function PreviewCanvas({ previewingSequence }: PreviewCanvasProps) {
  const params = useVisualizationStore((state) => state.params);
  const getPreset = usePresetStore((state) => state.getPreset);

  const isPlayingSequence = !!previewingSequence && previewingSequence.presetIds.length > 0;
  const { paramsA, paramsB, transitionRef, currentIndex, sequence } = useSequencePlayback({
    sequenceId: isPlayingSequence ? previewingSequence.id : null,
  });

  const currentPresetName = sequence && sequence.presetIds.length > 0
    ? getPreset(sequence.presetIds[currentIndex])?.name || 'Unknown'
    : null;

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-[var(--border-color)]">
      {isPlayingSequence ? (
        // Both presets render on one canvas and are blended by the transition shader
        <TransitionCanvas paramsA={paramsA} paramsB={paramsB} transitionRef={transitionRef} />
      ) : (
        <VisualizationCanvas params={params} />
      )}

      {/* Label */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm
        text-xs text-white/70 font-medium pointer-events-none">
        {isPlayingSequence && sequence ? (
          <span>
            🎬 {sequence.name} • {currentPresetName} ({currentIndex + 1}/{sequence.presetIds.length})
          </span>
        ) : (
          'Preview'
        )}
      </div>
    </div>
  );
}
