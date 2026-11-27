import type { PIICategory, RedactionSettings } from '../../types/pii';

const DEFAULT_FALLBACK_LABEL = '[REDACTED]';

/**
 * Resolves a validated, non-empty redaction label for full masking.
 */
export function resolveFullMaskLabel(
  category: PIICategory,
  settings: Pick<RedactionSettings, 'fullMaskLabel' | 'useCategoryLabels' | 'categoryLabels'>,
): string {
  if (settings.useCategoryLabels) {
    const customCategory = settings.categoryLabels[category]?.trim();
    if (customCategory) {
      return customCategory;
    }
  }

  const globalLabel = settings.fullMaskLabel.trim();
  return globalLabel.length > 0 ? globalLabel : DEFAULT_FALLBACK_LABEL;
}

/**
 * Applies full redaction mask to a detected PII span.
 */
export function applyFullMask(
  category: PIICategory,
  settings: Pick<RedactionSettings, 'fullMaskLabel' | 'useCategoryLabels' | 'categoryLabels'>,
): string {
  return resolveFullMaskLabel(category, settings);
}
