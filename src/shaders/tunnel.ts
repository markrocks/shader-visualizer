export const tunnelVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const tunnelFragmentShader = `
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
uniform float uTunnelDepth;
uniform int uTunnelRings;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  
  // Apply mirror segments effect first (before polar transformation)
  if (uMirrorQuadrants == 1) {
    float segments = float(uMirrorSegments);
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    float segmentAngle = TAU / segments;
    a = mod(a, segmentAngle);
    if (mod(floor(atan(uv.y, uv.x) / segmentAngle), 2.0) == 1.0) {
      a = segmentAngle - a;
    }
    uv = vec2(cos(a), sin(a)) * r;
  }
  
  uv.x *= uResolution.x / uResolution.y;
  
  float time = uTime * uSpeed;
  float modulator = uAnimationMode == 1 ? uAudioLevel : 1.0;
  float rings = float(uTunnelRings);
  
  // Convert to polar coordinates
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  
  // Prevent division by zero at center
  radius = max(radius, 0.001);
  
  // Create tunnel depth effect (inverse radius = depth)
  float depth = 1.0 / radius * uTunnelDepth * uScale;
  
  // Animate through the tunnel
  depth += time * uEvolutionRate * 2.0;
  
  // Audio reactivity - pulse the depth
  depth *= (1.0 + modulator * 0.3);
  
  // Create ring pattern
  float ringPattern = sin(depth * rings * uWaveFrequency) * 0.5 + 0.5;
  
  // Create angular pattern (segments)
  float segments = 8.0;
  float anglePattern = sin(angle * segments + time * 0.5) * 0.5 + 0.5;
  
  // Combine patterns
  float pattern = ringPattern * 0.7 + anglePattern * 0.3;
  pattern = pow(pattern, 1.0 / (uIntensity + 0.3));
  
  // Create warping effect
  float warp = sin(depth * 2.0 + angle * 3.0 + time) * 0.1;
  pattern += warp * modulator;
  
  // Color gradient based on depth
  float colorMix = fract(depth * 0.05 + time * 0.1);
  
  // Mix colors with cycling
  vec3 color1 = uPrimaryColor;
  vec3 color2 = uSecondaryColor;
  vec3 tunnelColor = mix(color1, color2, colorMix);
  
  // Apply pattern to color with minimum brightness
  tunnelColor *= (0.3 + pattern * 0.7);
  
  // Add glow effect near center (bright light at end of tunnel)
  float centerGlow = smoothstep(0.6, 0.0, radius) * uIntensity;
  tunnelColor += centerGlow * (color1 + color2) * 0.6;
  
  // Subtle edge darkening (not too aggressive)
  float edgeDark = smoothstep(0.5, 1.5, radius) * 0.4;
  tunnelColor = mix(tunnelColor, tunnelColor * 0.3 + uBackgroundColor * 0.2, edgeDark);
  
  // Add subtle scanlines for extra effect
  float scanline = sin(depth * 30.0) * 0.05 + 1.0;
  tunnelColor *= scanline;
  
  // Soft vignette
  float vignette = 1.0 - radius * 0.3;
  vignette = max(0.3, vignette);
  tunnelColor *= vignette;
  
  // Add extra brightness to make it pop
  tunnelColor = tunnelColor * 1.2;
  
  gl_FragColor = vec4(tunnelColor, 1.0);
}
`;
