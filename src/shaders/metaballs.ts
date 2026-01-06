export const metaballsVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const metaballsFragmentShader = `
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
uniform int uBlobCount;
uniform int uAnimationMode; // 0 = time-based, 1 = audio-reactive
uniform int uMirrorQuadrants; // 0 = off, 1 = on

varying vec2 vUv;

// Simplex noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float metaball(vec2 p, vec2 center, float radius) {
  float d = length(p - center);
  return radius / (d * d + 0.001);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  
  // Apply mirror quadrant effect
  if (uMirrorQuadrants == 1) {
    uv = abs(uv);
  }
  
  uv.x *= uResolution.x / uResolution.y;
  
  float time = uTime * uSpeed;
  float modulator = uAnimationMode == 1 ? uAudioLevel : 1.0;
  float evolutionTime = time * uEvolutionRate;
  
  // Accumulate metaball values
  float m = 0.0;
  
  for (int i = 0; i < 10; i++) {
    if (i >= uBlobCount) break;
    
    float fi = float(i);
    float angle = evolutionTime * (0.5 + fi * 0.1) + fi * 1.2566; // 2*PI/5
    float radius = 0.15 + 0.1 * sin(evolutionTime * 0.7 + fi);
    
    // Add noise-based movement
    float noiseX = snoise(vec2(fi * 10.0, evolutionTime * 0.5)) * 0.5;
    float noiseY = snoise(vec2(fi * 10.0 + 100.0, evolutionTime * 0.5)) * 0.5;
    
    vec2 center = vec2(
      sin(angle) * (0.5 + 0.3 * modulator) + noiseX,
      cos(angle * 0.7) * (0.5 + 0.3 * modulator) + noiseY
    ) * uScale;
    
    float blobSize = (0.3 + 0.2 * sin(evolutionTime + fi * 2.0)) * uIntensity;
    blobSize *= (1.0 + modulator * 0.5);
    
    m += metaball(uv, center, blobSize);
  }
  
  // Create smooth threshold
  float threshold = 1.0;
  float edge = 0.1 * (1.0 + modulator * 0.5);
  float shape = smoothstep(threshold - edge, threshold + edge, m);
  
  // Color mixing based on metaball value
  float colorMix = sin(m * uWaveFrequency + evolutionTime) * 0.5 + 0.5;
  vec3 blobColor = mix(uPrimaryColor, uSecondaryColor, colorMix);
  
  // Add glow effect
  float glow = m * 0.1 * uIntensity;
  vec3 glowColor = mix(uPrimaryColor, uSecondaryColor, 0.5) * glow;
  
  // Final color
  vec3 finalColor = mix(uBackgroundColor + glowColor, blobColor, shape);
  
  // Add subtle vignette
  float vignette = 1.0 - length(vUv - 0.5) * 0.5;
  finalColor *= vignette;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
