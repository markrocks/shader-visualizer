import { useRef, useMemo, useContext } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { particlesVertexShader, particlesFragmentShader } from '../../../shaders';
import { withControlUniforms, createControlUniforms, updateControlUniforms } from '../../../shaders/controls';
import type { VisualizationParams } from '../../../types';
import { useAudioStore } from '../../../stores/audioStore';
import { RenderScaleContext } from '../renderScaleContext';

const vertexShader = withControlUniforms('particles', particlesVertexShader);
const fragmentShader = withControlUniforms('particles', particlesFragmentShader);

interface ParticlesEffectProps {
  params: VisualizationParams;
}

export function ParticlesEffect({ params }: ParticlesEffectProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const viewport = useThree((state) => state.viewport);
  const renderScale = useContext(RenderScaleContext);
  // Particle positions span about ±2.5 units; fit that to the screen
  const spread = Math.min(viewport.width, viewport.height) / 5;

  const { geometry, uniforms } = useMemo(() => {
    const count = params.particleCount || 1000;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute particles in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * 2;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      randoms[i] = Math.random();
      sizes[i] = Math.random() * 10 + 5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));
    geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

    const unis = {
      uTime: { value: 0 },
      uPrimaryColor: { value: new THREE.Color(params.primaryColor) },
      uSecondaryColor: { value: new THREE.Color(params.secondaryColor) },
      uSpeed: { value: params.speed },
      uScale: { value: params.scale },
      uIntensity: { value: params.intensity },
      uAudioLevel: { value: 0 },
      uAnimationMode: { value: params.animationMode === 'audio-reactive' ? 1 : 0 },
      uMirrorQuadrants: { value: params.mirrorQuadrants ? 1 : 0 },
      uMirrorSegments: { value: params.mirrorSegments || 4 },
      uPixelRatio: { value: 1 },
      ...createControlUniforms('particles', params),
    };

    return { geometry: geo, uniforms: unis };
  }, [params.particleCount]);

  useFrame((state) => {
    if (materialRef.current) {
      // Read in the frame loop, not via a hook, so audio updates don't re-render
      const audioData = useAudioStore.getState().audioData;
      materialRef.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio() * renderScale;
      updateControlUniforms(materialRef.current.uniforms, 'particles', params);
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uPrimaryColor.value.set(params.primaryColor);
      materialRef.current.uniforms.uSecondaryColor.value.set(params.secondaryColor);
      materialRef.current.uniforms.uSpeed.value = params.speed;
      materialRef.current.uniforms.uScale.value = params.scale;
      materialRef.current.uniforms.uIntensity.value = params.intensity;
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
    <points ref={pointsRef} geometry={geometry} scale={[spread, spread, 1]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
