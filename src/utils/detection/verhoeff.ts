// Verhoeff dihedral group D5 multiplication table
const D_TABLE: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Verhoeff permutation table
const P_TABLE: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// Verhoeff inverse table
const INV_TABLE: readonly number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a digit-only string using the Verhoeff checksum algorithm (used by Aadhaar).
 */
export function isValidVerhoeff(digits: string): boolean {
  if (!/^\d+$/.test(digits)) {
    return false;
  }

  let checksum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const digit = digits.charCodeAt(digits.length - 1 - i) - 48;
    const pRow = P_TABLE[i % 8];
    const dRow = D_TABLE[checksum];
    if (!pRow || !dRow) {
      return false;
    }
    const permuted = pRow[digit];
    if (permuted === undefined) {
      return false;
    }
    const next = dRow[permuted];
    if (next === undefined) {
      return false;
    }
    checksum = next;
  }

  return checksum === 0;
}

/**
 * Computes the Verhoeff check digit for a given digit payload (useful for test vectors).
 */
export function computeVerhoeffCheckDigit(payload: string): number {
  if (!/^\d+$/.test(payload)) {
    throw new Error('Verhoeff payload must contain digits only');
  }

  let checksum = 0;
  for (let i = 0; i < payload.length; i += 1) {
    const digit = payload.charCodeAt(payload.length - 1 - i) - 48;
    const pRow = P_TABLE[(i + 1) % 8];
    const dRow = D_TABLE[checksum];
    if (!pRow || !dRow) {
      throw new Error('Invalid Verhoeff table lookup');
    }
    const permuted = pRow[digit];
    if (permuted === undefined) {
      throw new Error('Invalid digit in Verhoeff payload');
    }
    const next = dRow[permuted];
    if (next === undefined) {
      throw new Error('Invalid Verhoeff state');
    }
    checksum = next;
  }

  const check = INV_TABLE[checksum];
  if (check === undefined) {
    throw new Error('Invalid Verhoeff inverse lookup');
  }
  return check;
}
