import { StructuredExtraction, ValidationResult } from './types';

/**
 * Deterministic schema validator for StructuredExtraction
 */
export function validateExtractionSchema(data: unknown): { valid: boolean; errors: string[]; parsed?: StructuredExtraction } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Input must be a valid JSON object'] };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.need || typeof obj.need !== 'object') {
    errors.push('Missing or invalid "need" object');
  }
  if (!obj.offer || typeof obj.offer !== 'object') {
    errors.push('Missing or invalid "offer" object');
  }
  if (typeof obj.language !== 'string') {
    errors.push('Missing or invalid "language" field');
  }
  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    errors.push('Confidence must be a number between 0 and 1');
  }
  if (!Array.isArray(obj.missing_fields)) {
    errors.push('"missing_fields" must be an array of strings');
  }
  if (!Array.isArray(obj.ambiguities)) {
    errors.push('"ambiguities" must be an array of strings');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], parsed: data as StructuredExtraction };
}

/**
 * Deterministic business validation on extracted request
 */
export function validateBusinessRules(extraction: StructuredExtraction): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const required_clarifications: string[] = [];

  // Need validation
  if (!extraction.need.item_or_service && !extraction.need.category) {
    errors.push('Need must specify an item, service, or category');
    required_clarifications.push('What specific product or service does your business need?');
  }
  if (extraction.need.quantity !== null && extraction.need.quantity <= 0) {
    errors.push('Need quantity must be greater than zero');
  }
  if (!extraction.need.location) {
    warnings.push('No location specified for need; defaults to Nairobi metropolitan area');
  }

  // Offer validation
  if (!extraction.offer.item_or_service && !extraction.offer.category) {
    errors.push('Offer must specify what resource or service you can provide');
    required_clarifications.push('What item, capacity, or service can your business offer in exchange?');
  }
  if (extraction.offer.quantity !== null && extraction.offer.quantity <= 0) {
    errors.push('Offer quantity must be greater than zero');
  }

  // Confidence check
  if (extraction.confidence < 0.6) {
    warnings.push('Low extraction confidence; user manual review recommended');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    required_clarifications,
  };
}
