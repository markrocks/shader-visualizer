import { usePresetStore } from '../../stores/presetStore';
import { usePerformStore } from '../../stores/performStore';
import { useVisualizationStore } from '../../stores/visualizationStore';
import { useMidiStore } from '../../stores/midiStore';
import { runAction } from '../../midi/actions';
import { LearnChip } from '../Midi/LearnChip';
import type { MappableParamKey, MidiTarget, PerformActionId } from '../../midi/types';
import { PARAM_META } from '../../midi/paramMeta';

interface PadProps {
  label: string;
  sublabel?: string;
  active?: boolean;
  disabled?: boolean;
  target: MidiTarget;
  momentary?: boolean;
}

function Pad({ label, sublabel, active, disabled, target, momentary }: PadProps) {
  const fire = (pressed: boolean) => {
    if (target.kind === 'action') runAction(target.action, target.arg, pressed);
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          fire(true);
        }}
        onPointerUp={() => momentary && fire(false)}
        onPointerLeave={() => momentary && active && fire(false)}
        className={`w-full aspect-square rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-0.5 px-1
          transition-all select-none touch-none ${
            active
              ? 'bg-[var(--accent-primary)] text-white glow'
              : disabled
                ? 'bg-[var(--bg-tertiary)]/40 text-[var(--text-muted)]/50 cursor-not-allowed'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] active:scale-95'
          }`}
      >
        <span className="leading-tight text-center line-clamp-2">{label}</span>
        {sublabel && <span className="text-[10px] opacity-60">{sublabel}</span>}
      </button>
      <LearnChip target={target} alwaysShow />
    </div>
  );
}

function MasterKnob({ param }: { param: MappableParamKey }) {
  const value = useVisualizationStore((s) => s.params[param] as number);
  const setParams = useVisualizationStore((s) => s.setParams);
  const meta = PARAM_META[param];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-muted)] flex items-center gap-1.5">
          {meta.label}
          <LearnChip target={{ kind: 'param', param }} />
        </span>
        <span className="text-[var(--text-secondary)]">{(value ?? 0).toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.integer ? 1 : 0.01}
        value={value ?? 0}
        onChange={(e) => setParams({ [param]: parseFloat(e.target.value) })}
        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-[var(--bg-tertiary)] accent-[var(--accent-primary)]"
      />
    </div>
  );
}

const action = (a: PerformActionId, arg?: number): MidiTarget => ({ kind: 'action', action: a, arg });

interface PerformPanelProps {
  onGoLive: () => void;
}

export function PerformPanel({ onGoLive }: PerformPanelProps) {
  const presets = usePresetStore((s) => s.presets);
  const { bpm, setBpm, strobe, blackout, invert, crossfadeSeconds, setCrossfadeSeconds, activePresetIndex } =
    usePerformStore();
  const mirror = useVisualizationStore((s) => s.params.mirrorQuadrants);
  const reactive = useVisualizationStore((s) => s.params.animationMode === 'audio-reactive');
  const effectType = useVisualizationStore((s) => s.params.effectType);
  const { status, devices, learnMode, setLearnMode } = useMidiStore();

  return (
    <div className="flex flex-col gap-5 p-4 h-full overflow-y-auto">
      {/* Go live + status */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onGoLive}
          className="w-full py-3 rounded-lg bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 glow transition-all"
        >
          ▶ Go Live (fullscreen)
        </button>
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'ready' && devices.length > 0 ? 'bg-green-400' : status === 'ready' ? 'bg-yellow-400' : 'bg-red-400'
              }`}
            />
            {status === 'ready'
              ? devices.length > 0
                ? devices.map((d) => d.name).join(', ')
                : 'No controller connected'
              : status === 'unsupported'
                ? 'Web MIDI not supported in this browser'
                : status === 'denied'
                  ? 'MIDI access blocked'
                  : 'Connecting MIDI…'}
          </span>
          <button
            type="button"
            onClick={() => setLearnMode(!learnMode)}
            className={`px-2 py-1 rounded font-medium ${
              learnMode ? 'bg-amber-400 text-black' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            {learnMode ? 'Learning…' : 'MIDI Learn'}
          </button>
        </div>
        {learnMode && (
          <p className="text-xs text-amber-300/90">
            Click a <span className="font-mono">learn</span> badge, then move a knob or hit a pad. Works on the Controls
            tab too.
          </p>
        )}
      </div>

      {/* Preset pads */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Preset Pads</label>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Pad
              key={i}
              label={presets[i]?.name ?? 'empty'}
              sublabel={`${i + 1}`}
              active={activePresetIndex === i}
              disabled={!presets[i]}
              target={action('launchPreset', i)}
            />
          ))}
        </div>
        {presets.length === 0 && (
          <p className="text-xs text-[var(--text-muted)]">Save presets on the Presets tab to fill these pads.</p>
        )}
      </div>

      {/* FX pads */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Live FX</label>
        <div className="grid grid-cols-4 gap-2">
          <Pad label="Strobe" sublabel="hold" active={strobe} momentary target={action('strobe')} />
          <Pad label="Blackout" sublabel="hold" active={blackout} momentary target={action('blackout')} />
          <Pad label="Invert" sublabel="hold" active={invert} momentary target={action('invert')} />
          <Pad label="Mirror" active={mirror} target={action('toggleMirror')} />
          <Pad label="◀ Effect" target={action('prevEffect')} />
          <Pad label="Effect ▶" sublabel={effectType} target={action('nextEffect')} />
          <Pad label="◀ Preset" target={action('prevPreset')} />
          <Pad label="Preset ▶" target={action('nextPreset')} />
          <Pad label="Audio React" active={reactive} target={action('toggleAudioReactive')} />
        </div>
      </div>

      {/* Tempo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Tempo</label>
        <div className="grid grid-cols-4 gap-2 items-start">
          <Pad label="Tap" sublabel={`${Math.round(bpm)} bpm`} target={action('tapTempo')} />
          <div className="col-span-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={40}
                max={300}
                value={Math.round(bpm)}
                onChange={(e) => setBpm(Math.min(Math.max(Number(e.target.value) || 120, 40), 300))}
                className="w-20 px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm border border-[var(--border-color)]"
              />
              <span className="text-xs text-[var(--text-muted)]">BPM · sets strobe rate</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Crossfade</span>
                <span className="text-[var(--text-secondary)]">{crossfadeSeconds.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.1}
                value={crossfadeSeconds}
                onChange={(e) => setCrossfadeSeconds(parseFloat(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-[var(--bg-tertiary)] accent-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Master knobs */}
      <div className="flex flex-col gap-3">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Master Knobs</label>
        <MasterKnob param="audioSensitivity" />
        <MasterKnob param="intensity" />
        <MasterKnob param="speed" />
        <MasterKnob param="scale" />
      </div>

      <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-muted)] space-y-1">
        <p className="font-medium text-[var(--text-secondary)]">⌨️ Keyboard (no controller needed)</p>
        <p>1–8 presets · T tap · hold S strobe / B blackout / I invert · M mirror · A audio · [ ] effect · , . preset</p>
      </div>
    </div>
  );
}
