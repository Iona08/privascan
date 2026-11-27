import type { PIIDetection } from '../../types/pii';

// Linear-time email candidate matcher; programmatic validation enforces RFC-like label rules.
const EMAIL_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}(?![A-Za-z0-9-]|\.[A-Za-z0-9])/g;

function isValidEmailStructure(email: string): boolean {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0 || atIndex !== email.lastIndexOf('@')) {
    return false;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (local.length === 0 || local.length > 64) {
    return false;
  }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }

  if (domain.length < 3 || domain.length > 253 || domain.includes('..')) {
    return false;
  }

  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }

  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    if (!label || label.length > 63) {
      return false;
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
    if (!/^[A-Za-z0-9-]+$/.test(label)) {
      return false;
    }
    if (i === labels.length - 1 && !/^[A-Za-z]{2,24}$/.test(label)) {
      return false;
    }
  }

  return true;
}

/**
 * Detects email addresses while excluding surrounding punctuation (quotes, angle brackets, trailing periods/commas).
 */
export function detectEmails(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];
  EMAIL_CANDIDATE_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = EMAIL_CANDIDATE_REGEX.exec(text)) !== null) {
    const value = match[0];
    const start = match.index;
    const end = start + value.length;

    if (!isValidEmailStructure(value)) {
      continue;
    }

    detections.push({
      id: `email-${start}-${end}`,
      category: 'email',
      start,
      end,
      value,
      validation: 'heuristic',
      confidence: 'Pattern',
      detail: 'Email address pattern',
    });
  }

  return detections;
}
