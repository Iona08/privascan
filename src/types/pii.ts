export type PIICategory =
  | 'email'
  | 'phone'
  | 'ip'
  | 'pan'
  | 'aadhaar'
  | 'credit_card';

export type ConfidenceLevel = 'Validated' | 'Format match' | 'Pattern';

export type ValidationStatus = 'valid' | 'format_only' | 'heuristic';

export type RedactionMode = 'full' | 'partial' | 'pseudonym';

export interface PIIDetection {
  id: string;
  category: PIICategory;
  start: number;
  end: number;
  value: string;
  validation: ValidationStatus;
  confidence: ConfidenceLevel;
  detail?: string;
}

export type CategoryFilterMap = Record<PIICategory, boolean>;

export interface DetectionOptions {
  enabledCategories: CategoryFilterMap;
  includeUnvalidatedFormatMatches: boolean;
}

export interface RedactionSettings {
  mode: RedactionMode;
  fullMaskLabel: string;
  useCategoryLabels: boolean;
  categoryLabels: Record<PIICategory, string>;
}

export interface RedactedSegment {
  type: 'text' | 'pii';
  text: string;
  originalText: string;
  detection?: PIIDetection;
}

export interface RedactionResult {
  sanitizedText: string;
  segments: RedactedSegment[];
  redactedCount: number;
  charactersSanitized: number;
}

export interface CategoryStatistics {
  email: number;
  phone: number;
  ip: number;
  pan: number;
  aadhaar: number;
  credit_card: number;
}

export interface ScanStatistics {
  totalEntities: number;
  sanitizedEntities: number;
  byCategory: CategoryStatistics;
  validatedCount: number;
  formatMatchCount: number;
  patternCount: number;
  charactersSanitized: number;
}

export type AuditEventType = 'sanitize' | 'export' | 'reset' | 'clear';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  source: string;
  eventType: AuditEventType;
  redactionMode: RedactionMode;
  totalEntities: number;
  byCategory: CategoryStatistics;
}

export type InputSourceType = 'paste' | 'txt' | 'csv';

export interface ParsedCSV {
  headersPresent: boolean;
  rows: string[][];
  delimiter: string;
  lineEnding: '\r\n' | '\n';
  trailingNewline: boolean;
}

export interface CSVCellLocation {
  rowIndex: number;
  colIndex: number;
  detections: PIIDetection[];
}

export const ALL_CATEGORIES: readonly PIICategory[] = [
  'email',
  'phone',
  'ip',
  'pan',
  'aadhaar',
  'credit_card',
] as const;

export const DEFAULT_ENABLED_CATEGORIES: CategoryFilterMap = {
  email: true,
  phone: true,
  ip: true,
  pan: true,
  aadhaar: true,
  credit_card: true,
};

export const DEFAULT_CATEGORY_LABELS: Record<PIICategory, string> = {
  email: '[EMAIL]',
  phone: '[PHONE]',
  ip: '[IP_ADDRESS]',
  pan: '[PAN]',
  aadhaar: '[AADHAAR]',
  credit_card: '[CREDIT_CARD]',
};

export const CATEGORY_META: Record<
  PIICategory,
  {
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  email: {
    label: 'Email Addresses',
    shortLabel: 'EMAIL',
    description: 'Standard email addresses with boundary punctuation handling',
  },
  phone: {
    label: 'Phone Numbers',
    shortLabel: 'PHONE',
    description: 'Indian (+91 / 10-digit mobile) and international E.164 formats',
  },
  ip: {
    label: 'IP Addresses',
    shortLabel: 'IP',
    description: 'Validated IPv4 octets (0–255) and structured IPv6 addresses',
  },
  pan: {
    label: 'PAN Numbers',
    shortLabel: 'PAN',
    description: 'Indian PAN format with holder-type code validation',
  },
  aadhaar: {
    label: 'Aadhaar Numbers',
    shortLabel: 'AADHAAR',
    description: '12-digit Aadhaar (4-4-4) with Verhoeff checksum verification',
  },
  credit_card: {
    label: 'Credit Cards',
    shortLabel: 'CARD',
    description: '13–19 digit payment cards verified by Luhn & issuer prefix',
  },
};
