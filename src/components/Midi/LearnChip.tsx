import { useMidiStore } from '../../stores/midiStore';
import type { MidiTarget } from '../../midi/types';
import { describeTrigger, sameTarget } from '../../midi/mapping';

interface LearnChipProps {
  target: MidiTarget;
  /** Always show the mapped control, not only in Learn mode. */
  alwaysShow?: boolean;
}

/**
 * Small badge beside a control. In Learn mode, click it and then move a
 * knob/hit a pad to bind. Outside Learn mode it shows what's mapped.
 */
export function LearnChip({ target, alwaysShow = false }: LearnChipProps) {
  const learnMode = useMidiStore((s) => s.learnMode);
  const learnTarget = useMidiStore((s) => s.learnTarget);
  const mapping = useMidiStore((s) => s.mappings.find((m) => sameTarget(m.target, target)));
  const fired = useMidiStore((s) => mapping !== undefined && s.lastFiredMappingId === mapping.id);
  const setLearnTarget = useMidiStore((s) => s.setLearnTarget);
  const removeMapping = useMidiStore((s) => s.removeMapping);

  if (!learnMode && !(alwaysShow && mapping)) {
    return mapping ? (
      <span
        className={`text-[10px] px-1 rounded transition-colors ${
          fired ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)]'
        }`}
        title={`Mapped to ${describeTrigger(mapping.trigger)}`}
      >
        🎛
      </span>
    ) : null;
  }

  const isLearning = learnTarget !== null && sameTarget(learnTarget, target);

  if (!learnMode) {
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors ${
          fired ? 'bg-[var(--accent-primary)] text-white' : 'bg-black/30 text-[var(--text-muted)]'
        }`}
      >
        {mapping ? describeTrigger(mapping.trigger) : ''}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLearnTarget(isLearning ? null : target);
        }}
        className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-all ${
          isLearning
            ? 'bg-amber-400 text-black animate-pulse'
            : mapping
              ? 'bg-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/50'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-dashed border-[var(--border-color)]'
        }`}
        title={isLearning ? 'Move a knob or hit a pad…' : 'Click, then move a control to map it'}
      >
        {isLearning ? 'move a control…' : mapping ? describeTrigger(mapping.trigger) : 'learn'}
      </button>
      {mapping && !isLearning && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            removeMapping(mapping.id);
          }}
          className="text-[10px] px-1 text-[var(--text-muted)] hover:text-red-400"
          title="Remove mapping"
        >
          ✕
        </button>
      )}
    </span>
  );
}
