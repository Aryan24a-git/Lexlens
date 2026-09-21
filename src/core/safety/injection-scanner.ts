/**
 * Prompt injection & adversarial input scanner.
 * security.md §4: Prompt-injection & model-safety controls.
 *
 * Detects:
 * 1. Direct instruction overrides ("ignore previous instructions", "disregard all prior...")
 * 2. System prompt leakage / exfiltration ("repeat the system prompt", "reveal instructions...")
 * 3. Persona / jailbreak hijackings ("you are now DAN", "developer mode enabled", "act as unfiltered...")
 * 4. Structural breakout tags (e.g., </document>, </clause>, <system>)
 * 5. Stealth unicode manipulation (zero-width spaces, bidi direction overrides)
 */

export interface InjectionPattern {
  name: string;
  pattern: RegExp;
  category: "override" | "exfiltration" | "jailbreak" | "boundary_breakout" | "unicode_stealth";
  weight: number;
}

const INJECTION_PATTERNS: InjectionPattern[] = [
  // 1. Direct Instruction Overrides
  {
    name: "ignore_previous_instructions",
    pattern: /\b(?:ignore|disregard|override|forget)\s+(?:all\s+)?(?:previous|prior|above|existing)\s+(?:instructions|prompts|directives|rules|guidelines)\b/i,
    category: "override",
    weight: 0.9,
  },
  {
    name: "new_instruction_directive",
    pattern: /(?:^|\n)\s*(?:new\s+(?:system\s+)?instruction|important\s+new\s+rule|update\s+to\s+instructions)\s*:/i,
    category: "override",
    weight: 0.75,
  },
  {
    name: "do_not_follow_rules",
    pattern: /\b(?:do\s+not|stop)\s+following\s+(?:the\s+)?(?:system|developer|safety)\s+(?:rules|prompts|guidelines)\b/i,
    category: "override",
    weight: 0.8,
  },

  // 2. Prompt Extraction / Exfiltration
  {
    name: "system_prompt_exfiltration",
    pattern: /\b(?:print|repeat|reveal|output|display|show|quote)\s+(?:the\s+|your\s+)?(?:entire\s+)?(?:system\s+prompt|hidden\s+prompt|initial\s+prompt|internal\s+instructions|developer\s+message)\b/i,
    category: "exfiltration",
    weight: 0.85,
  },
  {
    name: "verbatim_initialization_query",
    pattern: /\bwhat\s+(?:were|are)\s+your\s+(?:exact\s+)?(?:first\s+)?instructions\b/i,
    category: "exfiltration",
    weight: 0.7,
  },
  {
    name: "echo_context_above",
    pattern: /\becho\s+back\s+(?:everything|all\s+text)\s+(?:above|before\s+this)\b/i,
    category: "exfiltration",
    weight: 0.75,
  },

  // 3. Jailbreak & Persona Hijacking
  {
    name: "dan_or_jailbreak_mode",
    pattern: /\b(?:DAN\s+mode|jailbreak(?:ed)?|developer\s+mode\s+enabled|always\s+say\s+yes|do\s+anything\s+now)\b/i,
    category: "jailbreak",
    weight: 0.95,
  },
  {
    name: "act_as_unfiltered_assistant",
    pattern: /\b(?:you\s+are\s+now|act\s+as)\s+(?:an?\s+)?(?:unfiltered|unrestricted|uncensored|evil|adversarial|fully\s+compliant)\s+(?:ai|assistant|model|bot)\b/i,
    category: "jailbreak",
    weight: 0.9,
  },
  {
    name: "bypass_guardrails",
    pattern: /\b(?:bypass|disable|turn\s+off|circumvent)\s+(?:all\s+)?(?:safety|guardrails?|content\s+filters?|moderation)\b/i,
    category: "jailbreak",
    weight: 0.85,
  },

  // 4. Boundary & Delimiter Breakouts
  {
    name: "structural_tag_breakout",
    pattern: /<\/(?:document|clause|context|query|system)>\s*<(?:document|system|admin|user|prompt)/i,
    category: "boundary_breakout",
    weight: 0.8,
  },
  {
    name: "prompt_marker_spoofing",
    pattern: /(?:^|\n)\s*(?:###\s*(?:System|Admin|Instruction)|\[SYSTEM_PROMPT\]|<system>|<\|im_start\|>system)/i,
    category: "boundary_breakout",
    weight: 0.85,
  },

  // 5. Stealth Unicode Injections
  {
    name: "zero_width_stealth_characters",
    pattern: /[\u200B\u200C\u200D\u2060\uFEFF]/,
    category: "unicode_stealth",
    weight: 0.5,
  },
  {
    name: "bidi_override_characters",
    pattern: /[\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/,
    category: "unicode_stealth",
    weight: 0.6,
  },
];

export interface InjectionScanResult {
  hasInjection: boolean;
  riskScore: number; // 0.0 - 1.0
  detectedPatterns: string[];
  flaggedReasons: string[];
  sanitizedText: string;
}

/**
 * Strips stealth zero-width and bidi override characters from text.
 */
export function sanitizeHiddenCharacters(text: string): string {
  return text
    // Zero-width spaces, joiners, BOM
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "")
    // Bidirectional override characters
    .replace(/[\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/g, "");
}

/**
 * Escapes XML-like structural tags that could conflict with prompt encapsulation boundaries.
 */
export function sanitizeBoundaryTags(text: string): string {
  return text
    .replace(/<\/document>/gi, "<\\/document>")
    .replace(/<\/clause>/gi, "<\\/clause>")
    .replace(/<system>/gi, "<\\system>")
    .replace(/<\/system>/gi, "<\\/system>");
}

/**
 * Scans a given text (clause or query) for prompt injection and adversarial manipulation attempts.
 */
export function scanForInjection(text: string): InjectionScanResult {
  if (!text || text.trim().length === 0) {
    return {
      hasInjection: false,
      riskScore: 0,
      detectedPatterns: [],
      flaggedReasons: [],
      sanitizedText: text,
    };
  }

  const detectedPatterns: string[] = [];
  const flaggedReasons: string[] = [];
  let maxWeight = 0;

  for (const rule of INJECTION_PATTERNS) {
    if (rule.pattern.test(text)) {
      detectedPatterns.push(rule.name);
      flaggedReasons.push(`Matches ${rule.category} pattern: ${rule.name}`);
      if (rule.weight > maxWeight) {
        maxWeight = rule.weight;
      }
    }
  }

  const hasInjection = detectedPatterns.length > 0;
  const sanitizedText = sanitizeBoundaryTags(sanitizeHiddenCharacters(text));

  return {
    hasInjection,
    riskScore: hasInjection ? Math.min(1.0, maxWeight + (detectedPatterns.length - 1) * 0.05) : 0,
    detectedPatterns,
    flaggedReasons,
    sanitizedText,
  };
}

/**
 * Quick boolean check for prompt injection.
 */
export function containsPromptInjection(text: string): boolean {
  return scanForInjection(text).hasInjection;
}
