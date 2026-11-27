import type { PIIDetection } from '../../types/pii';

function maskEmail(value: string): string {
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) {
    return '***';
  }
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  return `${local.charAt(0)}***@${domain}`;
}

function maskDigitsKeepLast4(value: string): string {
  const digitIndices: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      digitIndices.push(i);
    }
  }

  if (digitIndices.length <= 4) {
    return value.replace(/\d/g, 'X');
  }

  const keepStartIdx = digitIndices.length - 4;
  const maskSet = new Set(digitIndices.slice(0, keepStartIdx));

  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    out += maskSet.has(i) ? 'X' : value.charAt(i);
  }
  return out;
}

function maskPhone(value: string): string {
  // Preserve explicit separated country code prefix like "+91 ", "+91-", "+1 ", "(+91) "
  const ccMatch = /^(\(?\+[1-9]\d{0,2}\)?[ -])(.+)$/.exec(value);
  if (ccMatch) {
    const prefix = ccMatch[1] ?? '';
    const rest = ccMatch[2] ?? '';
    return `${prefix}${maskDigitsKeepLast4(rest)}`;
  }

  return maskDigitsKeepLast4(value);
}

function maskPAN(value: string): string {
  if (value.length !== 10) {
    return value.replace(/[A-Z0-9]/g, 'X');
  }
  return `XXXXX${value.slice(5, 9)}X`;
}

function maskIPv4(value: string): string {
  const parts = value.split('.');
  if (parts.length !== 4) {
    return value.replace(/\d/g, 'X');
  }
  return `${'X'.repeat(parts[0]?.length ?? 1)}.${'X'.repeat(parts[1]?.length ?? 1)}.${'X'.repeat(parts[2]?.length ?? 1)}.${parts[3] ?? ''}`;
}

function maskIPv6(value: string): string {
  const lastColon = value.lastIndexOf(':');
  if (lastColon === -1) {
    return value.replace(/[0-9A-Fa-f]/g, 'X');
  }
  const head = value.slice(0, lastColon + 1).replace(/[0-9A-Fa-f]/g, 'X');
  const tail = value.slice(lastColon + 1);
  if (tail.includes('.')) {
    return `${head}${maskIPv4(tail)}`;
  }
  return `${head}${tail}`;
}

function maskIP(value: string): string {
  return value.includes(':') ? maskIPv6(value) : maskIPv4(value);
}

/**
 * Applies entity-appropriate partial masking while preserving structure, separators, and grouping.
 */
export function applyPartialMask(detection: PIIDetection): string {
  switch (detection.category) {
    case 'email':
      return maskEmail(detection.value);
    case 'phone':
      return maskPhone(detection.value);
    case 'pan':
      return maskPAN(detection.value);
    case 'aadhaar':
    case 'credit_card':
      return maskDigitsKeepLast4(detection.value);
    case 'ip':
      return maskIP(detection.value);
  }
}
