import { useCallback } from 'react';
import { useVisualizationStore } from '../../stores/visualizationStore';
import { SHADER_CONTROLS, getControlValue } from '../../shaders/controls';
import { Slider, ColorPicker, NumberStepper, NumberField } from './inputs';

// Custom controls for the current effect's shader, defined in shaders/controls.ts
export function ShaderControls() {
  const { params, setParams } = useVisualizationStore();
  const effect = params.effectType;
  const controls = SHADER_CONTROLS[effect];
  const overrides = params.shaderControls?.[effect];

  const setControl = useCallback((key: string, value: number | string) => {
    setParams({
      shaderControls: {
        ...params.shaderControls,
        [effect]: { ...params.shaderControls?.[effect], [key]: value },
      },
    });
  }, [params.shaderControls, effect, setParams]);

  const handleReset = useCallback(() => {
    const rest = { ...params.shaderControls };
    delete rest[effect];
    setParams({ shaderControls: rest });
  }, [params.shaderControls, effect, setParams]);

  return (
    <>
      {controls.map((control) => {
        const value = getControlValue(params, effect, control);
        const onChange = (v: number | string) => setControl(control.key, v);

        switch (control.type) {
          case 'int':
            return (
              <NumberStepper
                key={control.key}
                label={control.label}
                description={control.description}
                value={value as number}
                onChange={onChange}
                min={control.min}
                max={control.max}
              />
            );
          case 'float':
            return (
              <NumberField
                key={control.key}
                label={control.label}
                description={control.description}
                value={value as number}
                onChange={onChange}
                step={control.step}
                min={control.min}
                max={control.max}
              />
            );
          case 'range':
            return (
              <Slider
                key={control.key}
                label={control.label}
                description={control.description}
                value={value as number}
                onChange={onChange}
                min={control.min}
                max={control.max}
                step={control.step ?? 0.01}
              />
            );
          case 'color':
            return (
              <ColorPicker
                key={control.key}
                label={control.label}
                description={control.description}
                value={value as string}
                onChange={onChange}
              />
            );
        }
      })}
      <button
        type="button"
        onClick={handleReset}
        disabled={!overrides || Object.keys(overrides).length === 0}
        className="self-end text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]
          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ↺ Reset to defaults
      </button>
    </>
  );
}
