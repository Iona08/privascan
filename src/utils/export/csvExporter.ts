import type { InputSourceType } from '../../types/pii';
import {
  buildExportFilename,
  triggerBrowserDownload,
  type ExportResult,
} from './textExporter';

export function exportSanitizedText(
  sanitizedText: string,
  sourceName: string,
  sourceType: InputSourceType,
): ExportResult {
  const filename = buildExportFilename(sourceName, sourceType, 'txt');
  return triggerBrowserDownload(sanitizedText, filename, 'text/plain;charset=utf-8');
}

export function exportSanitizedCSV(
  sanitizedCsvText: string,
  sourceName: string,
  sourceType: InputSourceType,
): ExportResult {
  const filename = buildExportFilename(sourceName, sourceType, 'csv');
  return triggerBrowserDownload(sanitizedCsvText, filename, 'text/csv;charset=utf-8');
}
