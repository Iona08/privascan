import type { PIIDetection } from '../../types/pii';

// International E.164-style starting with + or (+code), 8-15 total digits
const INTL_PHONE_REGEX =
  /(?<![0-9A-Za-z+]|\d[ -])(?:\(\+[1-9]\d{0,2}\)[ -]?|\+[1-9]\d{0,2}[ -]?)(?:\(\d{1,4}\)[ -]?)?(?:\d[ -]?){6,13}\d(?![0-9A-Za-z-]|[ -]\d)/g;

// Parenthesized area code (e.g., (202) 555-0145)
const PAREN_PHONE_REGEX =
  /(?<![0-9A-Za-z+]|\d[ -])\(\d{3,4}\)[ -]?\d{3,4}[ -]?\d{4}(?![0-9A-Za-z-]|[ -]\d)/g;

// Indian mobile: optional 0 prefix + [6-9] + 9 digits in unspaced, 5-5, or 3-3-4 groupings
const INDIAN_LOCAL_PHONE_REGEX =
  /(?<![0-9A-Za-z+.-]|\d[ -])(?:0[ -]?)?[6-9](?:\d{9}|\d{4}[ -]\d{5}|\d{2}[ -]\d{3}[ -]\d{4})(?![0-9A-Za-z.-]|[ -]\d)/g;

function hasRepeatedSeparator(value: string): boolean {
  return /[ -]{2}/.test(value);
}

function isLikelyDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}-\d{2}-\d{4}$/.test(value);
}

/**
 * Detects Indian (+91, 0-prefixed, and 10-digit 6-9 mobile) and international E.164 phone numbers.
 */
export function detectPhones(text: string): PIIDetection[] {
  const candidates: PIIDetection[] = [];

  const addCandidate = (
    value: string,
    start: number,
    detail: string,
    minDigits: number,
    maxDigits: number,
  ) => {
    if (hasRepeatedSeparator(value) || isLikelyDate(value)) {
      return;
    }

    const digits = value.replace(/\D/g, '');
    if (digits.length < minDigits || digits.length > maxDigits) {
      return;
    }

    // Reject all-identical digits like +1 0000000000 or 9999999999? Keep only all-zero check
    if (/^0+$/.test(digits)) {
      return;
    }

    const end = start + value.length;
    candidates.push({
      id: `phone-${start}-${end}`,
      category: 'phone',
      start,
      end,
      value,
      validation: 'heuristic',
      confidence: 'Pattern',
      detail,
    });
  };

  let match: RegExpExecArray | null;

  INTL_PHONE_REGEX.lastIndex = 0;
  while ((match = INTL_PHONE_REGEX.exec(text)) !== null) {
    const value = match[0];
    const digits = value.replace(/\D/g, '');
    const isIndian = digits.startsWith('91') && digits.length === 12 && /^[6-9]/.test(digits.slice(2));
    addCandidate(
      value,
      match.index,
      isIndian ? 'Indian phone (+91)' : 'International E.164 phone',
      8,
      15,
    );
  }

  PAREN_PHONE_REGEX.lastIndex = 0;
  while ((match = PAREN_PHONE_REGEX.exec(text)) !== null) {
    addCandidate(match[0], match.index, 'Area-code phone pattern', 10, 11);
  }

  INDIAN_LOCAL_PHONE_REGEX.lastIndex = 0;
  while ((match = INDIAN_LOCAL_PHONE_REGEX.exec(text)) !== null) {
    const value = match[0];
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10 || (digits.length === 11 && digits.startsWith('0'))) {
      addCandidate(value, match.index, 'Indian mobile number', 10, 11);
    }
  }

  // Deduplicate internal phone overlaps (prefer longest span)
  candidates.sort((a, b) => a.start - b.start || b.end - a.end);
  const deduped: PIIDetection[] = [];
  for (const cand of candidates) {
    const last = deduped[deduped.length - 1];
    if (last && cand.start < last.end) {
      if (cand.end - cand.start > last.end - last.start) {
        deduped[deduped.length - 1] = cand;
      }
      continue;
    }
    deduped.push(cand);
  }

  return deduped;
}
