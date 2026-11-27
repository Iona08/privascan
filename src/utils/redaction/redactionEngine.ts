import type {
  PIIDetection,
  RedactedSegment,
  RedactionResult,
  RedactionSettings,
} from '../../types/pii';
import { applyFullMask } from './fullMask';
import { applyPartialMask } from './partialMask';
import type { PseudonymSession } from './pseudonymizer';

/**
 * Computes replacement text for a single detection under the selected redaction mode.
 */
export function redactDetection(
  detection: PIIDetection,
  settings: RedactionSettings,
  pseudonymSession: PseudonymSession,
): string {
  switch (settings.mode) {
    case 'full':
      return applyFullMask(detection.category, settings);
    case 'partial':
      return applyPartialMask(detection);
    case 'pseudonym':
      return pseudonymSession.getPlaceholder(detection.category, detection.value);
  }
}

/**
 * Builds sanitized text and aligned segments from sorted, non-overlapping detections
 * without drifting character offsets, preserving all non-PII whitespace and newlines.
 */
export function applyRedaction(
  text: string,
  detections: readonly PIIDetection[],
  settings: RedactionSettings,
  pseudonymSession: PseudonymSession,
): RedactionResult {
  if (!text) {
    return {
      sanitizedText: '',
      segments: [],
      redactedCount: 0,
      charactersSanitized: 0,
    };
  }

  if (detections.length === 0) {
    return {
      sanitizedText: text,
      segments: [{ type: 'text', text, originalText: text }],
      redactedCount: 0,
      charactersSanitized: 0,
    };
  }

  const sorted = detections.slice().sort((a, b) => a.start - b.start);
  const segments: RedactedSegment[] = [];
  let cursor = 0;
  let charactersSanitized = 0;

  for (const detection of sorted) {
    if (detection.start < cursor) {
      // Defensive guard against overlapping input
      continue;
    }

    if (detection.start > cursor) {
      const plain = text.slice(cursor, detection.start);
      segments.push({
        type: 'text',
        text: plain,
        originalText: plain,
      });
    }

    const replacement = redactDetection(detection, settings, pseudonymSession);
    segments.push({
      type: 'pii',
      text: replacement,
      originalText: detection.value,
      detection,
    });
    charactersSanitized += detection.value.length;
    cursor = detection.end;
  }

  if (cursor < text.length) {
    const tail = text.slice(cursor);
    segments.push({
      type: 'text',
      text: tail,
      originalText: tail,
    });
  }

  const sanitizedText = segments.map((seg) => seg.text).join('');

  return {
    sanitizedText,
    segments,
    redactedCount: sorted.length,
    charactersSanitized,
  };
}
