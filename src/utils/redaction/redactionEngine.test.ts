import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORY_LABELS, type RedactionSettings } from '../../types/pii';
import { detectPII } from '../detection/detectionEngine';
import { computeVerhoeffCheckDigit } from '../detection/verhoeff';
import { createPseudonymSession } from './pseudonymizer';
import { applyRedaction } from './redactionEngine';

const BASE_SETTINGS: RedactionSettings = {
  mode: 'full',
  fullMaskLabel: '[REDACTED]',
  useCategoryLabels: false,
  categoryLabels: { ...DEFAULT_CATEGORY_LABELS },
};

describe('Redaction engine: full, partial, and custom labels', () => {
  it('applies full masking with default, custom global, and per-category labels', () => {
    const text = 'Email john.doe@gmail.com and PAN ABCPK1234F.';
    const detections = detectPII(text);
    const session = createPseudonymSession();

    const defaultRes = applyRedaction(text, detections, BASE_SETTINGS, session);
    expect(defaultRes.sanitizedText).toBe('Email [REDACTED] and PAN [REDACTED].');
    expect(defaultRes.redactedCount).toBe(2);

    const customGlobal = applyRedaction(
      text,
      detections,
      { ...BASE_SETTINGS, fullMaskLabel: '***MASKED***' },
      session,
    );
    expect(customGlobal.sanitizedText).toBe('Email ***MASKED*** and PAN ***MASKED***.');

    // Empty label falls back safely to [REDACTED]
    const emptyFallback = applyRedaction(
      text,
      detections,
      { ...BASE_SETTINGS, fullMaskLabel: '   ' },
      session,
    );
    expect(emptyFallback.sanitizedText).toBe('Email [REDACTED] and PAN [REDACTED].');

    const perCategory = applyRedaction(
      text,
      detections,
      { ...BASE_SETTINGS, useCategoryLabels: true },
      session,
    );
    expect(perCategory.sanitizedText).toBe('Email [EMAIL] and PAN [PAN].');
  });

  it('applies entity-appropriate partial masking preserving separators and format', () => {
    const validCheck = computeVerhoeffCheckDigit('23456789012');
    const aadhaar = `2345 6789 012${validCheck}`;
    const text = [
      'Email: john.doe@gmail.com',
      'LocalPhone: 9876543210',
      'IntlPhone: +91-98765-43210',
      'USPhone: +1 202-555-0145',
      'PAN: ABCPK1234F',
      `Aadhaar: ${aadhaar}`,
      'Card: 4532 0151 1283 0366',
      'IPv4: 192.168.1.25',
      'IPv6: 2001:db8::1',
    ].join('\n');

    const detections = detectPII(text);
    const session = createPseudonymSession();
    const res = applyRedaction(
      text,
      detections,
      { ...BASE_SETTINGS, mode: 'partial' },
      session,
    );

    expect(res.sanitizedText).toBe(
      [
        'Email: j***@gmail.com',
        'LocalPhone: XXXXXX3210',
        'IntlPhone: +91-XXXXX-X3210',
        'USPhone: +1 XXX-XXX-0145',
        'PAN: XXXXX1234X',
        `Aadhaar: XXXX XXXX 012${validCheck}`,
        'Card: XXXX XXXX XXXX 0366',
        'IPv4: XXX.XXX.X.25',
        'IPv6: XXXX:XXX::1',
      ].join('\n'),
    );
  });
});

describe('Pseudonymization consistency, normalization, namespaces, and isolation', () => {
  it('assigns consistent per-category placeholders across normalized variants and preserves across re-runs', () => {
    const validCheck = computeVerhoeffCheckDigit('23456789012');
    const text = [
      'Email1: John.Doe@Gmail.com',
      'Email2: john.doe@gmail.com',
      'Email3: alice@example.org',
      'Phone1: +91 9876543210',
      'Phone2: 09876543210',
      'Phone3: 98765-43210',
      'IPv6_A: 2001:0db8:0000:0000:0000:0000:0000:0001',
      'IPv6_B: 2001:db8::1',
      `Aadhaar1: 2345 6789 012${validCheck}`,
      `Aadhaar2: 2345-6789-012${validCheck}`,
      'Card1: 4532 0151 1283 0366',
      'Card2: 4532-0151-1283-0366',
      'PAN1: ABCPK1234F',
    ].join('\n');

    const detections = detectPII(text);
    const session = createPseudonymSession();
    const res1 = applyRedaction(
      text,
      detections,
      { ...BASE_SETTINGS, mode: 'pseudonym' },
      session,
    );

    expect(res1.sanitizedText).toBe(
      [
        'Email1: USER_01',
        'Email2: USER_01',
        'Email3: USER_02',
        'Phone1: PHONE_01',
        'Phone2: PHONE_01',
        'Phone3: PHONE_01',
        'IPv6_A: IP_01',
        'IPv6_B: IP_01',
        'Aadhaar1: AADHAAR_01',
        'Aadhaar2: AADHAAR_01',
        'Card1: CARD_01',
        'Card2: CARD_01',
        'PAN1: PAN_01',
      ].join('\n'),
    );

    // Re-running after switching mode and switching back preserves identical placeholders
    applyRedaction(text, detections, { ...BASE_SETTINGS, mode: 'full' }, session);
    const res2 = applyRedaction(
      text,
      detections,
      { ...BASE_SETTINGS, mode: 'pseudonym' },
      session,
    );
    expect(res2.sanitizedText).toBe(res1.sanitizedText);

    // Session JSON serialization never leaks raw PII mappings
    const serializedSession = JSON.stringify(session);
    expect(serializedSession).not.toContain('john.doe@gmail.com');
    expect(serializedSession).not.toContain('9876543210');
    expect(serializedSession).not.toContain('ABCPK1234F');

    // Reset clears in-memory session mapping
    expect(session.getMappingCount()).toBeGreaterThan(0);
    session.reset();
    expect(session.getMappingCount()).toBe(0);
  });
});
