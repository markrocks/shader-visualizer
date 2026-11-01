import { useState } from 'react';
import type { Sequence, SequenceSlotSettings } from '../../types';
import { EASINGS, TRANSITIONS, type TransitionChoice, type TransitionEasing } from '../../shaders/transitions';
import { hasOverrides, resolveSlot, sequenceDefaults, slotOverrides } from '../../utils/sequenceSlots';

const fieldClass = `px-2 py-1.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)]
  text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]
  disabled:opacity-50 disabled:cursor-not-allowed`;

function transitionLabel(choice: TransitionChoice): string {
  if (choice === 'random') return '🎲 Random';
  return TRANSITIONS.find((t) => t.id === choice)?.label ?? choice;
}

function easingLabel(easing: TransitionEasing): string {
  return EASINGS.find((e) => e.id === easing)?.label ?? easing;
}

interface OverrideNumberProps {
  id: string;
  value: number | undefined;
  fallback: number;
  onChange: (value: number | undefined) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
}

// Number input where empty means "use the sequence's value", shown as the
// placeholder
function OverrideNumber({ id, value, fallback, onChange, min, max, step, disabled }: OverrideNumberProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      id={id}
      type="number"
      value={draft ?? (value === undefined ? '' : String(value))}
      placeholder={String(fallback)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => {
        setDraft(e.target.value);
        if (e.target.value.trim() === '') {
          onChange(undefined);
          return;
        }
        const v = parseFloat(e.target.value);
        if (Number.isFinite(v)) onChange(Math.min(Math.max(v, min), max));
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => e.stopPropagation()}
      className={`w-full ${fieldClass}`}
    />
  );
}

function summaryText(sequence: Sequence, index: number): string {
  const slot = resolveSlot(sequence, index);
  const isLast = index === sequence.presetIds.length - 1;
  if (isLast && !sequence.looping) return `Shows for ${slot.presetDuration}s, then the sequence ends`;
  return `Shows for ${slot.presetDuration}s, then ${transitionLabel(slot.transitionType)} over `
    + `${slot.transitionDuration}s (${easingLabel(slot.transitionEasing)}) to ${isLast ? 'the first preset' : 'the next preset'}`;
}

interface SlotSummaryProps {
  sequence: Sequence;
  index: number;
}

// One-line summary of a preset's timing and outgoing transition. Values the
// preset overrides are highlighted.
export function SlotSummary({ sequence, index }: SlotSummaryProps) {
  const overrides = slotOverrides(sequence, index);
  const slot = resolveSlot(sequence, index);
  const isLast = index === sequence.presetIds.length - 1;
  const ends = isLast && !sequence.looping;
  const part = (overridden: boolean, text: string) => (
    <span className={overridden ? 'text-[var(--accent-primary)] font-medium' : undefined}>{text}</span>
  );

  return (
    <div className="text-[11px] text-[var(--text-muted)] truncate" title={summaryText(sequence, index)}>
      {part(overrides.presetDuration !== undefined, `${slot.presetDuration}s`)}
      {ends ? (
        ' → end'
      ) : (
        <>
          {isLast ? ' ↺ ' : ' → '}
          {part(overrides.transitionType !== undefined, transitionLabel(slot.transitionType))}
          {' · '}
          {part(overrides.transitionDuration !== undefined, `${slot.transitionDuration}s`)}
          {' · '}
          {part(overrides.transitionEasing !== undefined, easingLabel(slot.transitionEasing))}
        </>
      )}
    </div>
  );
}

interface SequenceSlotEditorProps {
  sequence: Sequence;
  index: number;
  nextPresetName: string | null;
  onChange: (settings: SequenceSlotSettings) => void;
}

// Per-preset overrides for a sequence: how long this preset shows, and how
// it transitions to the next one
export function SequenceSlotEditor({ sequence, index, nextPresetName, onChange }: SequenceSlotEditorProps) {
  const overrides = slotOverrides(sequence, index);
  const defaults = sequenceDefaults(sequence);
  const slot = resolveSlot(sequence, index);
  const isLast = index === sequence.presetIds.length - 1;
  // The last preset only transitions when the sequence loops back to the start
  const transitionDisabled = isLast && !sequence.looping;
  const idPrefix = `slot-${sequence.id}-${index}`;

  const set = <K extends keyof SequenceSlotSettings>(key: K, value: SequenceSlotSettings[K]) => {
    const next = { ...overrides };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const styleDescription = slot.transitionType === 'random'
    ? 'Picks a different transition style each time.'
    : TRANSITIONS.find((t) => t.id === slot.transitionType)?.description;

  return (
    <div className="flex flex-col gap-3 ml-2 mb-1 p-3 rounded bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)]">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-hold`} className="text-xs text-[var(--text-muted)]">
          Show this preset for (s)
        </label>
        <OverrideNumber
          id={`${idPrefix}-hold`}
          value={overrides.presetDuration}
          fallback={defaults.presetDuration}
          onChange={(v) => set('presetDuration', v)}
          min={1}
          max={300}
          step={1}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">
          {transitionDisabled
            ? 'No transition after the last preset'
            : `Then transition to ${isLast ? 'the first preset' : 'the next preset'}${nextPresetName ? ` (${nextPresetName})` : ''}`}
        </div>
        {transitionDisabled && (
          <p className="text-xs text-[var(--text-muted)]">
            The sequence ends here. Turn on “Loop sequence” to transition back to the start.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}-style`} className="text-xs text-[var(--text-muted)]">Style</label>
          <select
            id={`${idPrefix}-style`}
            value={overrides.transitionType ?? ''}
            disabled={transitionDisabled}
            onChange={(e) => set('transitionType', (e.target.value || undefined) as TransitionChoice | undefined)}
            className={fieldClass}
          >
            <option value="">Default ({transitionLabel(defaults.transitionType)})</option>
            {TRANSITIONS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
            <option value="random">🎲 Random</option>
          </select>
          {!transitionDisabled && styleDescription && (
            <p className="text-xs text-[var(--text-muted)]">{styleDescription}</p>
          )}
        </div>

        <div className="grid grid-cols-[4.5rem_1fr] gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}-duration`} className="text-xs text-[var(--text-muted)]">Secs</label>
            <OverrideNumber
              id={`${idPrefix}-duration`}
              value={overrides.transitionDuration}
              fallback={defaults.transitionDuration}
              onChange={(v) => set('transitionDuration', v)}
              min={0}
              max={10}
              step={0.5}
              disabled={transitionDisabled}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}-easing`} className="text-xs text-[var(--text-muted)]">Easing</label>
            <select
              id={`${idPrefix}-easing`}
              value={overrides.transitionEasing ?? ''}
              disabled={transitionDisabled}
              onChange={(e) => set('transitionEasing', (e.target.value || undefined) as TransitionEasing | undefined)}
              className={fieldClass}
            >
              <option value="">Default ({easingLabel(defaults.transitionEasing)})</option>
              {EASINGS.map((easing) => (
                <option key={easing.id} value={easing.id}>{easing.label}</option>
              ))}
            </select>
          </div>
        </div>
        {!transitionDisabled && (
          <p className="text-xs text-[var(--text-muted)]">
            {EASINGS.find((e) => e.id === slot.transitionEasing)?.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[var(--text-muted)]">Empty fields use the sequence settings.</p>
        <button
          type="button"
          onClick={() => onChange({})}
          disabled={!hasOverrides(overrides)}
          className="px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]
            disabled:opacity-40 disabled:cursor-not-allowed transition-all-smooth"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
