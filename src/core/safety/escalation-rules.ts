/**
 * Rule-based Escalation Classifier.
 * brain.md §9: Escalation & safety behaviour.
 *
 * Detects situations where legal stakes are urgent, severe, or time-critical,
 * requiring immediate referral to professional legal aid, bar associations, or emergency services.
 */

export interface EscalationResult {
  triggered: boolean;
  trigger?: string | undefined;
  severity: "urgent" | "high" | "none";
  reason?: string | undefined;
  guidance?: string | undefined;
  isSelfHarm?: boolean | undefined;
}

interface RuleDefinition {
  trigger: string;
  severity: "urgent" | "high";
  reason: string;
  guidance: string;
  pattern: RegExp;
  isSelfHarm?: boolean;
}

const ESCALATION_RULES: RuleDefinition[] = [
  {
    trigger: "self_harm",
    severity: "urgent",
    isSelfHarm: true,
    reason: "Crisis / self-harm indication.",
    guidance:
      "If you or someone you know is struggling or in distress, help is available. In the US/Canada, please call or text 988 (Suicide & Crisis Lifeline) available 24/7. In the UK, call 111. International resources: befrienders.org.",
    pattern: /\b(suicid|kill\s+myself|end\s+my\s+life|hurt\s+myself|self[\s-]harm|want\s+to\s+die)\b/i,
  },
  {
    trigger: "arrest_police",
    severity: "urgent",
    reason: "Criminal proceedings, police detention, or arrest.",
    guidance:
      "If you are facing criminal charges or police questioning, you have the right to remain silent and to speak with a criminal defense lawyer or public defender immediately.",
    pattern: /\b(arrest(ed)?|police\s+(custody|detained|questioning)|jail|criminal\s+charge|warrant\s+for\s+arrest|miranda\s+rights|detained\s+(by\s+)?police)\b/i,
  },
  {
    trigger: "court_hearing",
    severity: "urgent",
    reason: "Pending court appearance, summons, or subpoena.",
    guidance:
      "Court deadlines and hearings require formal compliance. Failure to appear or answer can result in default judgements. Contact a licensed attorney or your local legal aid society urgently.",
    pattern: /\b(summons|subpoena|court\s+date|hearing\s+tomorrow|trial\s+date|notice\s+to\s+appear|court\s+order)\b/i,
  },
  {
    trigger: "eviction_lockout",
    severity: "urgent",
    reason: "Active eviction, unlawful lockout, or utility shutoff.",
    guidance:
      "Self-help evictions (such as changing locks or shutting off utilities without a court order) are illegal in many jurisdictions. Contact a tenant advocacy group or legal aid clinic immediately.",
    pattern: /\b(eviction\s+notice|3-day\s+notice|pay\s+or\s+quit|locked\s+out|changed\s+the\s+locks|padlock|utility\s+shutoff|shut\s+off\s+(water|power|electricity))\b/i,
  },
  {
    trigger: "domestic_violence",
    severity: "urgent",
    reason: "Domestic violence, threats, stalking, or protective orders.",
    guidance:
      "Your safety is paramount. If you are in immediate physical danger, call emergency services (911/999/112). For confidential support, contact the National Domestic Violence Hotline (1-800-799-SAFE in US) or local crisis shelters.",
    pattern: /\b(domestic\s+violence|abuse|abusive\s+partner|restraining\s+order|protective\s+order|threaten(ed)?\s+to\s+kill|stalking|physical\s+violence)\b/i,
  },
  {
    trigger: "child_custody_emergency",
    severity: "urgent",
    reason: "Child custody dispute, abduction risk, or welfare intervention.",
    guidance:
      "Urgent child custody and family welfare issues should be reviewed immediately with a qualified family law attorney or family legal clinic.",
    pattern: /\b(custody\s+battle|taken\s+my\s+(child|kid|children)|visitation\s+denied|child\s+abduction|cps\s+investigation|child\s+protective\s+services)\b/i,
  },
  {
    trigger: "immigration_deportation",
    severity: "urgent",
    reason: "Immigration enforcement, deportation, or removal proceedings.",
    guidance:
      "Immigration laws carry strict statutory deadlines. Consult an accredited immigration attorney or authorized legal-aid organization (such as DOJ/EOIR-recognized organizations).",
    pattern: /\b(deport(ation)?|ice\s+(raid|officer|agent)|removal\s+proceedings|asylum\s+denied|visa\s+revoked)\b/i,
  },
  {
    trigger: "wage_theft",
    severity: "high",
    reason: "Unpaid wages, withheld salary, or labor exploitation.",
    guidance:
      "If wages are withheld beyond statutory limits, you may file a wage claim with your local labor board or department of labor, or consult an employment attorney.",
    pattern: /\b(unpaid\s+wages|boss\s+refuses\s+to\s+pay|withheld\s+(my\s+)?(paycheck|salary)|not\s+paid\s+in\s+months|wage\s+theft)\b/i,
  },
  {
    trigger: "bodily_injury",
    severity: "urgent",
    reason: "Serious personal or bodily injury.",
    guidance:
      "If you have suffered serious physical injuries, seek emergency medical care immediately. For legal claims arising from an accident or injury, consult a personal injury attorney promptly.",
    pattern: /\b(severe\s+(physical\s+)?injury|hospital(?:ized)?|emergency\s+room|car\s+(?:crash|accident)|bodily\s+harm|bodily\s+injury)\b/i,
  },
  {
    trigger: "statutory_deadline_72h",
    severity: "urgent",
    reason: "Imminent legal deadline within 72 hours.",
    guidance:
      "A legal deadline within 72 hours requires immediate action to preserve your rights. Contact a lawyer or legal clinic today.",
    pattern: /\b(deadline\b.*?\b(?:today|tomorrow|(?:in|within)\s+(?:24|48|72)\s+hours)|statute\s+of\s+limitations\s+expires)\b/i,
  },
];

/**
 * Evaluates text against known critical escalation rules.
 */
export function detectEscalation(text: string): EscalationResult {
  if (!text || !text.trim()) {
    return { triggered: false, severity: "none" };
  }

  for (const rule of ESCALATION_RULES) {
    if (rule.pattern.test(text)) {
      return {
        triggered: true,
        trigger: rule.trigger,
        severity: rule.severity,
        reason: rule.reason,
        guidance: rule.guidance,
        ...(rule.isSelfHarm ? { isSelfHarm: true } : {}),
      };
    }
  }

  return {
    triggered: false,
    severity: "none",
  };
}

/**
 * Fast synchronous pre-flight rule classifier hook.
 */
export function detectEscalationFast(text: string): EscalationResult {
  return detectEscalation(text);
}

