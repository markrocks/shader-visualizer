export const particlesVertexShader = `
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uAudioLevel;
uniform int uAnimationMode;
uniform int uMirrorQuadrants;

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
  float angle = time * 0.5 + aRandom * 6.28318;
  float radius = length(pos.xy) * (1.0 + modulator * 0.3);
  
  pos.x = cos(angle) * radius + sin(time * 0.3 + aRandom * 10.0) * 0.2;
  pos.y = sin(angle) * radius + cos(time * 0.4 + aRandom * 10.0) * 0.2;
  pos.z = sin(time * 0.2 + aRandom * 5.0) * 0.5 * modulator;
  
  pos *= uScale;
  
  // Apply mirror quadrant effect by mirroring positions into top-right quadrant
  if (uMirrorQuadrants == 1) {
    pos.xy = abs(pos.xy);
  }
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;
  
  float size = aSize * (1.0 + modulator * 2.0);
  gl_PointSize = size * (300.0 / -mvPosition.z);
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
  
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
  alpha *= uIntensity;
  
  // Color based on random value and time
  float colorMix = sin(vRandom * 10.0 + uTime) * 0.5 + 0.5;
  vec3 color = mix(uPrimaryColor, uSecondaryColor, colorMix);
  
  // Add glow
  float glow = exp(-dist * 4.0);
  color += glow * 0.3;
  
  // Fade based on distance
  alpha *= 1.0 - smoothstep(2.0, 10.0, vDistance);
  
  gl_FragColor = vec4(color, alpha);
}
`;
