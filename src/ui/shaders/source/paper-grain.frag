// paper-grain.frag — ultra-light film/paper grain overlay (fixed, pointer-events:none).
// Transparent, premultiplied. Updates ~12 times per second so it feels like tooth, not noise.
// Uniforms: uAmount (0..0.12, default 0.05), uTime
precision mediump float;

varying vec2 vUv;
uniform float uTime;
uniform float uAmount;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

void main() {
  float n = hash(gl_FragCoord.xy + floor(uTime * 12.0) * 17.0);
  float a = (n - 0.5) * 2.0 * uAmount;               // -uAmount .. +uAmount
  vec3 c = a > 0.0 ? vec3(1.0) : vec3(0.0);
  float alpha = abs(a);
  gl_FragColor = vec4(c * alpha, alpha);             // premultiplied
}
