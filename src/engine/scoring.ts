import { ScoreBreakdown } from '../agent/types';

export const SCORE_WEIGHTS = {
  compatibility: 0.30,
  quantity_fit: 0.20,
  deadline_fit: 0.15,
  location_fit: 0.15,
  trust_evidence: 0.10,
  value_balance: 0.10,
};

export function computeScoreBreakdown(factors: {
  compatibility: number;     // 0 - 1
  quantity_fit: number;      // 0 - 1
  deadline_fit: number;      // 0 - 1
  location_fit: number;      // 0 - 1
  trust_evidence: number;    // 0 - 1
  value_balance: number;     // 0 - 1
}): ScoreBreakdown {
  const final_score = Math.round(
    (factors.compatibility * SCORE_WEIGHTS.compatibility +
      factors.quantity_fit * SCORE_WEIGHTS.quantity_fit +
      factors.deadline_fit * SCORE_WEIGHTS.deadline_fit +
      factors.location_fit * SCORE_WEIGHTS.location_fit +
      factors.trust_evidence * SCORE_WEIGHTS.trust_evidence +
      factors.value_balance * SCORE_WEIGHTS.value_balance) *
      100
  ) / 100;

  return {
    compatibility: Math.round(factors.compatibility * 100) / 100,
    quantity_fit: Math.round(factors.quantity_fit * 100) / 100,
    deadline_fit: Math.round(factors.deadline_fit * 100) / 100,
    location_fit: Math.round(factors.location_fit * 100) / 100,
    trust_evidence: Math.round(factors.trust_evidence * 100) / 100,
    value_balance: Math.round(factors.value_balance * 100) / 100,
    final_score,
  };
}
