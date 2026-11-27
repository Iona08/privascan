import type { PIICategory } from '../../types/pii';
import { canonicalizeIPv6 } from '../detection/ipDetector';

const PSEUDONYM_PREFIX: Readonly<Record<PIICategory, string>> = {
  email: 'USER',
  phone: 'PHONE',
  ip: 'IP',
  pan: 'PAN',
  aadhaar: 'AADHAAR',
  credit_card: 'CARD',
};

/**
 * Normalizes a detected entity value so formatting/case/country-code variants
 * resolve to the same consistent pseudonym within a session.
 */
export function normalizeForPseudonym(category: PIICategory, rawValue: string): string {
  switch (category) {
    case 'email':
      return rawValue.trim().toLowerCase();
    case 'pan':
      return rawValue.trim().toUpperCase();
    case 'aadhaar':
    case 'credit_card':
      return rawValue.replace(/\D/g, '');
    case 'ip':
      return rawValue.includes(':') ? canonicalizeIPv6(rawValue.trim()) : rawValue.trim();
    case 'phone': {
      const digits = rawValue.replace(/\D/g, '');
      // Normalize Indian numbers across +91 / 0-prefixed / bare 10-digit mobile
      if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
        return `in:${digits.slice(2)}`;
      }
      if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
        return `in:${digits.slice(1)}`;
      }
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        return `in:${digits}`;
      }
      return digits;
    }
  }
}

export interface PseudonymSession {
  getPlaceholder: (category: PIICategory, rawValue: string) => string;
  reset: () => void;
  getMappingCount: () => number;
}

/**
 * Creates an in-memory-only pseudonymization session.
 * Private maps live strictly inside closure scope and are never exposed, exported, or logged.
 */
export function createPseudonymSession(): PseudonymSession {
  const categoryMaps = new Map<PIICategory, Map<string, string>>();
  const categoryCounters = new Map<PIICategory, number>();

  const getPlaceholder = (category: PIICategory, rawValue: string): string => {
    const normalized = normalizeForPseudonym(category, rawValue);

    let map = categoryMaps.get(category);
    if (!map) {
      map = new Map<string, string>();
      categoryMaps.set(category, map);
    }

    const existing = map.get(normalized);
    if (existing) {
      return existing;
    }

    const nextCount = (categoryCounters.get(category) ?? 0) + 1;
    categoryCounters.set(category, nextCount);

    const placeholder = `${PSEUDONYM_PREFIX[category]}_${String(nextCount).padStart(2, '0')}`;
    map.set(normalized, placeholder);
    return placeholder;
  };

  const reset = (): void => {
    for (const map of categoryMaps.values()) {
      map.clear();
    }
    categoryMaps.clear();
    categoryCounters.clear();
  };

  const getMappingCount = (): number => {
    let total = 0;
    for (const map of categoryMaps.values()) {
      total += map.size;
    }
    return total;
  };

  return {
    getPlaceholder,
    reset,
    getMappingCount,
  };
}
