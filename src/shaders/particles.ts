export const particlesVertexShader = `
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uAudioLevel;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;
uniform int uMirrorSegments;
// Device pixels per CSS pixel for the target being rendered
uniform float uPixelRatio;

#define PI 3.14159265359
#define TAU 6.28318530718

attribute float aRandom;
attribute float aSize;

varying float vRandom;
varying float vDistance;

void main() {
  vRandom = aRandom;
  
  float time = uTime * uSpeed;
  float modulator = uAnimationMode == 1 ? uAudioLevel : 1.0;
  
  vec3 pos = position;
  
  // Swirling motion
  float angle = time * uCtlSwirlSpeed + aRandom * 6.28318;
  float radius = length(pos.xy) * (1.0 + modulator * 0.3);
  
  pos.x = cos(angle) * radius + sin(time * 0.3 + aRandom * 10.0) * uCtlWobble;
  pos.y = sin(angle) * radius + cos(time * 0.4 + aRandom * 10.0) * uCtlWobble;
  pos.z = sin(time * 0.2 + aRandom * 5.0) * uCtlDepthWave * modulator;
  
  pos *= uScale;
  
  // Apply mirror segments effect
  if (uMirrorQuadrants == 1) {
    float segments = float(uMirrorSegments);
    float r = length(pos.xy);
    float a = atan(pos.y, pos.x);
    float segmentAngle = TAU / segments;
    a = mod(a, segmentAngle);
    if (mod(floor(atan(pos.y, pos.x) / segmentAngle), 2.0) == 1.0) {
      a = segmentAngle - a;
    }
    pos.xy = vec2(cos(a), sin(a)) * r;
  }
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;
  
  float size = aSize * (1.0 + modulator * 2.0);
  // Size in screen pixels (Point Size 300 = 100%), slightly larger when nearer.
  // The old perspective formula (size * 300 / depth) made every point 1500+
  // pixels wide under the orthographic camera, filling the screen white.
  float nearness = clamp(1.0 + pos.z * 0.25, 0.5, 1.5);
  gl_PointSize = size * (uCtlPointSize / 300.0) * nearness * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const particlesFragmentShader = `
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform float uIntensity;
uniform float uTime;

varying float vRandom;
varying float vDistance;

void main() {
  // Create circular particles with soft edges
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  
  if (dist > 0.5) discard;
  
  float alpha = 1.0 - smoothstep(uCtlSoftness, 0.5, dist);
  alpha *= uIntensity;
  
  // Color based on random value and time
  float colorMix = sin(vRandom * 10.0 + uTime) * 0.5 + 0.5;
  vec3 color = mix(uPrimaryColor, uSecondaryColor, colorMix);
  
  // Add glow
  float glow = exp(-dist * 4.0);
  color += glow * uCtlGlow;
  
  // Fade based on distance
  alpha *= 1.0 - smoothstep(2.0, 10.0, vDistance);
  
  gl_FragColor = vec4(color, alpha);
}
`;
