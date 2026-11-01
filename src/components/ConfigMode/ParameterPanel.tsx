import { useState, useCallback, useEffect } from 'react';
import { useVisualizationStore } from '../../stores/visualizationStore';
import { usePresetStore } from '../../stores/presetStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { EffectType, FrequencyBand } from '../../types';
import { AudioAnalyzer } from '../shared/AudioAnalyzer';
import { SavePresetDialog } from './SavePresetDialog';
import { ShaderControls } from './ShaderControls';
import { Slider, ColorPicker, InfoTip } from './inputs';
import { EffectGuideDialog } from './EffectGuideDialog';
import { EFFECT_INFO, SHARED_CONTROL_INFO } from '../../shaders/effectInfo';

const EFFECT_OPTIONS: { value: EffectType; label: string }[] = [
  { value: 'metaballs', label: '🫧 Metaballs' },
  { value: 'particles', label: '✨ Particles' },
  { value: 'noise', label: '🌊 Noise Flow' },
  { value: 'kaleidoscope', label: '🔮 Kaleidoscope' },
  { value: 'plasma', label: '🌈 Plasma' },
  { value: 'voronoi', label: '🔷 Voronoi' },
  { value: 'tunnel', label: '🌀 Tunnel' },
  { value: 'truchet', label: '🔲 Truchet' },
  { value: 'clouds', label: '☁️ Protean Clouds' },
  { value: 'universe-within', label: '🕸️ Universe Within' },
  { value: 'star-nest', label: '🌌 Star Nest' },
  { value: 'voronoi-distances', label: '🔶 Voronoi Distances' },
  { value: 'warp-speed', label: '🚀 Warp Speed' },
  { value: 'drive-home', label: '🚗 The Drive Home' },
  { value: 'main-sequence-star', label: '☀️ Main Sequence Star' },
  { value: 'water-caustics', label: '💧 Water Caustics' },
  { value: 'plasma-globe', label: '⚡ Plasma Globe' },
  { value: 'blue', label: '🧊 Blue' },
  { value: 'parametrics', label: '➰ Parametrics' },
  { value: 'liquid-carbon', label: '🖤 Liquid Carbon' },
];

const FREQUENCY_BANDS: { value: FrequencyBand; label: string }[] = [
  { value: 'bass', label: 'Bass' },
  { value: 'mid', label: 'Mid' },
  { value: 'treble', label: 'Treble' },
  { value: 'full', label: 'Full' },
];

interface SectionProps {
  title: string;
  indent?: boolean;
  // Overrides the heading's default muted text color
  headingColorClassName?: string;
  children: React.ReactNode;
}

function Section({
  title,
  indent = true,
  headingColorClassName = 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
  children,
}: SectionProps) {
  const collapsed = useSettingsStore((state) => state.collapsedSections.includes(title));
  const toggleSection = useSettingsStore((state) => state.toggleSection);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => toggleSection(title)}
        aria-expanded={!collapsed}
        className={`flex items-center justify-between text-sm font-bold uppercase tracking-wider
          ${headingColorClassName} transition-colors`}
      >
        <span>{title}</span>
        <span className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}>▾</span>
      </button>
      {!collapsed && <div className={`flex flex-col gap-3 ${indent ? 'pl-[10px]' : ''}`}>{children}</div>}
    </div>
  );
}

export function ParameterPanel() {
  const { params, setParams } = useVisualizationStore();
  const addPreset = usePresetStore((state) => state.addPreset);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const effectInfo = EFFECT_INFO[params.effectType];
  const effectLabel = EFFECT_OPTIONS.find((o) => o.value === params.effectType)?.label ?? params.effectType;
  // Description for a control in the current effect's own section
  const effectHelp = (label: string) => effectInfo.effectControls?.find((c) => c.label === label)?.description;

  // Hide the "Saved" confirmation after a moment
  useEffect(() => {
    if (!savedName) return;
    const timer = setTimeout(() => setSavedName(null), 2500);
    return () => clearTimeout(timer);
  }, [savedName]);

  const handleSavePreset = useCallback((name: string) => {
    addPreset(name, params);
    setIsSaveDialogOpen(false);
    setSavedName(name);
  }, [addPreset, params]);

  const handleCloseSaveDialog = useCallback(() => {
    setIsSaveDialogOpen(false);
  }, []);

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
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-5 p-4 overflow-y-auto">
        {/* Effect Type */}
        <Section title="Effect Type" indent={false}>
          <div className="grid grid-cols-2 gap-2">
            {EFFECT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                title={EFFECT_INFO[option.value].summary}
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

          {/* About the selected effect */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-secondary)]">{effectInfo.summary}</p>
            {effectInfo.credit && (
              <p className="text-[11px] text-[var(--text-muted)]">By {effectInfo.credit.author}</p>
            )}
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="self-start text-xs font-medium text-[var(--accent-primary)] hover:brightness-125 transition-all"
            >
              ⓘ Effect guide
            </button>
          </div>
        </Section>

        {/* Animation Mode */}
        <Section title="Animation Mode" indent={false}>
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
        </Section>

        {/* Audio Controls - only shown for audio-reactive mode */}
        {params.animationMode === 'audio-reactive' && (
          <Section title="Audio">
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
              description={SHARED_CONTROL_INFO.audioSensitivity}
              value={params.audioSensitivity}
              onChange={(v) => setParams({ audioSensitivity: v })}
              min={0}
              max={3}
            />

            <Slider
              label="Smoothing"
              description={SHARED_CONTROL_INFO.smoothing}
              value={params.smoothing}
              onChange={(v) => setParams({ smoothing: v })}
              min={0}
              max={1}
            />
          </Section>
        )}

        {/* Post Effects */}
        <Section title="Post Effects">
          <label className="relative flex items-center gap-3 cursor-pointer group">
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
              🪞 Mirror Segments
            </span>
            <InfoTip label="Mirror Segments" text={SHARED_CONTROL_INFO.mirror} />
          </label>
          {params.mirrorQuadrants && (
            <>
              <Slider
                label="Segments"
                description={SHARED_CONTROL_INFO.mirrorSegments}
                value={params.mirrorSegments || 4}
                onChange={(v) => setParams({ mirrorSegments: Math.round(v) })}
                min={2}
                max={16}
                step={1}
              />
              <p className="text-xs text-[var(--text-muted)]">
                {params.mirrorSegments || 4} mirrored sections
              </p>
            </>
          )}
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <ColorPicker
            label="Primary"
            description={SHARED_CONTROL_INFO.primaryColor}
            value={params.primaryColor}
            onChange={(v) => setParams({ primaryColor: v })}
          />
          <ColorPicker
            label="Secondary"
            description={SHARED_CONTROL_INFO.secondaryColor}
            value={params.secondaryColor}
            onChange={(v) => setParams({ secondaryColor: v })}
          />
          <ColorPicker
            label="Background"
            description={SHARED_CONTROL_INFO.backgroundColor}
            value={params.backgroundColor}
            onChange={(v) => setParams({ backgroundColor: v })}
          />
        </Section>

        {/* Common Parameters */}
        <Section title="Animation">
          <Slider
            label="Speed"
            description={SHARED_CONTROL_INFO.speed}
            value={params.speed}
            onChange={(v) => setParams({ speed: v })}
          />
          <Slider
            label="Scale"
            description={SHARED_CONTROL_INFO.scale}
            value={params.scale}
            onChange={(v) => setParams({ scale: v })}
          />
          <Slider
            label="Intensity"
            description={SHARED_CONTROL_INFO.intensity}
            value={params.intensity}
            onChange={(v) => setParams({ intensity: v })}
            min={0}
            max={1.5}
          />
        </Section>

        {/* Time-based specific parameters */}
        {params.animationMode === 'time-based' && (
          <Section title="Time Animation">
            <Slider
              label="Wave Frequency"
              description={SHARED_CONTROL_INFO.waveFrequency}
              value={params.waveFrequency}
              onChange={(v) => setParams({ waveFrequency: v })}
              min={0.1}
              max={5}
            />
            <Slider
              label="Evolution Rate"
              description={SHARED_CONTROL_INFO.evolutionRate}
              value={params.evolutionRate}
              onChange={(v) => setParams({ evolutionRate: v })}
              min={0.1}
              max={2}
            />
          </Section>
        )}

        {/* Effect-specific parameters */}
        {params.effectType === 'metaballs' && (
          <Section title="Metaballs">
            <Slider
              label="Blob Count"
              description={effectHelp('Blob Count')}
              value={params.blobCount || 5}
              onChange={(v) => setParams({ blobCount: Math.round(v) })}
              min={2}
              max={10}
              step={1}
            />
          </Section>
        )}

        {params.effectType === 'particles' && (
          <Section title="Particles">
            <Slider
              label="Particle Count"
              description={effectHelp('Particle Count')}
              value={(params.particleCount || 1000) / 100}
              onChange={(v) => setParams({ particleCount: Math.round(v * 100) })}
              min={1}
              max={50}
              step={1}
            />
          </Section>
        )}

        {params.effectType === 'noise' && (
          <Section title="Noise">
            <Slider
              label="Octaves"
              description={effectHelp('Octaves')}
              value={params.noiseOctaves || 4}
              onChange={(v) => setParams({ noiseOctaves: Math.round(v) })}
              min={1}
              max={8}
              step={1}
            />
          </Section>
        )}

        {params.effectType === 'kaleidoscope' && (
          <Section title="Kaleidoscope">
            <Slider
              label="Segments"
              description={effectHelp('Segments')}
              value={params.kaleidoscopeSegments || 6}
              onChange={(v) => setParams({ kaleidoscopeSegments: Math.round(v) })}
              min={2}
              max={16}
              step={1}
            />
            <p className="text-xs text-[var(--text-muted)]">
              {params.kaleidoscopeSegments || 6} symmetrical reflections
            </p>
          </Section>
        )}

        {params.effectType === 'plasma' && (
          <Section title="Plasma">
            <Slider
              label="Complexity"
              description={effectHelp('Complexity')}
              value={params.plasmaComplexity || 5}
              onChange={(v) => setParams({ plasmaComplexity: Math.round(v) })}
              min={1}
              max={8}
              step={1}
            />
            <p className="text-xs text-[var(--text-muted)]">
              {params.plasmaComplexity || 5} wave layers
            </p>
          </Section>
        )}

        {params.effectType === 'voronoi' && (
          <Section title="Voronoi Cells">
            <Slider
              label="Cell Count"
              description={effectHelp('Cell Count')}
              value={params.voronoiCells || 20}
              onChange={(v) => setParams({ voronoiCells: Math.round(v) })}
              min={5}
              max={50}
              step={1}
            />
            <Slider
              label="Edge Width"
              description={effectHelp('Edge Width')}
              value={params.voronoiEdgeWidth || 0.02}
              onChange={(v) => setParams({ voronoiEdgeWidth: v })}
              min={0.001}
              max={0.1}
              step={0.001}
            />
            <p className="text-xs text-[var(--text-muted)]">
              {params.voronoiCells || 20} organic cells
            </p>
          </Section>
        )}

        {params.effectType === 'tunnel' && (
          <Section title="Tunnel">
            <Slider
              label="Depth"
              description={effectHelp('Depth')}
              value={params.tunnelDepth || 10}
              onChange={(v) => setParams({ tunnelDepth: v })}
              min={1}
              max={30}
              step={0.5}
            />
            <Slider
              label="Rings"
              description={effectHelp('Rings')}
              value={params.tunnelRings || 8}
              onChange={(v) => setParams({ tunnelRings: Math.round(v) })}
              min={2}
              max={20}
              step={1}
            />
            <p className="text-xs text-[var(--text-muted)]">
              {params.tunnelRings || 8} tunnel rings
            </p>
          </Section>
        )}

        {params.effectType === 'truchet' && (
          <Section title="Truchet Tiles">
            <Slider
              label="Grid Size"
              description={effectHelp('Grid Size')}
              value={params.truchetGridSize || 8}
              onChange={(v) => setParams({ truchetGridSize: Math.round(v) })}
              min={3}
              max={20}
              step={1}
            />
            <Slider
              label="Line Width"
              description={effectHelp('Line Width')}
              value={params.truchetLineWidth || 0.08}
              onChange={(v) => setParams({ truchetLineWidth: v })}
              min={0.02}
              max={0.2}
              step={0.01}
            />
            <p className="text-xs text-[var(--text-muted)]">
              {params.truchetGridSize || 8}×{params.truchetGridSize || 8} tile grid
            </p>
          </Section>
        )}

        {params.effectType === 'clouds' && (
          <Section title="Protean Clouds">
            <Slider
              label="Density"
              description={effectHelp('Density')}
              value={params.cloudsDensity ?? 0.5}
              onChange={(v) => setParams({ cloudsDensity: v })}
              min={0}
              max={1}
              step={0.01}
            />
            <Slider
              label="Theme Colors"
              description={effectHelp('Theme Colors')}
              value={params.cloudsColorMix ?? 0}
              onChange={(v) => setParams({ cloudsColorMix: v })}
              min={0}
              max={1}
              step={0.01}
            />
            <Slider
              label="Quality"
              description={effectHelp('Quality')}
              value={params.cloudsSteps || 100}
              onChange={(v) => setParams({ cloudsSteps: Math.round(v) })}
              min={40}
              max={130}
              step={1}
            />
            <p className="text-xs text-[var(--text-muted)]">
              {params.cloudsSteps || 100} raymarch steps. Lower is faster. Based on "Protean clouds" by nimitz.
            </p>
          </Section>
        )}

        {/* Custom controls for the current shader */}
        <Section title="Shader Effects" headingColorClassName="text-blue-400 hover:text-blue-300">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="self-start text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            ⓘ What do these controls do?
          </button>
          <ShaderControls />
        </Section>
      </div>

      {/* Save As - pinned below the scrolling controls */}
      <div className="p-4 border-t border-[var(--border-color)] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setIsSaveDialogOpen(true)}
          className="w-full px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium
            hover:brightness-110 transition-all-smooth"
        >
          💾 Save As
        </button>
        {savedName && (
          <p className="text-xs text-center text-[var(--text-muted)]" role="status">
            Saved "{savedName}" to Presets
          </p>
        )}
      </div>

      {isGuideOpen && (
        <EffectGuideDialog effect={params.effectType} label={effectLabel} onClose={() => setIsGuideOpen(false)} />
      )}

      {isSaveDialogOpen && (
        <SavePresetDialog onSave={handleSavePreset} onClose={handleCloseSaveDialog} />
      )}
    </div>
  );
}
