"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ShaderCanvas, hexToVec3 } from "@/ui/shaders/ShaderCanvas";
import { scanBeamFrag } from "@/ui/shaders/generated";

export interface ScanOverlayProps {
  progress: number; // 0.0 to 1.0
  statusText?: string;
  isAnalyzing: boolean;
  className?: string;
}

export function ScanOverlay({
  progress,
  statusText,
  isAnalyzing,
  className,
}: ScanOverlayProps) {
  const [webglSupported, setWebglSupported] = useState(true);

  if (!isAnalyzing) {
    return null;
  }

  // Brass color for scan beam: #bf9b52
  const brassVec3 = hexToVec3("#bf9b52");

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const progressPercent = Math.round(clampedProgress * 100);

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-sm transition-opacity duration-300",
        className
      )}
    >
      {/* ── Accessible live region for screen readers ── */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusText || `Analyzing document: ${progressPercent}% complete`}
      </div>

      {/* ── WebGL Shader Scan Beam ── */}
      {webglSupported ? (
        <ShaderCanvas
          fragment={scanBeamFrag}
          transparent={true}
          uniforms={{
            uProgress: clampedProgress,
            uColor: brassVec3,
          }}
          className="absolute inset-0 size-full"
          onUnsupported={() => setWebglSupported(false)}
        />
      ) : (
        /* ── CSS Fallback if WebGL is unavailable ── */
        <div
          className="absolute left-0 right-0 h-1 bg-[var(--brass-500)] shadow-[0_0_12px_var(--brass-300)] transition-all duration-300 ease-out"
          style={{ top: `${progressPercent}%` }}
          aria-hidden="true"
        />
      )}

      {/* ── Status Pill Indicator floating in top corner ── */}
      <div className="absolute top-4 right-4 pointer-events-auto bg-[var(--baize-950)]/90 border border-[var(--brass-500)] text-[var(--brass-300)] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-ui backdrop-blur-xs">
        <span className="size-2 rounded-full bg-[var(--brass-500)] animate-ping" />
        <span className="font-semibold tracking-wide">
          {statusText || `Analyzing (${progressPercent}%)`}
        </span>
      </div>
    </div>
  );
}
