import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { truchetVertexShader, truchetFragmentShader } from '../../../shaders/truchet';
import type { VisualizationParams } from '../../../types';
import { useAudioStore } from '../../../stores/audioStore';

interface TruchetEffectProps {
  params: VisualizationParams;
}

export function TruchetEffect({ params }: TruchetEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();
  const audioData = useAudioStore((state) => state.audioData);

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
      uTruchetGridSize: { value: params.truchetGridSize || 8 },
      uTruchetLineWidth: { value: params.truchetLineWidth || 0.08 },
      uAnimationMode: { value: params.animationMode === 'audio-reactive' ? 1 : 0 },
      uMirrorQuadrants: { value: params.mirrorQuadrants ? 1 : 0 },
      uMirrorSegments: { value: params.mirrorSegments || 4 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uResolution.value = [size.width, size.height];
      materialRef.current.uniforms.uPrimaryColor.value = new THREE.Color(params.primaryColor);
      materialRef.current.uniforms.uSecondaryColor.value = new THREE.Color(params.secondaryColor);
      materialRef.current.uniforms.uBackgroundColor.value = new THREE.Color(params.backgroundColor);
      materialRef.current.uniforms.uSpeed.value = params.speed;
      materialRef.current.uniforms.uScale.value = params.scale;
      materialRef.current.uniforms.uIntensity.value = params.intensity;
      materialRef.current.uniforms.uWaveFrequency.value = params.waveFrequency;
      materialRef.current.uniforms.uEvolutionRate.value = params.evolutionRate;
      materialRef.current.uniforms.uTruchetGridSize.value = params.truchetGridSize || 8;
      materialRef.current.uniforms.uTruchetLineWidth.value = params.truchetLineWidth || 0.08;
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
        vertexShader={truchetVertexShader}
        fragmentShader={truchetFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
