import { cn } from "@/lib/utils";
import { Icon } from "@/ui/icons/Icon";
import type { RiskLevel } from "@/core/domain/enums";

export interface RiskChipProps {
  level: RiskLevel;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

const RISK_CONFIG: Record<
  RiskLevel,
  {
    label: string;
    iconName?: "risk-high" | "risk-medium" | "risk-low";
    badgeClass: string;
  }
> = {
  high: {
    label: "High Risk",
    iconName: "risk-high",
    badgeClass: "bg-[var(--risk-high)]/15 text-[var(--risk-high)] border-[var(--risk-high)]/40",
  },
  medium: {
    label: "Medium Risk",
    iconName: "risk-medium",
    badgeClass: "bg-[var(--risk-medium)]/20 text-[#855800] border-[var(--risk-medium)]/50 font-semibold",
  },
  low: {
    label: "Low Risk",
    iconName: "risk-low",
    badgeClass: "bg-[var(--risk-low)]/15 text-[var(--risk-low-text)] border-[var(--risk-low)]/40",
  },
  info: {
    label: "Informational",
    badgeClass: "bg-[var(--risk-info)]/15 text-[var(--risk-info)] border-[var(--risk-info)]/30",
  },
};

export function RiskChip({
  level,
  size = "md",
  showIcon = true,
  className,
}: RiskChipProps) {
  const config = RISK_CONFIG[level] ?? RISK_CONFIG.info;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs gap-1"
      : "px-2.5 py-1 text-xs gap-1.5 font-medium";

  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border tracking-wide uppercase font-ui transition-colors select-none",
        sizeClasses,
        config.badgeClass,
        className
      )}
      aria-label={`${config.label} severity level`}
    >
      {showIcon && config.iconName ? (
        <Icon name={config.iconName} className={iconSize} aria-hidden="true" />
      ) : showIcon ? (
        <span
          className="size-1.5 rounded-full bg-[var(--risk-info)] shrink-0"
          aria-hidden="true"
        />
      ) : null}
      <span>{config.label}</span>
    </span>
  );
}
