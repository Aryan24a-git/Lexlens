// marble-hero.frag — verde marble with brass veining (landing hero + workspace shell)
// Domain-warped fBm gives slow-drifting stone; thin sharp ridges become brass veins.
// Uniforms: uTime, uResolution, uMouse (built-in via ShaderCanvas)
//           uBase (vec3 deep base), uMid (vec3 lighter stone), uVein (vec3 brass), uIntensity (float 0..1)
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uBase;
uniform vec3 uMid;
uniform vec3 uVein;
uniform float uIntensity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.2;

  float t = uTime * 0.035;                 // very slow drift
  vec2 m = (uMouse - 0.5) * 0.30;          // gentle pointer parallax

  // Two-level domain warp (Inigo Quilez style) for stone-like flow
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 1.5),
                fbm(p + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.5 * r + m);

  // Veins: thin, sharp ridges from a warped sine field
  float v1 = abs(sin((p.x * 0.9 + p.y * 0.6 + f * 6.0 + r.x * 2.0) * 2.51327));
  v1 = pow(1.0 - v1, 9.0);
  float v2 = abs(sin((p.y * 1.3 - p.x * 0.4 + r.y * 5.0) * 2.4));
  v2 = pow(1.0 - v2, 16.0);

  vec3 col = mix(uBase, uMid, smoothstep(0.18, 0.92, f));
  col += uVein * (v1 * 0.55 + v2 * 0.30) * uIntensity;

  // Soft brass light following the pointer
  float spot = smoothstep(0.65, 0.0, length(uv - uMouse));
  col += uVein * 0.05 * spot * uIntensity;

  // Vignette keeps edges calm so UI sits on top
  float vg = smoothstep(1.3, 0.2, length(uv - 0.5) * 1.45);
  col *= mix(0.55, 1.0, vg);

  gl_FragColor = vec4(col, 1.0);
}
