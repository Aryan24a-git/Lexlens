/**
 * Landing Hero Shader Component.
 * Verde marble with domain-warped fBm veins and subtle brass pointer light.
 * design.md §6, §7.1, §12
 */

"use client";

import { useState } from "react";
import { ShaderCanvas, hexToVec3 } from "@/ui/shaders/ShaderCanvas";
import { marbleHeroFrag } from "@/ui/shaders/generated";

export interface LandingHeroShaderProps {
  className?: string;
  intensity?: number;
}

export function LandingHeroShader({
  className = "absolute inset-0 -z-10",
  intensity = 0.9,
}: LandingHeroShaderProps) {
  const [webglSupported, setWebglSupported] = useState(true);

  // Verde marble palette: deep base, lighter stone, brass veining
  const uBase = hexToVec3("#08201D");
  const uMid = hexToVec3("#17403A");
  const uVein = hexToVec3("#BF9B52");

  return (
    <div className={className} aria-hidden="true">
      {/* ── WebGL 1.00 Domain-Warped fBm Marble ── */}
      {webglSupported ? (
        <ShaderCanvas
          fragment={marbleHeroFrag}
          uniforms={{
            uBase,
            uMid,
            uVein,
            uIntensity: intensity,
          }}
          interactive={true}
          maxDpr={1.5}
          maxFps={30}
          staticTime={12}
          ariaLabel=""
          className="absolute inset-0 size-full"
          onUnsupported={() => setWebglSupported(false)}
        />
      ) : null}

      {/* ── CSS Fallback if WebGL is unavailable or fails ── */}
      {!webglSupported && (
        <div
          className="absolute inset-0 size-full"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 40%, var(--baize-800) 0%, var(--baize-900) 60%),
              radial-gradient(ellipse 50% 80% at 80% 20%, color-mix(in srgb, var(--brass-500) 8%, var(--baize-950)) 0%, var(--baize-950) 50%)
            `,
          }}
        />
      )}

      {/* ── Noise texture tooth overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{
          backgroundImage: "url('/svg/noise.svg')",
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── Dark scrim (≥ 55% opacity) to guarantee WCAG AA contrast on hero copy ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,32,29,0.50) 0%, rgba(8,32,29,0.70) 100%)",
        }}
      />
    </div>
  );
}
