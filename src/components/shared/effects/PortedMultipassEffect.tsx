import { useRef, useMemo, useEffect, useContext } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { portVertexShader, bufferVertexShader } from '../../../shaders/shadertoyPort';
import type { EffectType, VisualizationParams } from '../../../types';
import { useAudioStore } from '../../../stores/audioStore';
import { withControlUniforms, createControlUniforms, updateControlUniforms } from '../../../shaders/controls';
import { createPortUniforms, updatePortUniforms } from './portUniforms';
import { RenderScaleContext, LayerVisibleContext } from '../renderScaleContext';

interface PortedMultipassEffectProps {
  params: VisualizationParams;
  effectType: EffectType;
  bufferShader: string;
  imageShader: string;
}

// Renders a two-pass Shadertoy port: each frame the buffer shader draws into
// an offscreen float texture, then the image shader reads it as iChannel0.
// Give it a `key` per effect so switching effects builds fresh materials.
export function PortedMultipassEffect({ params, effectType, bufferShader, imageShader }: PortedMultipassEffectProps) {
  const imageMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport, gl } = useThree();
  const renderScale = useContext(RenderScaleContext);
  const layerVisible = useContext(LayerVisibleContext);
  const renderedOnce = useRef(false);

  // Half-float so alpha (blur radius) and bright colors aren't clamped to 0-1
  const target = useMemo(
    () => new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    }),
    []
  );

  const buffer = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: bufferVertexShader,
      fragmentShader: withControlUniforms(effectType, bufferShader),
      uniforms: {
        ...createPortUniforms(params, size.width, size.height),
        ...createControlUniforms(effectType, params),
      },
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    // The buffer vertex shader ignores the camera; render() just needs one
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { material, geometry, scene, camera };
  }, []);

  useEffect(() => () => {
    target.dispose();
    buffer.material.dispose();
    buffer.geometry.dispose();
  }, [target, buffer]);

  const imageShaderWithControls = useMemo(() => withControlUniforms(effectType, imageShader), [effectType, imageShader]);

  const imageUniforms = useMemo(
    () => ({
      ...createPortUniforms(params, size.width, size.height),
      ...createControlUniforms(effectType, params),
      iChannel0: { value: target.texture },
    }),
    []
  );

  useFrame((state) => {
    // The buffer pass is the expensive part: skip it while this layer is hidden
    // (preloaded for the next transition), after one render to compile it
    if (!layerVisible.current && renderedOnce.current) return;
    renderedOnce.current = true;

    // Match the buffer to the layer's real pixel size
    const dpr = gl.getPixelRatio() * renderScale;
    const width = Math.max(1, Math.floor(size.width * dpr));
    const height = Math.max(1, Math.floor(size.height * dpr));
    if (target.width !== width || target.height !== height) target.setSize(width, height);

    const time = state.clock.elapsedTime;
    // Read in the frame loop, not via a hook, so audio updates don't re-render
    const audioData = useAudioStore.getState().audioData;
    updateControlUniforms(buffer.material.uniforms, effectType, params);
    updatePortUniforms(buffer.material.uniforms, params, time, size.width, size.height, audioData);

    const previousTarget = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.render(buffer.scene, buffer.camera);
    gl.setRenderTarget(previousTarget);

    if (imageMaterialRef.current) {
      updateControlUniforms(imageMaterialRef.current.uniforms, effectType, params);
      updatePortUniforms(imageMaterialRef.current.uniforms, params, time, size.width, size.height, audioData);
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={imageMaterialRef}
        vertexShader={portVertexShader}
        fragmentShader={imageShaderWithControls}
        uniforms={imageUniforms}
      />
    </mesh>
  );
}
