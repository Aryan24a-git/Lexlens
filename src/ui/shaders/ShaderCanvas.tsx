"use client";

/**
 * ShaderCanvas — the ONLY way LexLens renders shaders (see docs/design.md §6, §12).
 *
 * - Raw WebGL1, zero dependencies (~3 KB). Works with every *.frag in assets/shaders.
 * - Built-in uniforms: uTime (s), uResolution (CSS px), uMouse (0..1, bottom-left origin, smoothed).
 * - Pass any other uniforms via `uniforms` (number | vec2 | vec3 | vec4). Changing them does NOT rebuild the program.
 * - Pauses when off-screen or the tab is hidden; caps DPR and FPS; handles context loss.
 * - prefers-reduced-motion → renders ONE static frame (at `staticTime`) and never animates.
 * - No WebGL / compile failure → canvas hides itself and calls `onUnsupported` so the CSS/SVG fallback shows.
 *
 * NOTE: we intentionally do NOT call WEBGL_lose_context on unmount — it breaks React StrictMode's
 * mount → unmount → mount cycle on the same <canvas>. Program/buffer are deleted instead.
 */

import { useEffect, useRef } from "react";

export type UniformValue =
  | number
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number];

export interface ShaderCanvasProps {
  /** Fragment shader source (import from `@/ui/shaders/generated`). */
  fragment: string;
  /** Optional custom vertex shader; defaults to the fullscreen quad. */
  vertex?: string;
  uniforms?: Record<string, UniformValue>;
  className?: string;
  /** Track the pointer (window-level) and feed uMouse. */
  interactive?: boolean;
  /** Device-pixel-ratio cap. Default 1.5. */
  maxDpr?: number;
  /** Frame cap. Use 30 for background shaders. Default 60. */
  maxFps?: number;
  /** Transparent canvas (overlays: scan-beam, risk-aura, paper-grain). Shaders must output premultiplied alpha. */
  transparent?: boolean;
  /** Time (s) used for the single static frame when reduced motion is on. Default 12. */
  staticTime?: number;
  /** Provide a label only if the canvas conveys meaning; leave empty for decorative use. */
  ariaLabel?: string;
  /** Called if WebGL is unavailable or the shader fails to compile. */
  onUnsupported?: () => void;
}

/** Same as assets/shaders/fullscreen.vert (kept inline so the component works standalone). */
export const DEFAULT_VERTEX = `attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

/** "#BF9B52" → [0.749, 0.608, 0.322] */
export function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function ShaderCanvas({
  fragment,
  vertex = DEFAULT_VERTEX,
  uniforms = {},
  className,
  interactive = false,
  maxDpr = 1.5,
  maxFps = 60,
  transparent = false,
  staticTime = 12,
  ariaLabel,
  onUnsupported,
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<Record<string, UniformValue>>(uniforms);
  const unsupportedRef = useRef(onUnsupported);

  useEffect(() => {
    uniformsRef.current = uniforms;
  }, [uniforms]);

  useEffect(() => {
    unsupportedRef.current = onUnsupported;
  }, [onUnsupported]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof window !== "undefined" && !("WebGLRenderingContext" in window)) {
      canvas.style.display = "none";
      unsupportedRef.current?.();
      return;
    }

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: transparent,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
    } catch {
      gl = null;
    }
    if (!gl) {
      canvas.style.display = "none";
      unsupportedRef.current?.();
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    const locations = new Map<string, WebGLUniformLocation | null>();

    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[ShaderCanvas] compile error:", gl.getShaderInfoLog(shader));
        }
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const setup = (): boolean => {
      const vs = compile(gl.VERTEX_SHADER, vertex);
      const fs = compile(gl.FRAGMENT_SHADER, fragment);
      if (!vs || !fs) return false;
      const p = gl.createProgram();
      if (!p) return false;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[ShaderCanvas] link error:", gl.getProgramInfoLog(p));
        }
        gl.deleteProgram(p);
        return false;
      }
      program = p;
      locations.clear();
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.useProgram(program);
      const loc = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      return true;
    };

    if (!setup()) {
      canvas.style.display = "none";
      unsupportedRef.current?.();
      return;
    }

    const setUniform = (name: string, v: UniformValue) => {
      if (!program) return;
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      const loc = locations.get(name);
      if (!loc) return; // uniform unused by this shader — ignore
      if (typeof v === "number") gl.uniform1f(loc, v);
      else if (v.length === 2) gl.uniform2f(loc, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2]);
      else gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
    };

    // --- sizing -----------------------------------------------------------
    let cssW = 1;
    let cssH = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const rect = canvas.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      const w = Math.max(1, Math.round(cssW * dpr));
      const h = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    // --- pointer (smoothed) ---------------------------------------------------
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      mouse.tx = clamp01((e.clientX - r.left) / r.width);
      mouse.ty = clamp01(1 - (e.clientY - r.top) / r.height);
    };
    if (interactive) window.addEventListener("pointermove", onPointer, { passive: true });

    // --- drawing ---------------------------------------------------------------
    const draw = (time: number) => {
      if (!program) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      setUniform("uTime", time);
      setUniform("uResolution", [cssW, cssH]);
      setUniform("uMouse", [mouse.x, mouse.y]);
      for (const [name, value] of Object.entries(uniformsRef.current)) setUniform(name, value);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // --- loop ------------------------------------------------------------------
    let raf = 0;
    let visible = true;
    let last = 0;
    const startedAt = performance.now();
    const minFrame = 1000 / Math.max(1, maxFps);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      if (now - last < minFrame) return;
      last = now;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      draw((now - startedAt) / 1000);
    };

    const startLoop = () => {
      cancelAnimationFrame(raf);
      resize();
      if (reduceMotion.matches) draw(staticTime);
      else raf = requestAnimationFrame(frame);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion.matches) draw(staticTime); // resizing clears the buffer
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      canvas.style.visibility = "hidden"; // CSS/SVG fallback underneath becomes visible
    };
    const onRestored = () => {
      if (setup()) {
        canvas.style.visibility = "visible";
        startLoop();
      } else {
        unsupportedRef.current?.();
      }
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    reduceMotion.addEventListener("change", startLoop);

    startLoop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      reduceMotion.removeEventListener("change", startLoop);
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
    };
  }, [fragment, vertex, interactive, maxDpr, maxFps, transparent, staticTime]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel || undefined}
      aria-hidden={ariaLabel ? undefined : true}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
