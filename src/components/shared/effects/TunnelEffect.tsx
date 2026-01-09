import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { tunnelVertexShader, tunnelFragmentShader } from '../../../shaders/tunnel';
import type { VisualizationParams } from '../../../types';
import { useAudioStore } from '../../../stores/audioStore';

interface TunnelEffectProps {
  params: VisualizationParams;
}

export function TunnelEffect({ params }: TunnelEffectProps) {
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
      uTunnelDepth: { value: params.tunnelDepth || 10 },
      uTunnelRings: { value: params.tunnelRings || 8 },
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
      materialRef.current.uniforms.uTunnelDepth.value = params.tunnelDepth || 10;
      materialRef.current.uniforms.uTunnelRings.value = params.tunnelRings || 8;
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
        vertexShader={tunnelVertexShader}
        fragmentShader={tunnelFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
