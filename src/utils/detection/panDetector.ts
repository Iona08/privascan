import type { PIIDetection } from '../../types/pii';

const PAN_HOLDER_TYPES: Readonly<Record<string, string>> = {
  P: 'Individual',
  C: 'Company',
  H: 'HUF',
  F: 'Firm',
  A: 'AOP',
  T: 'Trust',
  B: 'BOI',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government',
};

// Uppercase PAN shape with valid 4th character holder-type code and alphanumeric boundaries.
const PAN_REGEX = /(?<![0-9A-Za-z])[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z](?![0-9A-Za-z])/g;

/**
 * Detects Indian PAN numbers (uppercase `[A-Z]{5}[0-9]{4}[A-Z]`) with 4th-character
 * holder-type code validation.
 */
export function detectPANs(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];
  PAN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PAN_REGEX.exec(text)) !== null) {
    const value = match[0];
    const start = match.index;
    const end = start + value.length;
    const holderCode = value.charAt(3);
    const holderLabel = PAN_HOLDER_TYPES[holderCode];
    if (!holderLabel) {
      continue;
    }

    detections.push({
      id: `pan-${start}-${end}`,
      category: 'pan',
      start,
      end,
      value,
      validation: 'valid',
      confidence: 'Validated',
      detail: `PAN holder type: ${holderCode} (${holderLabel})`,
    });
  }

  return detections;
}
