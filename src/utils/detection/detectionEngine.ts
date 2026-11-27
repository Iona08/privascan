import {
  ALL_CATEGORIES,
  DEFAULT_ENABLED_CATEGORIES,
  type DetectionOptions,
  type PIICategory,
  type PIIDetection,
} from '../../types/pii';
import { detectAadhaar } from './aadhaarDetector';
import { detectCreditCards } from './creditCardDetector';
import { detectEmails } from './emailDetector';
import { detectIPs } from './ipDetector';
import { detectPANs } from './panDetector';
import { detectPhones } from './phoneDetector';

const CATEGORY_PRIORITY: Readonly<Record<PIICategory, number>> = {
  credit_card: 6,
  aadhaar: 5,
  pan: 4,
  ip: 3,
  email: 2,
  phone: 1,
};

const VALIDATION_RANK: Readonly<Record<PIIDetection['validation'], number>> = {
  valid: 3,
  heuristic: 2,
  format_only: 1,
};

const DEFAULT_OPTIONS: DetectionOptions = {
  enabledCategories: DEFAULT_ENABLED_CATEGORIES,
  includeUnvalidatedFormatMatches: true,
};

/**
 * Resolves overlapping or duplicate detections deterministically in O(k log k) time:
 * 1. Longest character span first
 * 2. Validated over heuristic over format_only
 * 3. Category priority (credit_card > aadhaar > pan > ip > email > phone)
 * 4. Earliest start offset
 */
export function resolveOverlaps(detections: PIIDetection[]): PIIDetection[] {
  if (detections.length <= 1) {
    return detections.slice();
  }

  const byStart = detections.slice().sort((a, b) => a.start - b.start || b.end - a.end);
  const accepted: PIIDetection[] = [];

  const resolveCluster = (cluster: PIIDetection[]) => {
    if (cluster.length === 1 && cluster[0]) {
      accepted.push(cluster[0]);
      return;
    }

    cluster.sort((a, b) => {
      const lenDiff = b.end - b.start - (a.end - a.start);
      if (lenDiff !== 0) return lenDiff;

      const valDiff = VALIDATION_RANK[b.validation] - VALIDATION_RANK[a.validation];
      if (valDiff !== 0) return valDiff;

      const catDiff = CATEGORY_PRIORITY[b.category] - CATEGORY_PRIORITY[a.category];
      if (catDiff !== 0) return catDiff;

      return a.start - b.start;
    });

    const localAccepted: PIIDetection[] = [];
    for (const candidate of cluster) {
      const overlaps = localAccepted.some(
        (existing) => candidate.start < existing.end && candidate.end > existing.start,
      );
      if (!overlaps) {
        localAccepted.push(candidate);
      }
    }
    localAccepted.sort((a, b) => a.start - b.start);
    accepted.push(...localAccepted);
  };

  let cluster: PIIDetection[] = [];
  let clusterEnd = -1;

  for (const item of byStart) {
    if (cluster.length === 0 || item.start < clusterEnd) {
      cluster.push(item);
      if (item.end > clusterEnd) {
        clusterEnd = item.end;
      }
    } else {
      resolveCluster(cluster);
      cluster = [item];
      clusterEnd = item.end;
    }
  }

  if (cluster.length > 0) {
    resolveCluster(cluster);
  }

  return accepted;
}

/**
 * Runs all enabled PII detectors on `text`, filters format-only matches if configured,
 * and returns sorted, non-overlapping detections with exact original offsets.
 */
export function detectPII(
  text: string,
  options: Partial<DetectionOptions> = {},
): PIIDetection[] {
  if (!text) {
    return [];
  }

  const enabledCategories = {
    ...DEFAULT_OPTIONS.enabledCategories,
    ...options.enabledCategories,
  };
  const includeUnvalidated =
    options.includeUnvalidatedFormatMatches ?? DEFAULT_OPTIONS.includeUnvalidatedFormatMatches;

  const rawDetections: PIIDetection[] = [];

  // Run all enabled category detectors (order doesn't affect final resolved output)
  const runners: Record<PIICategory, (input: string) => PIIDetection[]> = {
    credit_card: detectCreditCards,
    aadhaar: detectAadhaar,
    pan: detectPANs,
    ip: detectIPs,
    email: detectEmails,
    phone: detectPhones,
  };

  for (const category of ALL_CATEGORIES) {
    if (!enabledCategories[category]) {
      continue;
    }
    const found = runners[category](text);
    for (const item of found) {
      if (!includeUnvalidated && item.validation === 'format_only') {
        continue;
      }
      rawDetections.push(item);
    }
  }

  return resolveOverlaps(rawDetections);
}
