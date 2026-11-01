import type { AudioData, VisualizationParams } from '../../../types';

// Shared-param uniforms read by shaders built with shadertoyPort.ts

type Uniforms = Record<string, { value: unknown }>;

export function createPortUniforms(params: VisualizationParams, width: number, height: number): Uniforms {
  return {
    uTime: { value: 0 },
    uResolution: { value: [width, height] },
    uSpeed: { value: params.speed },
    uScale: { value: params.scale },
    uIntensity: { value: params.intensity },
    uEvolutionRate: { value: params.evolutionRate },
    uAudioLevel: { value: 0 },
    uAnimationMode: { value: params.animationMode === 'audio-reactive' ? 1 : 0 },
    uMirrorQuadrants: { value: params.mirrorQuadrants ? 1 : 0 },
    uMirrorSegments: { value: params.mirrorSegments || 4 },
  };
}

export function updatePortUniforms(
  uniforms: Uniforms,
  params: VisualizationParams,
  time: number,
  width: number,
  height: number,
  audioData: AudioData
): void {
  // Passes may declare only some of these (e.g. an image pass), so skip missing ones
  const set = (name: string, value: unknown) => {
    if (uniforms[name]) uniforms[name].value = value;
  };
  set('uTime', time);
  // Update in place rather than allocating a new array every frame
  const resolution = uniforms.uResolution?.value as number[] | undefined;
  if (resolution) {
    resolution[0] = width;
    resolution[1] = height;
  }
  set('uSpeed', params.speed);
  set('uScale', params.scale);
  set('uIntensity', params.intensity);
  set('uEvolutionRate', params.evolutionRate);
  set('uAnimationMode', params.animationMode === 'audio-reactive' ? 1 : 0);
  set('uMirrorQuadrants', params.mirrorQuadrants ? 1 : 0);
  set('uMirrorSegments', params.mirrorSegments || 4);
  set('uAudioLevel', params.animationMode === 'audio-reactive'
    ? audioData[params.frequencyBand] * params.audioSensitivity
    : 0);
}
