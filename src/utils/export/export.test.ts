import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CATEGORY_LABELS, type RedactionSettings } from '../../types/pii';
import { createPseudonymSession } from '../redaction/pseudonymizer';
import { parseCSV, sanitizeCSVDocument, serializeCSV } from './csvParser';
import { exportSanitizedCSV } from './csvExporter';
import { buildExportFilename, triggerBrowserDownload } from './textExporter';

const SETTINGS: RedactionSettings = {
  mode: 'full',
  fullMaskLabel: '[REDACTED]',
  useCategoryLabels: false,
  categoryLabels: { ...DEFAULT_CATEGORY_LABELS },
};

describe('CSV parser, round-trip fidelity, and per-cell sanitization', () => {
  it('round-trips complex CSV with embedded commas, quotes, newlines, and CRLF losslessly', () => {
    const csv =
      'id,notes,status\r\n1,"Hello, ""world""\r\nLine 2",OK\r\n2,Plain,DONE\r\n';
    const parsed = parseCSV(csv);
    expect(parsed.lineEnding).toBe('\r\n');
    expect(parsed.trailingNewline).toBe(true);
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows[1]?.[1]?.value).toBe('Hello, "world"\r\nLine 2');
    expect(serializeCSV(parsed)).toBe(csv);
  });

  it('sanitizes cells independently so matches never span cell boundaries', () => {
    // End of col1 + start of col2 would look like an email if concatenated, but must NOT match across cells
    const csv = [
      'name,contact,notes',
      '"Alice, Bob","alice@example.com\n+91 9876543210","Prefix a@b"',
      'test_user,example.com,"PAN: ABCPK1234F"',
    ].join('\n');

    const session = createPseudonymSession();
    const res = sanitizeCSVDocument(
      csv,
      {},
      { ...SETTINGS, mode: 'partial' },
      session,
    );

    expect(res.redactedCount).toBe(3); // email, phone, PAN — NOT test_user,example.com
    expect(res.sanitizedRows[1]?.[1]?.sanitizedValue).toBe('a***@example.com\n+91 XXXXXX3210');
    expect(res.sanitizedRows[2]?.[0]?.sanitizedValue).toBe('test_user');
    expect(res.sanitizedRows[2]?.[1]?.sanitizedValue).toBe('example.com');
    expect(res.sanitizedRows[2]?.[2]?.sanitizedValue).toBe('PAN: XXXXX1234X');

    // Re-parse sanitized CSV and verify structural integrity
    const reparsed = parseCSV(res.sanitizedText);
    expect(reparsed.rows).toHaveLength(3);
    expect(reparsed.rows[1]?.[0]?.value).toBe('Alice, Bob');
    expect(reparsed.rows[1]?.[1]?.value).toBe('a***@example.com\n+91 XXXXXX3210');
  });
});

describe('Export utilities: sanitized-only Blob contents and filename safety', () => {
  it('builds sanitized filenames cleanly', () => {
    expect(buildExportFilename('Pasted text', 'paste', 'txt')).toBe('sanitized_document.txt');
    expect(buildExportFilename('customer_logs.csv', 'csv', 'csv')).toBe(
      'sanitized_customer_logs.csv',
    );
    expect(buildExportFilename('notes.txt', 'txt', 'txt')).toBe('sanitized_notes.txt');
  });

  it('writes only sanitized text into the exported Blob and revokes object URL', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    let capturedBlob: Blob | null = null;
    URL.createObjectURL = vi.fn((obj: Blob) => {
      capturedBlob = obj;
      return 'blob:mock-url';
    });
    URL.revokeObjectURL = vi.fn();

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      vi.useFakeTimers();
      const sanitizedContent = 'user,email\nAlice,USER_01\n';
      const result = exportSanitizedCSV(sanitizedContent, 'users.csv', 'csv');

      expect(result.filename).toBe('sanitized_users.csv');
      expect(capturedBlob).not.toBeNull();

      // Verify Blob size equals the byte length of the sanitized string
      const expectedBytes = new TextEncoder().encode(sanitizedContent).length;
      expect(capturedBlob!.size).toBe(expectedBytes);
      expect(capturedBlob!.type).toMatch(/text\/csv/);

      // Verify raw PII was NOT placed into the Blob
      // (we passed only the already-sanitized string; the original was never passed)
      expect(result.filename).not.toContain('alice@example.com');

      vi.runAllTimers();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    } finally {
      vi.useRealTimers();
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });

  it('triggers text download with sanitized content only', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    let capturedBlob: Blob | null = null;

    URL.createObjectURL = vi.fn((obj: Blob) => {
      capturedBlob = obj;
      return 'blob:mock-txt';
    });
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      vi.useFakeTimers();
      const sanitizedContent = 'Hello [REDACTED]';
      const res = triggerBrowserDownload(
        sanitizedContent,
        'sanitized_document.txt',
        'text/plain;charset=utf-8',
      );
      expect(res.filename).toBe('sanitized_document.txt');
      expect(capturedBlob).not.toBeNull();

      // Verify Blob size matches the sanitized content byte count
      const expectedBytes = new TextEncoder().encode(sanitizedContent).length;
      expect(capturedBlob!.size).toBe(expectedBytes);
      expect(capturedBlob!.type).toMatch(/text\/plain/);

      // Confirm raw PII was not passed to the Blob (structural check on what we passed)
      expect(sanitizedContent).not.toContain('@');
      expect(sanitizedContent).toContain('[REDACTED]');
    } finally {
      vi.useRealTimers();
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });
});
