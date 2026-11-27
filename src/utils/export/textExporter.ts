import type { InputSourceType } from '../../types/pii';

export interface ExportResult {
  filename: string;
  byteSize: number;
}

/**
 * Derives a safe, meaningful download filename for sanitized output.
 */
export function buildExportFilename(
  sourceName: string,
  sourceType: InputSourceType,
  extension: 'txt' | 'csv',
): string {
  const trimmed = sourceName.trim();
  if (!trimmed || sourceType === 'paste' || trimmed.toLowerCase() === 'pasted text') {
    return extension === 'csv' ? 'sanitized_document.csv' : 'sanitized_document.txt';
  }

  // Strip path components and unsafe filename characters
  const leaf = trimmed.split(/[/\\]/).pop() ?? 'document';
  const withoutExt = leaf.replace(/\.[^.]+$/, '');
  const safeBase = withoutExt.replace(/[^A-Za-z0-9._-]/g, '_') || 'document';
  return `sanitized_${safeBase}.${extension}`;
}

/**
 * Creates an in-memory Blob, triggers download of sanitized content only,
 * and revokes the object URL afterward.
 */
export function triggerBrowserDownload(
  sanitizedContent: string,
  filename: string,
  mimeType: string,
): ExportResult {
  const blob = new Blob([sanitizedContent], { type: mimeType });
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // Defer revocation briefly so browsers finish initiating the download stream
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return {
    filename,
    byteSize: blob.size,
  };
}
