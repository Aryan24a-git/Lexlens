/**
 * Client-Side PII (Personally Identifiable Information) Redactor.
 * security.md §3: Data handling & client-side PII redaction.
 *
 * Masks sensitive user data (emails, phone numbers, government IDs, bank details, cards, addresses)
 * before transmission to the server/LLM. Provides a reversible local token map so the original
 * values can be restored in the UI without ever leaving the device.
 */

export type PiiType =
  | "EMAIL"
  | "PHONE"
  | "GOV_ID"
  | "CREDIT_CARD"
  | "BANK_ACCOUNT"
  | "ADDRESS";

export interface PiiMatch {
  token: string;
  type: PiiType;
  originalValue: string;
  index: number;
}

export interface PiiRedactionResult {
  redactedText: string;
  tokenMap: Record<string, string>;
  matches: PiiMatch[];
  countsByType: Record<PiiType, number>;
  totalCount: number;
}

interface PiiRule {
  type: PiiType;
  pattern: RegExp;
}

// Order matters: match more specific high-entropy patterns before loose patterns.
const PII_RULES: PiiRule[] = [
  // 1. Email addresses
  {
    type: "EMAIL",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  // 2. Credit card numbers (13-19 digits, separated or continuous)
  {
    type: "CREDIT_CARD",
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11}|\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4})\b/g,
  },
  // 3. Government IDs: US SSN (XXX-XX-XXXX), Aadhaar (XXXX XXXX XXXX), PAN ([A-Z]{5}[0-9]{4}[A-Z])
  {
    type: "GOV_ID",
    pattern: /\b(?:\d{3}-\d{2}-\d{4}|\d{4}\s\d{4}\s\d{4}|[A-Z]{5}\d{4}[A-Z])\b/g,
  },
  // 4. IBAN / International Bank Account
  {
    type: "BANK_ACCOUNT",
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16}\b/g,
  },
  // 5. Phone numbers (International and US styles)
  {
    type: "PHONE",
    pattern: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  // 6. Street addresses (Common patterns like 123 Main Street / 456 Elm Ave)
  {
    type: "ADDRESS",
    pattern: /\b\d{1,5}\s+[A-Za-z0-9\s.,]{2,30}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Circle|Way)\b/gi,
  },
];

/**
 * Redacts PII from text and returns the masked text along with a reversible token map.
 */
export function redactPii(text: string): PiiRedactionResult {
  if (!text || text.trim().length === 0) {
    return {
      redactedText: text,
      tokenMap: {},
      matches: [],
      countsByType: {
        EMAIL: 0,
        PHONE: 0,
        GOV_ID: 0,
        CREDIT_CARD: 0,
        BANK_ACCOUNT: 0,
        ADDRESS: 0,
      },
      totalCount: 0,
    };
  }

  let redactedText = text;
  const tokenMap: Record<string, string> = {};
  const matches: PiiMatch[] = [];
  const countsByType: Record<PiiType, number> = {
    EMAIL: 0,
    PHONE: 0,
    GOV_ID: 0,
    CREDIT_CARD: 0,
    BANK_ACCOUNT: 0,
    ADDRESS: 0,
  };

  for (const rule of PII_RULES) {
    let indexOffset = 0;
    // Reset regex state
    rule.pattern.lastIndex = 0;

    redactedText = redactedText.replace(rule.pattern, (match, offset) => {
      // Check if match was already replaced with another token
      if (match.startsWith("[REDACTED_") && match.endsWith("]")) {
        return match;
      }

      indexOffset++;
      const token = `[REDACTED_${rule.type}_${indexOffset}]`;
      tokenMap[token] = match;
      countsByType[rule.type]++;

      matches.push({
        token,
        type: rule.type,
        originalValue: match,
        index: offset,
      });

      return token;
    });
  }

  return {
    redactedText,
    tokenMap,
    matches,
    countsByType,
    totalCount: matches.length,
  };
}

/**
 * Restores original PII values back into the redacted text using the local token map.
 */
export function restorePii(
  redactedText: string,
  tokenMap: Record<string, string>
): string {
  if (!redactedText || Object.keys(tokenMap).length === 0) {
    return redactedText;
  }

  let restored = redactedText;
  for (const [token, originalValue] of Object.entries(tokenMap)) {
    // Replace all occurrences of this token
    restored = restored.split(token).join(originalValue);
  }

  return restored;
}
