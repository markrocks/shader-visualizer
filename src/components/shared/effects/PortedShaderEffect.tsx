import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { portVertexShader } from '../../../shaders/shadertoyPort';
import type { EffectType, VisualizationParams } from '../../../types';
import { useAudioStore } from '../../../stores/audioStore';
import { withControlUniforms, createControlUniforms, updateControlUniforms } from '../../../shaders/controls';
import { createPortUniforms, updatePortUniforms } from './portUniforms';

interface PortedShaderEffectProps {
  params: VisualizationParams;
  effectType: EffectType;
  fragmentShader: string;
}

// Renders any shader built with makePortedFragmentShader. Give it a `key`
// per effect so switching effects compiles a fresh material.
export function PortedShaderEffect({ params, effectType, fragmentShader }: PortedShaderEffectProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();
  const shader = useMemo(() => withControlUniforms(effectType, fragmentShader), [effectType, fragmentShader]);

  const uniforms = useMemo(
    () => ({
      ...createPortUniforms(params, size.width, size.height),
      ...createControlUniforms(effectType, params),
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      // Read in the frame loop, not via a hook, so audio updates don't re-render
      const audioData = useAudioStore.getState().audioData;
      updateControlUniforms(materialRef.current.uniforms, effectType, params);
      updatePortUniforms(materialRef.current.uniforms, params, state.clock.elapsedTime, size.width, size.height, audioData);
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={portVertexShader}
        fragmentShader={shader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
