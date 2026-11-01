import { useState, useCallback, useId } from 'react';

// Enough decimals to show the slider's step (at least 2)
function decimalsForStep(step: number): number {
  return Math.max(2, Math.ceil(-Math.log10(step)));
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined) value = Math.max(min, value);
  if (max !== undefined) value = Math.min(max, value);
  return value;
}

interface InfoTipProps {
  label: string;
  text: string;
}

// Small "i" button that shows a description on hover or keyboard/tap focus.
// The tooltip spans its nearest `relative` ancestor (the control row) so it
// never overflows the narrow controls panel.
export function InfoTip({ label, text }: InfoTipProps) {
  const id = useId();
  return (
    <span className="group/tip inline-flex">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={id}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 rounded-full border border-[var(--text-muted)] text-[9px] leading-none font-bold
          text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]
          focus:outline-none focus:text-[var(--text-primary)] focus:border-[var(--text-primary)]
          inline-flex items-center justify-center transition-colors"
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-0 right-0 top-full mt-1 z-20 hidden
          group-hover/tip:block group-focus-within/tip:block
          rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1.5
          text-xs normal-case tracking-normal font-normal text-[var(--text-secondary)] shadow-lg"
      >
        {text}
      </span>
    </span>
  );
}

// Control label with an optional info tip
function ControlLabel({ label, description }: { label: string; description?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
      {label}
      {description && <InfoTip label={label} text={description} />}
    </span>
  );
}

interface SliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function Slider({ label, description, value, onChange, min = 0, max = 2, step = 0.01 }: SliderProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex justify-between text-xs">
        <ControlLabel label={label} description={description} />
        <span className="text-[var(--text-secondary)]">{value.toFixed(decimalsForStep(step))}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-[var(--bg-tertiary)]
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)]
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
          [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative flex items-center gap-3">
      <span className="flex-1"><ControlLabel label={label} description={description} /></span>
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={handleChange}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded-lg cursor-pointer border-2 border-[var(--border-color)]
            appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0
            [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
        />
      </div>
    </div>
  );
}

const numberInputClass = `px-2 py-1 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-color)]
  text-[var(--text-primary)] text-xs text-right focus:outline-none focus:border-[var(--accent-primary)]
  [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

interface NumberStepperProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

// Whole-number input with − / + buttons
export function NumberStepper({ label, description, value, onChange, min, max }: NumberStepperProps) {
  const set = (v: number) => onChange(clamp(Math.round(v), min, max));
  const buttonClass = `w-6 h-6 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm leading-none
    hover:bg-[var(--border-color)] disabled:opacity-40 disabled:cursor-not-allowed transition-all`;

  return (
    <div className="relative flex items-center gap-2">
      <span className="flex-1"><ControlLabel label={label} description={description} /></span>
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => set(value - 1)} className={buttonClass}>
        −
      </button>
      <input
        type="number"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={1}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (Number.isFinite(v)) set(v);
        }}
        className={`w-12 ${numberInputClass}`}
      />
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => set(value + 1)} className={buttonClass}>
        +
      </button>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  max?: number;
}

// Free-entry decimal input. Keeps the typed text while focused so partial
// entries like "0." or "-" aren't overwritten mid-edit.
export function NumberField({ label, description, value, onChange, step, min, max }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className="relative flex items-center gap-2">
      <span className="flex-1"><ControlLabel label={label} description={description} /></span>
      <input
        type="number"
        aria-label={label}
        value={draft ?? String(value)}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(clamp(v, min, max));
        }}
        onBlur={() => setDraft(null)}
        className={`w-24 ${numberInputClass}`}
      />
    </div>
  );
}
