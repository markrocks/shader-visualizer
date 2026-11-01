import { useEffect } from 'react';
import type { EffectType } from '../../types';
import { EFFECT_INFO, SHARED_CONTROL_INFO } from '../../shaders/effectInfo';
import { SHADER_CONTROLS, type ShaderControl } from '../../shaders/controls';

interface EffectGuideDialogProps {
  effect: EffectType;
  label: string;
  onClose: () => void;
}

function describeRange(control: ShaderControl): string {
  switch (control.type) {
    case 'int':
    case 'range':
      return `${control.min}–${control.max}, default ${control.default}`;
    case 'float':
      return `default ${control.default}`;
    case 'color':
      return `default ${control.default}`;
  }
}

function GuideHeading({ children, className = 'text-[var(--text-muted)]' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-xs font-bold uppercase tracking-wider ${className}`}>{children}</h3>;
}

function GuideRow({ name, detail, children }: { name: string; detail?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-[var(--text-primary)]">{name}</span>
        {detail && <span className="text-[11px] text-[var(--text-muted)] shrink-0">{detail}</span>}
      </div>
      <p className="text-xs text-[var(--text-secondary)]">{children}</p>
    </div>
  );
}

// Full reference for one effect: what it is, who made it, how the shared
// controls apply, and what each of its own controls changes in the image.
export function EffectGuideDialog({ effect, label, onClose }: EffectGuideDialogProps) {
  const info = EFFECT_INFO[effect];
  const controls = SHADER_CONTROLS[effect];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="effect-guide-title"
        className="w-full max-w-lg mx-4 max-h-[85vh] flex flex-col bg-[var(--bg-secondary)] rounded-2xl
          border border-[var(--border-color)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 id="effect-guide-title" className="text-lg font-bold text-[var(--text-primary)]">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            autoFocus
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[var(--text-secondary)]">{info.summary}</p>
            {info.credit && (
              <p className="text-xs text-[var(--text-muted)]">
                By {info.credit.author} · {info.credit.license}
                {info.credit.link && (
                  <>
                    {' · '}
                    <a
                      href={info.credit.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-primary)] hover:underline"
                    >
                      {info.credit.link.label} ↗
                    </a>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <GuideHeading>Main controls on this effect</GuideHeading>
            <GuideRow name="Colors">{info.colors}</GuideRow>
            <GuideRow name="Wave Frequency">{info.waveFrequency}</GuideRow>
            <GuideRow name="Audio Reactive">{info.audio}</GuideRow>
            <GuideRow name="Speed, Scale, Intensity">
              {SHARED_CONTROL_INFO.speed} {SHARED_CONTROL_INFO.scale} {SHARED_CONTROL_INFO.intensity}
            </GuideRow>
          </div>

          {info.effectControls && info.effectControls.length > 0 && (
            <div className="flex flex-col gap-3">
              <GuideHeading>Effect section</GuideHeading>
              {info.effectControls.map((c) => (
                <GuideRow key={c.label} name={c.label}>{c.description}</GuideRow>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <GuideHeading className="text-blue-400">Shader Effects</GuideHeading>
            {controls.map((c) => (
              <GuideRow key={c.key} name={c.label} detail={describeRange(c)}>{c.description}</GuideRow>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
