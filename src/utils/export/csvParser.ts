import type {
  DetectionOptions,
  PIIDetection,
  RedactedSegment,
  RedactionSettings,
} from '../../types/pii';
import { detectPII } from '../detection/detectionEngine';
import type { PseudonymSession } from '../redaction/pseudonymizer';
import { applyRedaction } from '../redaction/redactionEngine';

export interface CSVCell {
  value: string;
  quoted: boolean;
}

export interface ParsedCSVDocument {
  rows: CSVCell[][];
  delimiter: string;
  lineEnding: '\r\n' | '\n';
  trailingNewline: boolean;
}

export interface SanitizedCSVCell {
  originalValue: string;
  sanitizedValue: string;
  detections: PIIDetection[];
  segments: RedactedSegment[];
}

export interface SanitizedCSVResult {
  parsed: ParsedCSVDocument;
  sanitizedRows: SanitizedCSVCell[][];
  sanitizedText: string;
  allDetections: PIIDetection[];
  redactedCount: number;
  charactersSanitized: number;
}

function detectDelimiter(text: string): string {
  // Inspect first line outside quotes to choose between ',', ';', and '\t' (RFC 4180 defaults to ',')
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;
  let tabs = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (ch === '"') {
      if (inQuotes && text.charAt(i + 1) === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes) {
      if (ch === '\n' || ch === '\r') {
        break;
      }
      if (ch === ',') commas += 1;
      else if (ch === ';') semicolons += 1;
      else if (ch === '\t') tabs += 1;
    }
  }

  if (commas > 0) return ',';
  if (semicolons > tabs && semicolons > 0) return ';';
  if (tabs > 0) return '\t';
  return ',';
}

/**
 * Parses an RFC 4180 CSV string while preserving delimiter, line endings,
 * trailing newline state, embedded quotes, embedded commas, and embedded newlines.
 */
export function parseCSV(text: string): ParsedCSVDocument {
  const lineEnding: '\r\n' | '\n' = text.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = text.endsWith('\n') || text.endsWith('\r');

  if (!text) {
    return {
      rows: [],
      delimiter: ',',
      lineEnding,
      trailingNewline: false,
    };
  }

  const delimiter = detectDelimiter(text);
  const rows: CSVCell[][] = [];
  let currentRow: CSVCell[] = [];
  let currentField = '';
  let inQuotes = false;
  let fieldQuoted = false;
  let atFieldStart = true;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);

    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
      continue;
    }

    if (atFieldStart && ch === '"') {
      inQuotes = true;
      fieldQuoted = true;
      atFieldStart = false;
      continue;
    }

    if (ch === delimiter) {
      currentRow.push({ value: currentField, quoted: fieldQuoted });
      currentField = '';
      fieldQuoted = false;
      atFieldStart = true;
      continue;
    }

    if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text.charAt(i + 1) === '\n') {
        i += 1;
      }
      currentRow.push({ value: currentField, quoted: fieldQuoted });
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      fieldQuoted = false;
      atFieldStart = true;
      continue;
    }

    currentField += ch;
    atFieldStart = false;
  }

  // Push final field/row unless we just ended cleanly on a trailing newline
  if (!atFieldStart || currentRow.length > 0 || fieldQuoted) {
    currentRow.push({ value: currentField, quoted: fieldQuoted });
    rows.push(currentRow);
  }

  return {
    rows,
    delimiter,
    lineEnding,
    trailingNewline,
  };
}

/**
 * Serializes a parsed CSV (with optional replacement cell strings) back into valid RFC 4180 text.
 * Unchanged cells preserve their original quoting for lossless round-tripping.
 */
export function serializeCSV(
  parsed: ParsedCSVDocument,
  overrideValues?: string[][],
): string {
  if (parsed.rows.length === 0) {
    return '';
  }

  const lines = parsed.rows.map((row, rIdx) => {
    const cells = row.map((cell, cIdx) => {
      const val = overrideValues?.[rIdx]?.[cIdx] ?? cell.value;
      const isUnchanged = val === cell.value;
      const mustQuote =
        val.includes(parsed.delimiter) ||
        val.includes('"') ||
        val.includes('\n') ||
        val.includes('\r') ||
        (isUnchanged && cell.quoted);

      if (!mustQuote) {
        return val;
      }
      return `"${val.replace(/"/g, '""')}"`;
    });
    return cells.join(parsed.delimiter);
  });

  const body = lines.join(parsed.lineEnding);
  return parsed.trailingNewline ? `${body}${parsed.lineEnding}` : body;
}

/**
 * Runs PII detection and redaction per CSV cell so detections never cross cell boundaries.
 */
export function sanitizeCSVDocument(
  rawText: string,
  detectionOptions: Partial<DetectionOptions>,
  redactionSettings: RedactionSettings,
  pseudonymSession: PseudonymSession,
): SanitizedCSVResult {
  const parsed = parseCSV(rawText);
  const allDetections: PIIDetection[] = [];
  let redactedCount = 0;
  let charactersSanitized = 0;

  const sanitizedValues: string[][] = [];
  const sanitizedRows: SanitizedCSVCell[][] = parsed.rows.map((row, rowIndex) => {
    const rowValues: string[] = [];
    const cellResults: SanitizedCSVCell[] = row.map((cell, colIndex) => {
      const cellDetections = detectPII(cell.value, detectionOptions).map((det) => ({
        ...det,
        id: `r${rowIndex}-c${colIndex}-${det.id}`,
      }));

      const result = applyRedaction(
        cell.value,
        cellDetections,
        redactionSettings,
        pseudonymSession,
      );

      allDetections.push(...cellDetections);
      redactedCount += result.redactedCount;
      charactersSanitized += result.charactersSanitized;
      rowValues.push(result.sanitizedText);

      return {
        originalValue: cell.value,
        sanitizedValue: result.sanitizedText,
        detections: cellDetections,
        segments: result.segments,
      };
    });

    sanitizedValues.push(rowValues);
    return cellResults;
  });

  const sanitizedText = serializeCSV(parsed, sanitizedValues);

  return {
    parsed,
    sanitizedRows,
    sanitizedText,
    allDetections,
    redactedCount,
    charactersSanitized,
  };
}
