/**
 * NVIDIA Safety Recipe & NeMo Guardrails inspired application policy layer.
 * Enforces input classification, prompt-injection defense, tool allowlists,
 * and human-in-the-loop gates.
 */

export interface SecurityCheckResult {
  allowed: boolean;
  sanitizedText: string;
  flaggedPatterns: string[];
  reason?: string;
}

export type AgentStage = 'parse' | 'validate' | 'search' | 'explain' | 'commit' | 'tracking';

const ADVERSARIAL_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt\s+override/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /reveal\s+(api\s+key|secret|password|token)/i,
  /grant\s+(admin|root|credit|loan)/i,
  /bypass\s+(verification|guardrail|rule)/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /drop\s+table/i,
];

const PROHIBITED_FINANCIAL_CLAIMS = [
  /guaranteed\s+(return|delivery|profit|credit)/i,
  /approved\s+for\s+loan/i,
  /credit\s+score\s+(is|of)/i,
  /legally\s+binding\s+loan\s+agreement/i,
  /crypto(currency)?\s+token\s+transfer/i,
];

/**
 * Validates untrusted input for prompt injection and XSS attempts
 */
export function guardrailCheckInput(rawInput: string): SecurityCheckResult {
  const flagged: string[] = [];

  for (const pattern of ADVERSARIAL_PATTERNS) {
    if (pattern.test(rawInput)) {
      flagged.push(`Matched adversarial pattern: ${pattern.toString()}`);
    }
  }

  // Basic HTML sanitization
  const sanitized = rawInput
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

  if (flagged.length > 0) {
    return {
      allowed: false,
      sanitizedText: sanitized,
      flaggedPatterns: flagged,
      reason: 'Input contains adversarial or prompt injection directives.',
    };
  }

  return {
    allowed: true,
    sanitizedText: sanitized,
    flaggedPatterns: [],
  };
}

/**
 * Verifies model output does not contain prohibited financial/lending assertions
 */
export function guardrailCheckOutput(modelText: string): { safe: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const pattern of PROHIBITED_FINANCIAL_CLAIMS) {
    if (pattern.test(modelText)) {
      violations.push(`Output contains prohibited financial assertion: ${pattern.toString()}`);
    }
  }
  return {
    safe: violations.length === 0,
    violations,
  };
}

/**
 * Least-privilege tool allowlist per workflow stage
 */
export const STAGE_TOOL_ALLOWLIST: Record<AgentStage, string[]> = {
  parse: ['extract_need_offer'],
  validate: ['validate_request'],
  search: ['find_exchange_cycles', 'get_trust_evidence', 'rank_cycles'],
  explain: ['explain_match'],
  commit: ['create_exchange_proposal', 'record_participant_decision'],
  tracking: ['get_exchange_status', 'search_substitute_candidate'],
};

export function isToolAllowedInStage(stage: AgentStage, toolName: string): boolean {
  const allowedTools = STAGE_TOOL_ALLOWLIST[stage] || [];
  return allowedTools.includes(toolName);
}
