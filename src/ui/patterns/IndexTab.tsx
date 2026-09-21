"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/ui/icons/Icon";
import { ShaderCanvas, hexToVec3 } from "@/ui/shaders/ShaderCanvas";
import { riskAuraFrag } from "@/ui/shaders/generated";
import type { RiskLevel } from "@/core/domain/enums";

const RISK_AURA_COLOR: Record<RiskLevel, [number, number, number]> = {
  high: hexToVec3("#b83a2a"),
  medium: hexToVec3("#b87a28"),
  low: hexToVec3("#2d6a4f"),
  info: hexToVec3("#3b6e8c"),
};

export interface IndexTabProps {
  clauseId: string;
  riskLevel: RiskLevel;
  label?: string;
  selected?: boolean;
  onClick?: (clauseId: string) => void;
  className?: string;
  stamped?: boolean;
}

const TAB_THEMES: Record<
  RiskLevel,
  {
    bg: string;
    text: string;
    border: string;
    icon: "risk-high" | "risk-medium" | "risk-low";
  }
> = {
  high: {
    bg: "bg-[var(--risk-high)]",
    text: "text-white",
    border: "border-[var(--risk-high)]",
    icon: "risk-high",
  },
  medium: {
    bg: "bg-[var(--risk-medium)]",
    text: "text-[var(--ink-900)]",
    border: "border-[#d97706]",
    icon: "risk-medium",
  },
  low: {
    bg: "bg-[var(--risk-low)]",
    text: "text-white",
    border: "border-[var(--risk-low)]",
    icon: "risk-low",
  },
  info: {
    bg: "bg-[var(--risk-info)]",
    text: "text-white",
    border: "border-[var(--risk-info)]",
    icon: "risk-low", // fallback
  },
};

export function IndexTab({
  clauseId,
  riskLevel,
  label,
  selected = false,
  onClick,
  className,
  stamped = false,
}: IndexTabProps) {
  const theme = TAB_THEMES[riskLevel] ?? TAB_THEMES.info;

  return (
    <button
      type="button"
      onClick={() => onClick?.(clauseId)}
      aria-pressed={selected}
      aria-label={`Clause ${clauseId}: ${riskLevel} risk${label ? ` - ${label}` : ""}`}
      className={cn(
        // Dimensions: 44px min touch target
        "group relative flex items-center h-[44px] min-w-[38px] max-w-[140px] px-2.5 rounded-r-md border-y border-r shadow-sm cursor-pointer select-none transition-all",
        theme.bg,
        theme.text,
        theme.border,
        selected
          ? "translate-x-1 shadow-md ring-2 ring-[var(--focus-ring-dark)] z-20"
          : "hover:translate-x-0.5 hover:shadow opacity-95 hover:opacity-100 z-10",
        // Stamp-in animation when arrival is triggered
        stamped && "animate-[stampIn_160ms_var(--ease-stamp)_forwards]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-dark)]",
        className
      )}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        <Icon
          name={theme.icon}
          className="size-4 shrink-0"
          aria-hidden="true"
        />
        <span className="font-mono text-xs font-bold tracking-tight">
          {clauseId}
        </span>
        {label && (
          <span className="text-[11px] font-ui truncate hidden group-hover:inline max-w-[70px] opacity-90">
            {label}
          </span>
        )}
      </div>

      {/* Selected indicator pip on the left border */}
      {selected && (
        <>
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white/70 rounded-r-full"
            aria-hidden="true"
          />
          {/* Subtle WebGL Risk Aura Pulse behind selected tab */}
          <div
            className="absolute -inset-2 -z-10 pointer-events-none rounded-r-lg overflow-hidden opacity-85"
            aria-hidden="true"
          >
            <ShaderCanvas
              fragment={riskAuraFrag}
              transparent={true}
              uniforms={{
                uColor: RISK_AURA_COLOR[riskLevel],
                uIntensity: 0.75,
              }}
              className="size-full"
              ariaLabel=""
            />
          </div>
        </>
      )}
    </button>
  );
}
