"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface PerspectivePickerProps {
  selectedRole: string;
  onChangeRole: (role: string) => void;
  suggestedRoles?: string[] | undefined;
  className?: string;
}

const DEFAULT_ROLES = [
  { id: "tenant", label: "Tenant" },
  { id: "landlord", label: "Landlord" },
  { id: "freelancer", label: "Freelancer" },
  { id: "client", label: "Client" },
  { id: "employee", label: "Employee" },
  { id: "employer", label: "Employer" },
  { id: "customer", label: "Consumer / User" },
  { id: "neutral", label: "Neutral / Overview" },
];

/**
 * PerspectivePicker — Role chips for perspective-aware legal analysis. (design.md §8, §11)
 * "Which side are you on? Risk depends on who you are in this document."
 */
export function PerspectivePicker({
  selectedRole,
  onChangeRole,
  suggestedRoles,
  className,
}: PerspectivePickerProps) {
  const [customRole, setCustomRole] = useState("");
  const [isCustomActive, setIsCustomActive] = useState(false);

  const rolesToDisplay = suggestedRoles
    ? suggestedRoles.map((r) => ({
        id: r.toLowerCase(),
        label: r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, " "),
      }))
    : DEFAULT_ROLES;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRole.trim()) {
      onChangeRole(customRole.trim());
      setIsCustomActive(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-sans font-medium uppercase tracking-wider text-[var(--brass-300)]">
          Your Perspective
        </label>
        <span className="text-[11px] text-[var(--text-on-dark-2)]">
          Risk depends on who you are in this document
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Select your role in the document"
        className="flex flex-wrap gap-2 items-center"
      >
        {rolesToDisplay.map((role) => {
          const isSelected = selectedRole.toLowerCase() === role.id.toLowerCase();
          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                onChangeRole(role.id);
                setIsCustomActive(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border select-none",
                isSelected
                  ? "bg-[var(--brass-500)] text-[var(--baize-950)] border-[var(--brass-300)] shadow-xs font-semibold"
                  : "bg-[var(--baize-900)] text-[var(--text-on-dark-2)] border-[var(--baize-700)] hover:border-[var(--brass-500)]/60 hover:text-[var(--text-on-dark)]"
              )}
            >
              {role.label}
            </button>
          );
        })}

        {/* Custom role button / form */}
        {!isCustomActive ? (
          <button
            type="button"
            onClick={() => setIsCustomActive(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-dashed border-[var(--baize-700)] text-[var(--text-on-dark-2)] hover:border-[var(--brass-500)] hover:text-[var(--brass-300)]"
          >
            + Other role...
          </button>
        ) : (
          <form onSubmit={handleCustomSubmit} className="inline-flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              placeholder="e.g. Subcontractor"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md bg-[var(--baize-950)] border border-[var(--brass-500)] text-[var(--text-on-dark)] placeholder-[var(--text-on-dark-2)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--brass-300)] w-36"
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs rounded bg-[var(--brass-500)] text-[var(--baize-950)] font-semibold hover:bg-[var(--brass-300)]"
            >
              Set
            </button>
            <button
              type="button"
              onClick={() => setIsCustomActive(false)}
              className="px-1.5 py-1 text-xs text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
            >
              ✕
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
