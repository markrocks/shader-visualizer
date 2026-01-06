import { useCallback } from 'react';
import { useVisualizationStore } from '../../stores/visualizationStore';
import type { EffectType, FrequencyBand } from '../../types';
import { AudioAnalyzer } from '../shared/AudioAnalyzer';

const EFFECT_OPTIONS: { value: EffectType; label: string }[] = [
  { value: 'metaballs', label: '🫧 Metaballs' },
  { value: 'particles', label: '✨ Particles' },
  { value: 'noise', label: '🌊 Noise Flow' },
  { value: 'kaleidoscope', label: '🔮 Kaleidoscope' },
];

const FREQUENCY_BANDS: { value: FrequencyBand; label: string }[] = [
  { value: 'bass', label: 'Bass' },
  { value: 'mid', label: 'Mid' },
  { value: 'treble', label: 'Treble' },
  { value: 'full', label: 'Full' },
];

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function Slider({ label, value, onChange, min = 0, max = 2, step = 0.01 }: SliderProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="text-[var(--text-secondary)]">{value.toFixed(2)}</span>
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
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-muted)] flex-1">{label}</span>
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

export function ParameterPanel() {
  const { params, setParams } = useVisualizationStore();

  const handleEffectChange = useCallback((effectType: EffectType) => {
    setParams({ effectType });
  }, [setParams]);

  const handleAnimationModeChange = useCallback((animationMode: 'time-based' | 'audio-reactive') => {
    setParams({ animationMode });
  }, [setParams]);

  const handleFrequencyBandChange = useCallback((frequencyBand: FrequencyBand) => {
    setParams({ frequencyBand });
  }, [setParams]);

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      {/* Effect Type */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Effect Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EFFECT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleEffectChange(option.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
                params.effectType === option.value
                  ? 'bg-[var(--accent-primary)] text-white glow'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Animation Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleAnimationModeChange('time-based')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              params.animationMode === 'time-based'
                ? 'bg-[var(--accent-primary)] text-white glow'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
            }`}
          >
            ⏱️ Time-Based
          </button>
          <button
            type="button"
            onClick={() => handleAnimationModeChange('audio-reactive')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              params.animationMode === 'audio-reactive'
                ? 'bg-[var(--accent-primary)] text-white glow'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
            }`}
          >
            🎵 Audio Reactive
          </button>
        </div>
      </div>

      {/* Audio Controls - only shown for audio-reactive mode */}
      {params.animationMode === 'audio-reactive' && (
        <>
          <AudioAnalyzer />
          
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
              Frequency Band
            </label>
            <div className="grid grid-cols-4 gap-1">
              {FREQUENCY_BANDS.map((band) => (
                <button
                  key={band.value}
                  type="button"
                  onClick={() => handleFrequencyBandChange(band.value)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all-smooth ${
                    params.frequencyBand === band.value
                      ? 'bg-[var(--accent-secondary)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }`}
                >
                  {band.label}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Audio Sensitivity"
            value={params.audioSensitivity}
            onChange={(v) => setParams({ audioSensitivity: v })}
            min={0}
            max={3}
          />

          <Slider
            label="Smoothing"
            value={params.smoothing}
            onChange={(v) => setParams({ smoothing: v })}
            min={0}
            max={1}
          />
        </>
      )}

      {/* Post Effects */}
      <div className="flex flex-col gap-3">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Post Effects
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={params.mirrorQuadrants}
            onChange={(e) => {
              e.stopPropagation();
              setParams({ mirrorQuadrants: e.target.checked });
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-2 border-[var(--border-color)] bg-[var(--bg-tertiary)]
              checked:bg-[var(--accent-primary)] checked:border-[var(--accent-primary)]
              cursor-pointer transition-all appearance-none relative
              after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center
              after:justify-center after:text-white after:text-xs after:opacity-0
              checked:after:opacity-100"
          />
          <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            🪞 Mirror Quadrants
          </span>
        </label>
        <p className="text-xs text-[var(--text-muted)] ml-8">
          Splits screen into 4 mirrored quadrants
        </p>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-3">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Colors
        </label>
        <ColorPicker
          label="Primary"
          value={params.primaryColor}
          onChange={(v) => setParams({ primaryColor: v })}
        />
        <ColorPicker
          label="Secondary"
          value={params.secondaryColor}
          onChange={(v) => setParams({ secondaryColor: v })}
        />
        <ColorPicker
          label="Background"
          value={params.backgroundColor}
          onChange={(v) => setParams({ backgroundColor: v })}
        />
      </div>

      {/* Common Parameters */}
      <div className="flex flex-col gap-3">
        <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Animation
        </label>
        <Slider
          label="Speed"
          value={params.speed}
          onChange={(v) => setParams({ speed: v })}
        />
        <Slider
          label="Scale"
          value={params.scale}
          onChange={(v) => setParams({ scale: v })}
        />
        <Slider
          label="Intensity"
          value={params.intensity}
          onChange={(v) => setParams({ intensity: v })}
          min={0}
          max={1.5}
        />
      </div>

      {/* Time-based specific parameters */}
      {params.animationMode === 'time-based' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Time Animation
          </label>
          <Slider
            label="Wave Frequency"
            value={params.waveFrequency}
            onChange={(v) => setParams({ waveFrequency: v })}
            min={0.1}
            max={5}
          />
          <Slider
            label="Evolution Rate"
            value={params.evolutionRate}
            onChange={(v) => setParams({ evolutionRate: v })}
            min={0.1}
            max={2}
          />
        </div>
      )}

      {/* Effect-specific parameters */}
      {params.effectType === 'metaballs' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Metaballs
          </label>
          <Slider
            label="Blob Count"
            value={params.blobCount || 5}
            onChange={(v) => setParams({ blobCount: Math.round(v) })}
            min={2}
            max={10}
            step={1}
          />
        </div>
      )}

      {params.effectType === 'particles' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Particles
          </label>
          <Slider
            label="Particle Count"
            value={(params.particleCount || 1000) / 100}
            onChange={(v) => setParams({ particleCount: Math.round(v * 100) })}
            min={1}
            max={50}
            step={1}
          />
        </div>
      )}

      {params.effectType === 'noise' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Noise
          </label>
          <Slider
            label="Octaves"
            value={params.noiseOctaves || 4}
            onChange={(v) => setParams({ noiseOctaves: Math.round(v) })}
            min={1}
            max={8}
            step={1}
          />
        </div>
      )}

      {params.effectType === 'kaleidoscope' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Kaleidoscope
          </label>
          <Slider
            label="Segments"
            value={params.kaleidoscopeSegments || 6}
            onChange={(v) => setParams({ kaleidoscopeSegments: Math.round(v) })}
            min={2}
            max={16}
            step={1}
          />
          <p className="text-xs text-[var(--text-muted)]">
            {params.kaleidoscopeSegments || 6} symmetrical reflections
          </p>
        </div>
      )}
    </div>
  );
}
