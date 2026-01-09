export const voronoiVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const voronoiFragmentShader = `
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
uniform int uVoronoiCells;
uniform float uVoronoiEdgeWidth;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

// Random function
vec2 random2(vec2 p) {
  return fract(sin(vec2(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3))
  )) * 43758.5453);
}

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
  
  float time = uTime * uSpeed * uEvolutionRate;
  float modulator = uAnimationMode == 1 ? uAudioLevel : 1.0;
  float cells = float(uVoronoiCells) * uScale;
  
  // Scale UV for cell count
  vec2 scaledUv = uv * cells * 0.5;
  
  // Cell coordinates
  vec2 iuv = floor(scaledUv);
  vec2 fuv = fract(scaledUv);
  
  float minDist = 10.0;
  float secondMinDist = 10.0;
  vec2 minPoint = vec2(0.0);
  float minCellId = 0.0;
  
  // Check neighboring cells
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 cellId = iuv + neighbor;
      
      // Random point within cell, animated
      vec2 point = random2(cellId);
      point = 0.5 + 0.4 * sin(time * uWaveFrequency + TAU * point);
      point *= (1.0 + modulator * 0.3);
      
      vec2 diff = neighbor + point - fuv;
      float dist = length(diff);
      
      if (dist < minDist) {
        secondMinDist = minDist;
        minDist = dist;
        minPoint = point;
        minCellId = random2(cellId).x;
      } else if (dist < secondMinDist) {
        secondMinDist = dist;
      }
    }
  }
  
  // Edge detection
  float edge = secondMinDist - minDist;
  float edgeWidth = uVoronoiEdgeWidth * (1.0 + modulator * 0.5);
  float edgeFactor = smoothstep(0.0, edgeWidth, edge);
  
  // Cell color based on cell ID
  float hue = minCellId + time * 0.1;
  float cellBrightness = 0.5 + 0.5 * sin(minCellId * TAU + time);
  cellBrightness *= uIntensity;
  cellBrightness *= (1.0 + modulator * 0.3);
  
  // Mix colors based on cell properties
  vec3 cellColor = mix(uPrimaryColor, uSecondaryColor, minCellId);
  cellColor = mix(cellColor, uBackgroundColor, 1.0 - cellBrightness);
  
  // Edge color (darker or use background)
  vec3 edgeColor = uBackgroundColor * 0.3;
  
  // Final color
  vec3 finalColor = mix(edgeColor, cellColor, edgeFactor);
  
  // Add subtle glow based on distance to center of cell
  float centerGlow = 1.0 - minDist * 2.0;
  centerGlow = max(0.0, centerGlow);
  finalColor += centerGlow * uPrimaryColor * uIntensity * 0.3;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
