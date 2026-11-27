import type { PIIDetection } from '../../types/pii';
import { detectCardIssuer, isValidLuhn } from './luhnValidator';

// Linear-time candidate matcher: 13-19 digits with optional single space or hyphen between digits.
const CARD_CANDIDATE_REGEX = /(?<![0-9A-Za-z])(?:\d[ -]?){12,18}\d(?![0-9A-Za-z])/g;

/**
 * Detects Luhn-validated payment card numbers (13-19 digits, optional space/hyphen separators)
 * with plausible issuer prefix and length checks.
 */
export function detectCreditCards(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];
  CARD_CANDIDATE_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CARD_CANDIDATE_REGEX.exec(text)) !== null) {
    const value = match[0];
    const start = match.index;
    const end = start + value.length;

    // Avoid weird trailing separator or mixed invalid separators at boundaries
    const digits = value.replace(/[ -]/g, '');
    if (digits.length < 13 || digits.length > 19) {
      continue;
    }

    if (!isValidLuhn(digits)) {
      continue;
    }

    const issuerInfo = detectCardIssuer(digits);
    if (!issuerInfo) {
      continue;
    }

    detections.push({
      id: `credit_card-${start}-${end}`,
      category: 'credit_card',
      start,
      end,
      value,
      validation: 'valid',
      confidence: 'Validated',
      detail: `${issuerInfo.issuer} (Luhn passed)`,
    });
  }

  return detections;
}
