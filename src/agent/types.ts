/**
 * Cyclewise Agent & Domain Type Definitions
 */

export type SupportedLanguage = 'en' | 'sw' | 'mixed_sw_en' | 'sheng';

export interface NeedItem {
  category: string;
  item_or_service: string | null;
  quantity: number | null;
  unit: string | null;
  deadline: string | null;
  location: string | null;
  estimated_value: number | null;
  price_range_min?: number | null;
  price_range_max?: number | null;
  constraints: string[];
}

export interface OfferItem {
  category: string;
  item_or_service: string | null;
  quantity: number | null;
  unit: string | null;
  available_until: string | null;
  location: string | null;
  estimated_value: number | null;
  conditions: string[];
}

export interface SourceSpan {
  field: string;
  text: string;
}

export interface StructuredExtraction {
  need: NeedItem;
  offer: OfferItem;
  language: SupportedLanguage | string;
  confidence: number;
  missing_fields: string[];
  ambiguities: string[];
  source_spans: SourceSpan[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  required_clarifications: string[];
}

export interface TrustEvent {
  id: string;
  sme_id: string;
  event_type: 'completed_exchange' | 'identity_confirmed' | 'late_delivery' | 'unresolved_dispute' | 'counterparty_review';
  counterparty_sme_id?: string;
  outcome: 'confirmed' | 'verified' | 'resolved' | 'pending' | 'flagged';
  evidence_text: string;
  created_at: string;
}

export interface SMEProfile {
  id: string;
  name: string;
  sector: string;
  description: string;
  location: string;
  languages: string[];
  identity_status: 'verified' | 'unverified' | 'reported';
  offer_summary: string;
  need_summary: string;
  trust_events: TrustEvent[];
}

export interface DirectedEdge {
  id: string;
  from_sme_id: string;
  to_sme_id: string;
  item_or_service: string;
  category: string;
  quantity: number;
  unit: string;
  estimated_value: number;
  compatibility_score: number;
  explanation: string;
}

export interface ScoreBreakdown {
  compatibility: number;     // weight: 0.30
  quantity_fit: number;      // weight: 0.20
  deadline_fit: number;      // weight: 0.15
  location_fit: number;      // weight: 0.15
  trust_evidence: number;    // weight: 0.10
  value_balance: number;     // weight: 0.10
  final_score: number;
}

export interface ExchangeCycle {
  id: string;
  cycle_length: number;
  sme_sequence: string[]; // List of SME IDs in loop order
  edges: DirectedEdge[];
  estimated_value_unlocked: number;
  score_breakdown: ScoreBreakdown;
  risk_flags: string[];
  missing_information: string[];
  status: ExchangeStatus;
}

export type ExchangeStatus =
  | 'Proposed'
  | 'Partially committed'
  | 'Active'
  | 'In progress'
  | 'Delivered'
  | 'Confirmed'
  | 'Completed'
  | 'Disputed'
  | 'Failed';

export interface ParticipantDecision {
  sme_id: string;
  decision: 'commit' | 'clarify' | 'decline' | 'pending';
  note?: string;
  timestamp: string;
}

export interface InvoiceLineItem {
  from_sme: string;
  to_sme: string;
  item_or_service: string;
  quantity: number;
  unit: string;
  unit_val_kes: number;
  total_val_kes: number;
}

export interface ExchangeInvoice {
  invoice_number: string;
  cycle_id: string;
  issue_date: string;
  settlement_status: 'ESCROW_LOCKED' | 'DISPATCH_IN_PROGRESS' | 'RECONCILED_100_SETTLED';
  total_barter_value_kes: number;
  net_cash_debt_created_kes: 0; // Strictly 0 in Cyclewise Anti-Debt Protocol
  verification_hash: string;
  line_items: InvoiceLineItem[];
  compliance_declaration: string;
  authorized_agent: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  hash_signature: string;
}

export interface AgentTrajectoryLog {
  task_id: string;
  user_input_hash: string;
  prompt_version: string;
  model_id: string;
  tool_calls: string[];
  tool_arguments: Record<string, unknown>[];
  tool_results: Record<string, unknown>[];
  validation_errors: string[];
  latency_ms: number;
  final_status: string;
  grounded_verified: boolean;
}
