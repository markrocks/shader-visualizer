import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { noiseVertexShader, noiseFragmentShader } from '../../../shaders';
import { withControlUniforms, createControlUniforms, updateControlUniforms } from '../../../shaders/controls';
import type { VisualizationParams } from '../../../types';
import { useAudioStore } from '../../../stores/audioStore';

const fragmentShader = withControlUniforms('noise', noiseFragmentShader);

interface NoiseEffectProps {
  params: VisualizationParams;
}

export function NoiseEffect({ params }: NoiseEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: [size.width, size.height] },
      uPrimaryColor: { value: new THREE.Color(params.primaryColor) },
      uSecondaryColor: { value: new THREE.Color(params.secondaryColor) },
      uBackgroundColor: { value: new THREE.Color(params.backgroundColor) },
      uSpeed: { value: params.speed },
      uScale: { value: params.scale },
      uIntensity: { value: params.intensity },
      uWaveFrequency: { value: params.waveFrequency },
      uEvolutionRate: { value: params.evolutionRate },
      uAudioLevel: { value: 0 },
      uNoiseOctaves: { value: params.noiseOctaves || 4 },
      uAnimationMode: { value: params.animationMode === 'audio-reactive' ? 1 : 0 },
      uMirrorQuadrants: { value: params.mirrorQuadrants ? 1 : 0 },
      uMirrorSegments: { value: params.mirrorSegments || 4 },
      ...createControlUniforms('noise', params),
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      // Read in the frame loop, not via a hook, so audio updates don't re-render
      const audioData = useAudioStore.getState().audioData;
      updateControlUniforms(materialRef.current.uniforms, 'noise', params);
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uResolution.value[0] = size.width;
      materialRef.current.uniforms.uResolution.value[1] = size.height;
      materialRef.current.uniforms.uPrimaryColor.value.set(params.primaryColor);
      materialRef.current.uniforms.uSecondaryColor.value.set(params.secondaryColor);
      materialRef.current.uniforms.uBackgroundColor.value.set(params.backgroundColor);
      materialRef.current.uniforms.uSpeed.value = params.speed;
      materialRef.current.uniforms.uScale.value = params.scale;
      materialRef.current.uniforms.uIntensity.value = params.intensity;
      materialRef.current.uniforms.uWaveFrequency.value = params.waveFrequency;
      materialRef.current.uniforms.uEvolutionRate.value = params.evolutionRate;
      materialRef.current.uniforms.uNoiseOctaves.value = params.noiseOctaves || 4;
      materialRef.current.uniforms.uAnimationMode.value = params.animationMode === 'audio-reactive' ? 1 : 0;
      materialRef.current.uniforms.uMirrorQuadrants.value = params.mirrorQuadrants ? 1 : 0;
      materialRef.current.uniforms.uMirrorSegments.value = params.mirrorSegments || 4;

      if (params.animationMode === 'audio-reactive') {
        const level = audioData[params.frequencyBand] * params.audioSensitivity;
        materialRef.current.uniforms.uAudioLevel.value = level;
      } else {
        materialRef.current.uniforms.uAudioLevel.value = 0;
      }
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={noiseVertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
