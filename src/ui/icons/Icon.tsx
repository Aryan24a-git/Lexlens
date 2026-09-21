/**
 * Icon — renders SVG icons from public/svg/sprite.svg via <use>.
 * Usage: <Icon name="risk-high" className="size-5 text-risk-high" />
 * Available names: upload, risk-high, risk-medium, risk-low, clause,
 *   compare, checklist, briefcase, chat, translate, export, shield
 */

import { cn } from "@/lib/utils";

type IconName =
  | "upload"
  | "risk-high"
  | "risk-medium"
  | "risk-low"
  | "clause"
  | "compare"
  | "checklist"
  | "briefcase"
  | "chat"
  | "translate"
  | "export"
  | "shield";

interface IconProps {
  name: IconName;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export function Icon({
  name,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const hidden = ariaHidden !== undefined ? ariaHidden : !ariaLabel;

  return (
    <svg
      className={cn("inline-block shrink-0", className)}
      aria-label={ariaLabel}
      aria-hidden={hidden || undefined}
      focusable="false"
      role={ariaLabel ? "img" : undefined}
    >
      <use href={`/svg/sprite.svg#${name}`} />
    </svg>
  );
}
