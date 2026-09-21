// fullscreen.vert — shared vertex shader for all LexLens fragment shaders (GLSL ES 1.00 / WebGL1)
// Draws a fullscreen triangle strip quad. vUv: (0,0) bottom-left → (1,1) top-right.
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
