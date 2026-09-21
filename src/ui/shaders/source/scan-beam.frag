// scan-beam.frag — brass scan beam sweeping down the paper sheet during analysis.
// Transparent overlay (premultiplied alpha). Use with <ShaderCanvas transparent />.
// Uniforms: uProgress (0..1, top→bottom; drive from real streaming progress), uColor (vec3), uTime, uResolution
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec3 uColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  float y = 1.0 - vUv.y;                     // 0 at top, 1 at bottom
  float d = y - uProgress;

  // Beam core + halo, slightly breathing
  float breathe = 0.92 + 0.08 * sin(uTime * 6.0);
  float beam = exp(-abs(d) * 110.0) * breathe;
  float halo = exp(-abs(d) * 14.0) * 0.22;

  // Already-scanned region: faint "text rows" that fade away from the beam
  float behind = step(y, uProgress);
  float fade = 1.0 - smoothstep(0.0, 0.32, uProgress - y);
  float rowH = 14.0;
  float row = step(0.58, fract(y * uResolution.y / rowH));
  float col = step(0.18, hash(vec2(floor(vUv.x * uResolution.x / 9.0), floor(y * uResolution.y / rowH))));
  float rows = row * col * behind * fade * 0.16;

  float a = clamp(beam + halo + rows, 0.0, 1.0);
  vec3 c = uColor * (0.85 + 0.35 * beam);
  gl_FragColor = vec4(c * a, a);              // premultiplied
}
