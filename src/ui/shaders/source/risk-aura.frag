// risk-aura.frag — soft, slowly pulsing glow behind the *selected* IndexTab.
// Small canvas (~96x96). One instance at a time. Transparent (premultiplied alpha).
// Uniforms: uColor (vec3 risk colour), uIntensity (0..1), uTime, uResolution
precision mediump float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform float uIntensity;

void main() {
  vec2 p = vUv - 0.5;
  p.x *= uResolution.x / max(uResolution.y, 1.0);

  float ang = atan(p.y, p.x);
  float t = uTime * 0.7;
  // Organic, non-circular edge
  float wob = 0.05 * sin(ang * 3.0 + t) + 0.03 * sin(ang * 5.0 - t * 1.3);
  float d = length(p) - (0.20 + wob);

  float pulse = 0.85 + 0.15 * sin(uTime * 1.6);
  float glow = exp(-max(d, 0.0) * 9.0) * 0.75;      // outer falloff
  float core = smoothstep(0.0, -0.22, d) * 0.22;    // soft inner body
  float a = clamp((glow + core) * pulse * uIntensity, 0.0, 1.0);

  gl_FragColor = vec4(uColor * a, a);               // premultiplied
}
