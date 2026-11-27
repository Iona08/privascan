import React from 'react';
import { Download, FileText, File, CheckCircle, AlertCircle } from 'lucide-react';
import type { InputSourceType } from '../types/pii';
import { exportSanitizedText, exportSanitizedCSV } from '../utils/export/csvExporter';
import { buildExportFilename } from '../utils/export/textExporter';

interface ExportControlsProps {
  sanitizedText: string;
  sourceType: InputSourceType;
  sourceName: string;
  hasContent: boolean;
  onExport: () => void;
}

export function ExportControls({
  sanitizedText,
  sourceType,
  sourceName,
  hasContent,
  onExport,
}: ExportControlsProps) {
  const [notification, setNotification] = React.useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownload = () => {
    if (!sanitizedText || !hasContent) return;
    try {
      if (sourceType === 'csv') {
        const result = exportSanitizedCSV(sanitizedText, sourceName, sourceType);
        showNotification('success', `Downloaded ${result.filename}`);
      } else {
        const result = exportSanitizedText(sanitizedText, sourceName, sourceType);
        showNotification('success', `Downloaded ${result.filename}`);
      }
      onExport();
    } catch {
      showNotification('error', 'Download failed. Please try again.');
    }
  };

  const filename = buildExportFilename(sourceName, sourceType, sourceType === 'csv' ? 'csv' : 'txt');

  return (
    <div className="flex flex-col gap-3">
      {/* Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            notification.type === 'success'
              ? 'bg-green-900/40 border border-green-800/50 text-green-300'
              : 'bg-red-900/40 border border-red-800/50 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          {notification.message}
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={!hasContent}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2 ${
          hasContent
            ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
            : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/40'
        }`}
        aria-label={
          hasContent
            ? `Download sanitized ${sourceType === 'csv' ? 'CSV' : 'text'} file as ${filename} (Alt+D)`
            : 'No sanitized content to download'
        }
        title="Keyboard shortcut: Alt+D"
        aria-disabled={!hasContent}
      >
        {sourceType === 'csv' ? (
          <FileText className="w-4 h-4" aria-hidden="true" />
        ) : (
          <File className="w-4 h-4" aria-hidden="true" />
        )}
        <Download className="w-4 h-4" aria-hidden="true" />
        Download {sourceType === 'csv' ? '.csv' : '.txt'}
      </button>

      {hasContent && (
        <p className="text-xs text-slate-500 text-center">
          Will download as <code className="text-slate-400">{filename}</code>
        </p>
      )}
    </div>
  );
}
