export const truchetVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const truchetFragmentShader = `
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
uniform float uTruchetGridSize;
uniform float uTruchetLineWidth;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;

varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

// Hash function for pseudo-random values
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// Smooth min for blending
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// Distance to a line segment
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Distance to an arc
float sdArc(vec2 p, vec2 center, float radius, float startAngle, float endAngle) {
  vec2 d = p - center;
  float angle = atan(d.y, d.x);
  
  // Normalize angles
  if (angle < 0.0) angle += TAU;
  if (startAngle < 0.0) startAngle += TAU;
  if (endAngle < 0.0) endAngle += TAU;
  
  // Check if point is within arc
  float dist = abs(length(d) - radius);
  
  // Simple arc check
  if (startAngle <= endAngle) {
    if (angle >= startAngle && angle <= endAngle) {
      return dist;
    }
  } else {
    if (angle >= startAngle || angle <= endAngle) {
      return dist;
    }
  }
  
  // Distance to endpoints
  vec2 p1 = center + radius * vec2(cos(startAngle), sin(startAngle));
  vec2 p2 = center + radius * vec2(cos(endAngle), sin(endAngle));
  return min(length(p - p1), length(p - p2));
}

// Classic Truchet quarter-circle arcs
float truchetTile(vec2 uv, float tileType, float lineWidth) {
  float d = 1e10;
  
  // Quarter circles at opposite corners based on tile type
  if (tileType < 0.5) {
    // Type A: bottom-left to top-left, bottom-right to top-right
    d = min(d, abs(length(uv - vec2(0.0, 0.0)) - 0.5));
    d = min(d, abs(length(uv - vec2(1.0, 1.0)) - 0.5));
  } else {
    // Type B: bottom-left to bottom-right, top-left to top-right
    d = min(d, abs(length(uv - vec2(1.0, 0.0)) - 0.5));
    d = min(d, abs(length(uv - vec2(0.0, 1.0)) - 0.5));
  }
  
  return smoothstep(lineWidth, lineWidth * 0.5, d);
}

// Extended truchet with decorations
float truchetTileExtended(vec2 uv, float tileType, float subType, float lineWidth, float time) {
  float d = 1e10;
  
  // Base quarter circles
  if (mod(tileType * 4.0, 2.0) < 1.0) {
    d = min(d, abs(length(uv - vec2(0.0, 0.0)) - 0.5));
    d = min(d, abs(length(uv - vec2(1.0, 1.0)) - 0.5));
  } else {
    d = min(d, abs(length(uv - vec2(1.0, 0.0)) - 0.5));
    d = min(d, abs(length(uv - vec2(0.0, 1.0)) - 0.5));
  }
  
  // Center decorations based on subType
  vec2 center = vec2(0.5);
  float decoration = 0.0;
  
  float decorType = mod(subType * 8.0, 8.0);
  
  if (decorType < 1.0) {
    // Small circle
    decoration = abs(length(uv - center) - 0.15);
  } else if (decorType < 2.0) {
    // Cross
    decoration = min(
      sdSegment(uv, center - vec2(0.15, 0.0), center + vec2(0.15, 0.0)),
      sdSegment(uv, center - vec2(0.0, 0.15), center + vec2(0.0, 0.15))
    );
  } else if (decorType < 3.0) {
    // Diamond
    decoration = sdSegment(uv, center + vec2(0.0, 0.15), center + vec2(0.15, 0.0));
    decoration = min(decoration, sdSegment(uv, center + vec2(0.15, 0.0), center + vec2(0.0, -0.15)));
    decoration = min(decoration, sdSegment(uv, center + vec2(0.0, -0.15), center + vec2(-0.15, 0.0)));
    decoration = min(decoration, sdSegment(uv, center + vec2(-0.15, 0.0), center + vec2(0.0, 0.15)));
  } else if (decorType < 4.0) {
    // Dot
    decoration = length(uv - center) - 0.05;
  } else if (decorType < 5.0) {
    // Animated rotating lines
    float angle = time * 0.5;
    vec2 dir1 = vec2(cos(angle), sin(angle)) * 0.12;
    vec2 dir2 = vec2(cos(angle + PI/2.0), sin(angle + PI/2.0)) * 0.12;
    decoration = min(
      sdSegment(uv, center - dir1, center + dir1),
      sdSegment(uv, center - dir2, center + dir2)
    );
  } else if (decorType < 6.0) {
    // Concentric circles
    float r = length(uv - center);
    decoration = min(abs(r - 0.1), abs(r - 0.18));
  } else if (decorType < 7.0) {
    // Arrow pointing in random direction
    float arrowAngle = subType * TAU;
    vec2 dir = vec2(cos(arrowAngle), sin(arrowAngle));
    decoration = sdSegment(uv, center - dir * 0.12, center + dir * 0.12);
    decoration = min(decoration, sdSegment(uv, center + dir * 0.12, center + dir * 0.06 + vec2(-dir.y, dir.x) * 0.06));
    decoration = min(decoration, sdSegment(uv, center + dir * 0.12, center + dir * 0.06 - vec2(-dir.y, dir.x) * 0.06));
  } else {
    // Nothing extra
    decoration = 1e10;
  }
  
  d = min(d, decoration);
  
  return smoothstep(lineWidth, lineWidth * 0.3, d);
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
  float modulator = uAnimationMode == 1 ? (1.0 + uAudioLevel * 0.5) : 1.0;
  
  // Scale and center the grid
  float gridSize = uTruchetGridSize * uScale;
  vec2 scaledUv = (uv + 1.0) * 0.5 * gridSize;
  
  // Add subtle movement
  scaledUv += vec2(sin(time * 0.2), cos(time * 0.15)) * 0.5 * modulator;
  
  // Get tile coordinates
  vec2 tileId = floor(scaledUv);
  vec2 tileUv = fract(scaledUv);
  
  // Get random values for this tile
  float tileType = hash21(tileId);
  float subType = hash21(tileId + 100.0);
  
  // Animate some tiles
  float animatedLineWidth = uTruchetLineWidth * (0.8 + 0.4 * sin(time + tileType * TAU));
  animatedLineWidth *= modulator;
  
  // Draw the truchet pattern
  float pattern = truchetTileExtended(tileUv, tileType, subType, animatedLineWidth, time);
  
  // Add glow effect
  float glow = truchetTileExtended(tileUv, tileType, subType, animatedLineWidth * 3.0, time) * 0.3;
  
  // Color based on position and time
  float colorMix = sin(tileId.x * 0.3 + tileId.y * 0.2 + time * 0.5) * 0.5 + 0.5;
  vec3 lineColor = mix(uPrimaryColor, uSecondaryColor, colorMix);
  
  // Add some variation based on tile
  lineColor *= 0.8 + 0.4 * hash21(tileId + 50.0);
  
  // Apply intensity
  lineColor *= uIntensity * 1.2;
  
  // Final color
  vec3 finalColor = uBackgroundColor;
  finalColor = mix(finalColor, lineColor * 0.3, glow); // Glow layer
  finalColor = mix(finalColor, lineColor, pattern);   // Main pattern
  
  // Subtle pulsing background
  float bgPulse = sin(time * uWaveFrequency) * 0.05 + 1.0;
  finalColor *= bgPulse;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
