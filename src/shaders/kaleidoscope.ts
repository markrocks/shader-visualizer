export const kaleidoscopeVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const kaleidoscopeFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform vec3 uBackgroundColor;
uniform float uSpeed;
uniform float uScale;
uniform float uIntensity;
uniform float uWaveFrequency;
uniform float uEvolutionRate;
uniform float uAudioLevel;
uniform int uKaleidoscopeSegments;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  
  // Apply mirror quadrant effect
  if (uMirrorQuadrants == 1) {
    uv = abs(uv);
  }
  
  uv.x *= uResolution.x / uResolution.y;
  
  float time = uTime * uSpeed * uEvolutionRate;
  float modulator = uAnimationMode == 1 ? uAudioLevel : 1.0;
  float segments = float(uKaleidoscopeSegments);
  
  // Convert to polar coordinates
  float r = length(uv) * uScale;
  float a = atan(uv.y, uv.x);
  
  // Kaleidoscope reflection
  float segmentAngle = TAU / segments;
  a = mod(a, segmentAngle);
  if (mod(floor(atan(uv.y, uv.x) / segmentAngle), 2.0) == 1.0) {
    a = segmentAngle - a;
  }
  
  // Add rotation based on time and audio
  a += time * 0.2 * (1.0 + modulator * 0.5);
  
  // Convert back to Cartesian
  vec2 p = vec2(cos(a), sin(a)) * r;
  
  // Create patterns
  float pattern1 = sin(p.x * uWaveFrequency * 10.0 + time) * 
                   cos(p.y * uWaveFrequency * 10.0 + time * 1.3);
  float pattern2 = sin(length(p) * uWaveFrequency * 20.0 - time * 2.0);
  float pattern3 = sin(a * segments + time);
  
  float combined = (pattern1 + pattern2 + pattern3) / 3.0;
  combined = combined * 0.5 + 0.5;
  combined *= uIntensity;
  combined *= (1.0 + modulator * 0.5);
  
  // Create color based on angle and patterns
  float hue = a / TAU + time * 0.1 + combined * 0.2;
  float sat = 0.7 + 0.3 * sin(r * 5.0 + time);
  float val = combined;
  
  vec3 hsvColor = hsv2rgb(vec3(hue, sat, val));
  
  // Mix with primary and secondary colors
  vec3 color1 = mix(uPrimaryColor, hsvColor, 0.5);
  vec3 color2 = mix(uSecondaryColor, hsvColor, 0.5);
  
  float mixFactor = sin(combined * PI + time) * 0.5 + 0.5;
  vec3 finalColor = mix(color1, color2, mixFactor);
  
  // Add background blend at edges
  float edgeFade = smoothstep(1.5, 0.5, r);
  finalColor = mix(uBackgroundColor, finalColor, edgeFade);
  
  // Add center glow
  float centerGlow = exp(-r * 3.0) * uIntensity * (1.0 + modulator);
  finalColor += centerGlow * mix(uPrimaryColor, uSecondaryColor, 0.5);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
