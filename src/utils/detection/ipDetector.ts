import type { PIIDetection } from '../../types/pii';

const IPV4_CANDIDATE_REGEX =
  /(?<![0-9A-Za-z.])(?:\d{1,3}\.){3}\d{1,3}(?![0-9A-Za-z]|\.[0-9A-Za-z])/g;

const IPV6_CANDIDATE_REGEX =
  /(?<![0-9A-Za-z:.])[0-9A-Fa-f:.]{2,46}(?![0-9A-Za-z:])/g;

/**
 * Validates strict dotted-quad IPv4 syntax (each octet 0-255, no leading zeros on multi-digit octets).
 */
export function isValidIPv4(value: string): boolean {
  const parts = value.split('.');
  if (parts.length !== 4) {
    return false;
  }

  for (const part of parts) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) {
      return false;
    }
    const num = Number(part);
    if (num < 0 || num > 255) {
      return false;
    }
  }

  return true;
}

/**
 * Parses and validates an IPv6 address (full, compressed ::, and IPv4-embedded suffix forms).
 * Returns expanded 8-hextet array (numbers 0..65535) if valid, or null if invalid.
 */
export function parseIPv6(value: string): number[] | null {
  if (!value.includes(':') || value.includes(':::')) {
    return null;
  }

  const doubleColonParts = value.split('::');
  if (doubleColonParts.length > 2) {
    return null;
  }

  const hasCompression = doubleColonParts.length === 2;
  const leftRaw = doubleColonParts[0] ?? '';
  const rightRaw = doubleColonParts[1] ?? '';

  const leftTokens = leftRaw === '' ? [] : leftRaw.split(':');
  const rightTokens = rightRaw === '' ? [] : rightRaw.split(':');

  // Empty tokens inside split parts (e.g. leading/trailing single colon like ":1" or "1:") are invalid
  if (leftTokens.some((t) => t === '') || rightTokens.some((t) => t === '')) {
    return null;
  }

  const parseTokens = (tokens: string[], allowIpv4Last: boolean): number[] | null => {
    const hextets: number[] = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (!token) {
        return null;
      }

      const isLast = i === tokens.length - 1;
      if (token.includes('.')) {
        if (!allowIpv4Last || !isLast || !isValidIPv4(token)) {
          return null;
        }
        const octets = token.split('.').map(Number);
        if (octets.length !== 4) {
          return null;
        }
        const [a, b, c, d] = octets;
        if (a === undefined || b === undefined || c === undefined || d === undefined) {
          return null;
        }
        hextets.push((a << 8) | b, (c << 8) | d);
      } else {
        if (!/^[0-9A-Fa-f]{1,4}$/.test(token)) {
          return null;
        }
        hextets.push(parseInt(token, 16));
      }
    }
    return hextets;
  };

  // IPv4 suffix can only appear at the end of the right half (or only half if no ::)
  const leftHextets = parseTokens(leftTokens, !hasCompression);
  if (!leftHextets) {
    return null;
  }

  const rightHextets = parseTokens(rightTokens, hasCompression);
  if (!rightHextets) {
    return null;
  }

  const totalExplicit = leftHextets.length + rightHextets.length;
  if (hasCompression) {
    if (totalExplicit >= 8) {
      return null;
    }
    const zeroCount = 8 - totalExplicit;
    return [
      ...leftHextets,
      ...Array<number>(zeroCount).fill(0),
      ...rightHextets,
    ];
  }

  return totalExplicit === 8 ? leftHextets : null;
}

/**
 * Validates whether a string is a syntactically valid IPv6 address.
 */
export function isValidIPv6(value: string): boolean {
  return parseIPv6(value) !== null;
}

/**
 * Canonicalizes an IPv6 address into RFC 5952 lowercase compressed form for stable pseudonymization.
 */
export function canonicalizeIPv6(value: string): string {
  const hextets = parseIPv6(value);
  if (!hextets || hextets.length !== 8) {
    return value.toLowerCase();
  }

  // Find longest run of >= 2 consecutive zero hextets
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < 8; i += 1) {
    if (hextets[i] === 0) {
      if (curStart === -1) {
        curStart = i;
        curLen = 1;
      } else {
        curLen += 1;
      }
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  if (bestLen < 2) {
    return hextets.map((h) => h.toString(16)).join(':');
  }

  const left = hextets
    .slice(0, bestStart)
    .map((h) => h.toString(16))
    .join(':');
  const right = hextets
    .slice(bestStart + bestLen)
    .map((h) => h.toString(16))
    .join(':');

  return `${left}::${right}`;
}

/**
 * Detects validated IPv4 and IPv6 addresses.
 */
export function detectIPs(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];

  // IPv6 first so IPv4-embedded IPv6 addresses (e.g. ::ffff:192.0.2.128) are captured whole
  const ipv6Spans: Array<{ start: number; end: number }> = [];
  IPV6_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = IPV6_CANDIDATE_REGEX.exec(text)) !== null) {
    let value = match[0];
    const start = match.index;

    // Trim trailing sentence punctuation dots without breaking valid trailing "::"
    while (value.endsWith('.')) {
      value = value.slice(0, -1);
    }
    if (!value.includes(':') || !isValidIPv6(value)) {
      continue;
    }

    const end = start + value.length;
    ipv6Spans.push({ start, end });
    detections.push({
      id: `ip-${start}-${end}`,
      category: 'ip',
      start,
      end,
      value,
      validation: 'valid',
      confidence: 'Validated',
      detail: 'IPv6 (structure validated)',
    });
  }

  IPV4_CANDIDATE_REGEX.lastIndex = 0;
  while ((match = IPV4_CANDIDATE_REGEX.exec(text)) !== null) {
    const value = match[0];
    const start = match.index;
    const end = start + value.length;

    if (!isValidIPv4(value)) {
      continue;
    }

    // Skip if already contained inside a detected IPv4-mapped IPv6 address
    const insideIPv6 = ipv6Spans.some((span) => start >= span.start && end <= span.end);
    if (insideIPv6) {
      continue;
    }

    detections.push({
      id: `ip-${start}-${end}`,
      category: 'ip',
      start,
      end,
      value,
      validation: 'valid',
      confidence: 'Validated',
      detail: 'IPv4 (octets 0–255 validated)',
    });
  }

  return detections;
}
