import { describe, expect, it } from 'vitest';
import { detectPII } from './detectionEngine';
import { isValidLuhn, detectCardIssuer } from './luhnValidator';
import { computeVerhoeffCheckDigit, isValidVerhoeff } from './verhoeff';
import { canonicalizeIPv6, isValidIPv4, isValidIPv6 } from './ipDetector';

describe('Luhn validator & credit cards', () => {
  it('validates standard test card numbers and rejects Luhn-failing numbers', () => {
    expect(isValidLuhn('4532015112830366')).toBe(true);
    expect(isValidLuhn('4111111111111111')).toBe(true);
    expect(isValidLuhn('5500000000000004')).toBe(true);
    expect(isValidLuhn('378282246310005')).toBe(true);
    expect(isValidLuhn('6011111111111117')).toBe(true);
    expect(isValidLuhn('6521500000000006')).toBe(true);

    // Luhn failures
    expect(isValidLuhn('4532015112830367')).toBe(false);
    expect(isValidLuhn('1234567890123456')).toBe(false);
  });

  it('detects issuers for Visa, Mastercard, Amex, Discover, RuPay', () => {
    expect(detectCardIssuer('4532015112830366')?.issuer).toBe('Visa');
    expect(detectCardIssuer('5500000000000004')?.issuer).toBe('Mastercard');
    expect(detectCardIssuer('378282246310005')?.issuer).toBe('Amex');
    expect(detectCardIssuer('6011111111111117')?.issuer).toBe('Discover');
    expect(detectCardIssuer('6521500000000006')?.issuer).toBe('RuPay');
    expect(detectCardIssuer('0000000000000000')).toBeNull();
  });

  it('never classifies Luhn-failing 16-digit strings or order IDs as cards', () => {
    const text =
      'Valid: 4532 0151 1283 0366; BadLuhn: 4532-0151-1283-0367; Order: ORD-1234567890123456; Random: 1234567890123456';
    const found = detectPII(text);
    expect(found).toHaveLength(1);
    expect(found[0]?.category).toBe('credit_card');
    expect(found[0]?.value).toBe('4532 0151 1283 0366');
    expect(found[0]?.confidence).toBe('Validated');
  });
});

describe('Verhoeff checksum & Aadhaar detection', () => {
  it('computes and verifies Verhoeff checksums accurately', () => {
    const check = computeVerhoeffCheckDigit('23456789012');
    const validAadhaar = `23456789012${check}`;
    expect(isValidVerhoeff(validAadhaar)).toBe(true);

    // Single digit alteration fails Verhoeff
    const corrupted = `23456789013${check}`;
    expect(isValidVerhoeff(corrupted)).toBe(false);
  });

  it('distinguishes Validated Aadhaar from Format match only and honors toggle', () => {
    const validCheck = computeVerhoeffCheckDigit('23456789012');
    const validStr = `2345 6789 012${validCheck}`;
    const invalidCheck = (validCheck + 1) % 10;
    const formatOnlyStr = `2345-6789-012${invalidCheck}`;

    const text = `Primary: ${validStr} Secondary: ${formatOnlyStr} InvalidPrefix: 1234 5678 9012`;

    const all = detectPII(text, { includeUnvalidatedFormatMatches: true });
    expect(all).toHaveLength(2);
    expect(all[0]).toMatchObject({
      category: 'aadhaar',
      value: validStr,
      validation: 'valid',
      confidence: 'Validated',
    });
    expect(all[1]).toMatchObject({
      category: 'aadhaar',
      value: formatOnlyStr,
      validation: 'format_only',
      confidence: 'Format match',
    });

    const validatedOnly = detectPII(text, { includeUnvalidatedFormatMatches: false });
    expect(validatedOnly).toHaveLength(1);
    expect(validatedOnly[0]?.value).toBe(validStr);
  });
});

describe('IPv4 and IPv6 validation', () => {
  it('validates IPv4 octets and rejects version-like strings', () => {
    expect(isValidIPv4('192.168.1.25')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('192.168.01.1')).toBe(false);

    const text = 'Server 192.168.1.25. Build v1.2.3.4 and version 1.2.3.4.5 and bad 300.10.1.1';
    const found = detectPII(text);
    expect(found).toHaveLength(1);
    expect(found[0]?.category).toBe('ip');
    expect(found[0]?.value).toBe('192.168.1.25');
    expect(found[0]?.confidence).toBe('Validated');
  });

  it('validates full, compressed, and IPv4-embedded IPv6 and rejects timestamps', () => {
    expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isValidIPv6('2001:db8::1')).toBe(true);
    expect(isValidIPv6('::1')).toBe(true);
    expect(isValidIPv6('fe80::')).toBe(true);
    expect(isValidIPv6('::ffff:192.0.2.128')).toBe(true);
    expect(isValidIPv6('2001:db8::1::2')).toBe(false);
    expect(isValidIPv6('12:34:56')).toBe(false);

    expect(canonicalizeIPv6('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe('2001:db8::1');

    const text =
      'Hosts: [2001:db8::1], ::ffff:192.0.2.128, and time 12:34:56 or 12:34:56.789.';
    const found = detectPII(text);
    expect(found.map((d) => d.value)).toEqual(['2001:db8::1', '::ffff:192.0.2.128']);
  });
});

describe('PAN detection', () => {
  it('detects valid uppercase PANs with valid holder-type codes and ignores invalid shapes', () => {
    const text = 'PANs: ABCPK1234F, BGLCH9876M. Invalid holder: ABCDX1234F lowercase: abcpk1234f';
    const found = detectPII(text);
    expect(found).toHaveLength(2);
    expect(found[0]?.value).toBe('ABCPK1234F');
    expect(found[1]?.value).toBe('BGLCH9876M');
    expect(found[0]?.confidence).toBe('Validated');
  });
});

describe('Email detection', () => {
  it('extracts emails cleanly without surrounding punctuation', () => {
    const text = 'Contact <john.doe+vip@sub.example.com>, "jane_smith@company.co.in".';
    const found = detectPII(text);
    expect(found.map((d) => d.value)).toEqual([
      'john.doe+vip@sub.example.com',
      'jane_smith@company.co.in',
    ]);
    expect(found[0]?.confidence).toBe('Pattern');
  });
});

describe('Phone detection and false-positive prevention', () => {
  it('detects Indian and international phone formats while ignoring dates, IDs, and long numbers', () => {
    const text =
      'Call +91 9876543210, 9876543210, +91-98765-43210, 09876543210, +1 202-555-0145, (202) 555-0145. Date 2026-11-27, ID ORD-98765432, long 1239876543210456.';
    const found = detectPII(text);
    expect(found.map((d) => d.value)).toEqual([
      '+91 9876543210',
      '9876543210',
      '+91-98765-43210',
      '09876543210',
      '+1 202-555-0145',
      '(202) 555-0145',
    ]);
  });
});

describe('Overlap resolution, offsets, Unicode, and 1MB performance', () => {
  it('never reports a 12-digit Aadhaar or 16-digit card also as a phone', () => {
    const validCheck = computeVerhoeffCheckDigit('98765432101');
    const aadhaar = `98765432101${validCheck}`;
    const card = '6011 1111 1111 1117';
    const found = detectPII(`Aadhaar ${aadhaar} Card ${card}`);
    expect(found.map((d) => d.category)).toEqual(['aadhaar', 'credit_card']);
  });

  it('tracks exact offsets with Unicode, CRLF, and adjacent PII separated only by punctuation', () => {
    const text = 'नमस्ते\r\na@b.co,9876543210;ABCPK1234F';
    const found = detectPII(text);
    expect(found).toHaveLength(3);
    for (const d of found) {
      expect(text.slice(d.start, d.end)).toBe(d.value);
    }
  });

  it('processes a ~1 MB document in linear time (< 1500 ms)', () => {
    const line =
      '2026-11-27 user=a.sharma@example.com phone=+91 9876543210 ip=10.24.8.15 status=OK\n';
    const payload = line.repeat(13000); // ~1.05 MB
    expect(payload.length).toBeGreaterThan(1_000_000);

    const start = performance.now();
    const found = detectPII(payload);
    const elapsed = performance.now() - start;

    expect(found.length).toBe(13000 * 3);
    expect(elapsed).toBeLessThan(1500);
  });
});
