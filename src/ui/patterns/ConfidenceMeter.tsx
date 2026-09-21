import { cn } from "@/lib/utils";

export interface ConfidenceMeterProps {
  confidence: number; // 0.0 to 1.0
  className?: string;
  showLabel?: boolean;
}

export function ConfidenceMeter({
  confidence,
  className,
  showLabel = true,
}: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(1, confidence));
  const activeSegments = Math.max(1, Math.round(clamped * 5));
  const percentage = Math.round(clamped * 100);

  const confidenceText =
    percentage >= 85
      ? "High confidence"
      : percentage >= 60
        ? "Moderate confidence"
        : "Low confidence / ambiguous";

  return (
    <div
      className={cn("inline-flex items-center gap-2 font-ui text-xs text-[var(--ink-500)]", className)}
      role="meter"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${confidenceText} (${percentage}%, ${activeSegments} of 5 segments)`}
    >
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((seg) => {
          const isActive = seg <= activeSegments;
          return (
            <div
              key={seg}
              className={cn(
                "w-3.5 h-1.5 rounded-sm transition-colors",
                isActive
                  ? "bg-[var(--brass-500)]"
                  : "bg-[var(--vellum-300)]"
              )}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--ink-700)]">
          {percentage}%
        </span>
      )}
    </div>
  );
}
