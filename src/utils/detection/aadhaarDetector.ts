import type { PIIDetection } from '../../types/pii';
import { isValidVerhoeff } from './verhoeff';

// 12 digits starting 2-9, either unspaced or grouped 4-4-4 with consistent space or hyphen.
const AADHAAR_CANDIDATE_REGEX =
  /(?<![0-9A-Za-z]|\d[ -])[2-9]\d{3}(?:([ -])\d{4}\1\d{4}|\d{8})(?![0-9A-Za-z]|[ -]\d)/g;

/**
 * Detects 12-digit Aadhaar candidates and classifies them as Validated (Verhoeff passes)
 * or Format match only (Verhoeff fails).
 */
export function detectAadhaar(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];
  AADHAAR_CANDIDATE_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = AADHAAR_CANDIDATE_REGEX.exec(text)) !== null) {
    const value = match[0];
    const start = match.index;
    const end = start + value.length;
    const digits = value.replace(/[ -]/g, '');

    if (digits.length !== 12) {
      continue;
    }

    // Reject trivial repeated-digit strings like 9999 9999 9999
    if (/^(\d)\1{11}$/.test(digits)) {
      continue;
    }

    const verhoeffOk = isValidVerhoeff(digits);
    detections.push({
      id: `aadhaar-${start}-${end}`,
      category: 'aadhaar',
      start,
      end,
      value,
      validation: verhoeffOk ? 'valid' : 'format_only',
      confidence: verhoeffOk ? 'Validated' : 'Format match',
      detail: verhoeffOk
        ? 'Verhoeff checksum passed'
        : 'Format match only (Verhoeff checksum failed)',
    });
  }

  return detections;
}
