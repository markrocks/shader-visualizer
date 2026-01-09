export const plasmaVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const plasmaFragmentShader = `
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
uniform int uPlasmaComplexity;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  
  // Apply mirror segments effect
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
  uv *= uScale;
  
  float time = uTime * uSpeed * uEvolutionRate;
  float modulator = uAnimationMode == 1 ? uAudioLevel : 1.0;
  float complexity = float(uPlasmaComplexity);
  
  // Classic plasma using overlapping sine waves
  float plasma = 0.0;
  
  // Horizontal waves
  plasma += sin(uv.x * uWaveFrequency * 3.0 + time);
  plasma += sin((uv.x * uWaveFrequency * 2.0 + uv.y * uWaveFrequency * 1.5 + time * 0.7) * 1.2);
  
  // Circular waves
  float cx = uv.x + 0.5 * sin(time * 0.3);
  float cy = uv.y + 0.5 * cos(time * 0.4);
  plasma += sin(sqrt(cx * cx + cy * cy + 1.0) * uWaveFrequency * 4.0 - time);
  
  // Diagonal waves
  plasma += sin((uv.x * uWaveFrequency + uv.y * uWaveFrequency + time * 0.5) * 2.0);
  
  // Additional complexity layers
  for (int i = 0; i < 8; i++) {
    if (i >= int(complexity)) break;
    float fi = float(i) + 1.0;
    float angle = time * 0.1 * fi;
    vec2 offset = vec2(sin(angle), cos(angle)) * 0.5;
    plasma += sin(length(uv - offset) * uWaveFrequency * fi * 2.0 - time * fi * 0.3) / fi;
  }
  
  // Normalize and apply audio modulation
  plasma = plasma / (4.0 + complexity * 0.5);
  plasma = plasma * (1.0 + modulator * 0.5);
  
  // Map to 0-1 range
  float colorValue = (plasma + 1.0) * 0.5;
  colorValue = pow(colorValue, 1.0 / (uIntensity + 0.5));
  
  // Create vibrant color transitions between primary and secondary
  vec3 color1 = uPrimaryColor;
  vec3 color2 = uSecondaryColor;
  
  // Use sin for smooth cyclic color transitions
  float colorCycle = sin(colorValue * PI * 2.0) * 0.5 + 0.5;
  vec3 baseColor = mix(color1, color2, colorCycle);
  
  // Add brightness variation based on plasma value
  float brightness = 0.5 + 0.5 * sin(colorValue * PI);
  vec3 finalColor = baseColor * (0.5 + brightness * uIntensity);
  
  // Add glow at peaks
  float glow = smoothstep(0.4, 0.8, colorValue) * uIntensity * 0.5;
  finalColor += glow * (color1 + color2) * 0.3;
  
  // Slight background tint at valleys
  float valley = 1.0 - smoothstep(0.0, 0.3, colorValue);
  finalColor = mix(finalColor, uBackgroundColor + finalColor * 0.3, valley * 0.3);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
