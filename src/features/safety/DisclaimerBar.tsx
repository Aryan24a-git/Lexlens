"use client";

/**
 * DisclaimerBar — persistent disclaimer that cannot be permanently dismissed.
 * Floats at the bottom of every AI surface. (rules.md B1, A1.12, design.md §7.7)
 */

import { Icon } from "@/ui/icons/Icon";

export function DisclaimerBar() {
  return (
    <aside
      role="note"
      aria-label="Legal information disclaimer"
      className="w-full border-t border-vellum-300 bg-vellum-100 px-4 py-2.5 flex items-start gap-2 text-ink-700 theme-paper print:block"
    >
      <Icon
        name="shield"
        className="size-4 mt-0.5 shrink-0 text-ink-500"
        aria-hidden={true}
      />
      <p className="text-xs leading-relaxed m-0">
        <strong className="font-semibold text-ink-900">
          LexLens gives legal information, not legal advice.
        </strong>{" "}
        For decisions that matter, talk to a qualified lawyer. Laws vary by
        place and change over time. Information verified against the document
        provided — not a substitute for professional legal counsel.
      </p>
    </aside>
  );
}
