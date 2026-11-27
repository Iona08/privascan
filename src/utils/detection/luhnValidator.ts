export interface CardIssuerInfo {
  issuer: string;
  validLengths: readonly number[];
}

/**
 * Validates a numeric string using the Luhn (mod 10) checksum algorithm.
 * Expects digits-only input; returns false for non-digits or strings shorter than 2 digits.
 */
export function isValidLuhn(digits: string): boolean {
  if (!/^\d{2,}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Identifies a plausible payment card issuer and checks whether the digit length
 * matches known issuer rules (Visa, Mastercard, Amex, Discover, RuPay, JCB, Diners).
 */
export function detectCardIssuer(digits: string): CardIssuerInfo | null {
  const len = digits.length;
  if (len < 13 || len > 19 || !/^\d+$/.test(digits)) {
    return null;
  }

  // Reject trivial all-same-digit sequences (e.g., 0000... or 4444...)
  if (/^(\d)\1+$/.test(digits)) {
    return null;
  }

  // American Express: 34 or 37, length 15
  if (/^3[47]/.test(digits)) {
    return len === 15 ? { issuer: 'Amex', validLengths: [15] } : null;
  }

  // Visa: starts with 4, length 13, 16, or 19
  if (digits.startsWith('4')) {
    return len === 13 || len === 16 || len === 19
      ? { issuer: 'Visa', validLengths: [13, 16, 19] }
      : null;
  }

  // RuPay specific prefixes (checked before generic 65/60 Discover overlap where distinct)
  // RuPay BINs: 60, 6521, 6522, 81, 82, 508, 353, 356 (16 digits)
  if (
    /^(?:6521|6522|508|353|356|81|82)/.test(digits) ||
    (/^60/.test(digits) && !digits.startsWith('6011'))
  ) {
    return len === 16 ? { issuer: 'RuPay', validLengths: [16] } : null;
  }

  // Mastercard: 51-55 or 2221-2720, length 16
  const prefix2 = Number(digits.slice(0, 2));
  const prefix4 = Number(digits.slice(0, 4));
  if ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720)) {
    return len === 16 ? { issuer: 'Mastercard', validLengths: [16] } : null;
  }

  // Discover: 6011, 644-649, 65, 622126-622925, length 16 or 19
  const prefix3 = Number(digits.slice(0, 3));
  const prefix6 = Number(digits.slice(0, 6));
  if (
    digits.startsWith('6011') ||
    digits.startsWith('65') ||
    (prefix3 >= 644 && prefix3 <= 649) ||
    (prefix6 >= 622126 && prefix6 <= 622925)
  ) {
    return len === 16 || len === 19
      ? { issuer: 'Discover', validLengths: [16, 19] }
      : null;
  }

  // JCB: 3528-3589, length 16-19
  if (prefix4 >= 3528 && prefix4 <= 3589) {
    return len >= 16 && len <= 19 ? { issuer: 'JCB', validLengths: [16, 17, 18, 19] } : null;
  }

  // Diners Club: 300-305, 36, 38-39, length 14 or 16
  if ((prefix3 >= 300 && prefix3 <= 305) || prefix2 === 36 || prefix2 === 38 || prefix2 === 39) {
    return len === 14 || len === 16 ? { issuer: 'Diners', validLengths: [14, 16] } : null;
  }

  return null;
}
