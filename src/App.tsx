import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FileUploader } from './components/FileUploader';
import { RedactionSelector } from './components/RedactionSelector';
import { CategoryFilters } from './components/CategoryFilters';
import { DiffViewer } from './components/DiffViewer';
import { StatisticsDashboard } from './components/StatisticsDashboard';
import { AuditLog } from './components/AuditLog';
import { ExportControls } from './components/ExportControls';
import { LabelSettings } from './components/LabelSettings';
import { HowItWorks } from './components/HowItWorks';
import { PrivacyStatus } from './components/PrivacyStatus';
import { Footer } from './components/Footer';
import { PrivacyIndicator } from './components/PrivacyIndicator';
import { usePIIDetection } from './hooks/usePIIDetection';
import { useRedaction } from './hooks/useRedaction';
import { useAuditLog } from './hooks/useAuditLog';
import { SAMPLE_TEXT, SAMPLE_CSV } from './utils/sampleData';
import { sanitizeCSVDocument } from './utils/export/csvParser';
import { exportSanitizedCSV, exportSanitizedText } from './utils/export/csvExporter';
import type {
  InputSourceType,
  RedactedSegment,
  ScanStatistics,
  CategoryStatistics,
  PIIDetection,
} from './types/pii';
import { ALL_CATEGORIES } from './types/pii';
import { AlertCircle, RotateCcw, FlaskConical, Keyboard, X } from 'lucide-react';

// --- Keyboard shortcut help modal ---
function KeyboardHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-help-title"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="kbd-help-title" className="font-semibold text-slate-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded"
            aria-label="Close keyboard help"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          {[
            ['Alt + S', 'Load sample data'],
            ['Alt + C', 'Clear / reset editor'],
            ['Alt + D', 'Download sanitized output'],
            ['Alt + ?', 'Show this help'],
            ['Escape', 'Close dialogs'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <dt>
                <kbd className="bg-slate-900 border border-slate-600 text-slate-200 text-xs rounded px-2 py-1 font-mono">
                  {key}
                </kbd>
              </dt>
              <dd className="text-slate-400 text-xs text-right">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// Build ScanStatistics from detections
function buildStats(
  detections: PIIDetection[],
  redactedCount: number,
  charactersSanitized: number,
): ScanStatistics {
  const byCategory: CategoryStatistics = {
    email: 0, phone: 0, ip: 0, pan: 0, aadhaar: 0, credit_card: 0,
  };
  let validatedCount = 0;
  let formatMatchCount = 0;
  let patternCount = 0;

  for (const d of detections) {
    byCategory[d.category] += 1;
    if (d.validation === 'valid') validatedCount += 1;
    else if (d.validation === 'format_only') formatMatchCount += 1;
    else patternCount += 1;
  }

  return {
    totalEntities: detections.length,
    sanitizedEntities: redactedCount,
    byCategory,
    validatedCount,
    formatMatchCount,
    patternCount,
    charactersSanitized,
  };
}

export function App() {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Core state
  const [inputText, setInputText] = useState('');
  const [sourceName, setSourceName] = useState('Pasted text');
  const [sourceType, setSourceType] = useState<InputSourceType>('paste');
  const [fileError, setFileError] = useState<string | null>(null);
  const [showKbHelp, setShowKbHelp] = useState(false);

  // Hooks
  const detection = usePIIDetection();
  const redaction = useRedaction();
  const auditLog = useAuditLog();

  // Computed: live redaction result
  const [liveSegments, setLiveSegments] = useState<RedactedSegment[]>([]);
  const [sanitizedText, setSanitizedText] = useState('');
  const [stats, setStats] = useState<ScanStatistics | null>(null);

  // Recompute redaction whenever detections or settings change
  useEffect(() => {
    if (!inputText) {
      setLiveSegments([]);
      setSanitizedText('');
      setStats(null);
      return;
    }

    if (sourceType === 'csv') {
      // CSV mode: sanitize per-cell
      try {
        const csvResult = sanitizeCSVDocument(
          inputText,
          detection.options,
          redaction.settings,
          redaction.session,
        );
        setLiveSegments([]); // flat segments not used for CSV diff
        setSanitizedText(csvResult.sanitizedText);
        // Collect all cell detections for stats
        const allDets: PIIDetection[] = csvResult.allDetections;
        setStats(buildStats(allDets, csvResult.redactedCount, csvResult.charactersSanitized));

        // Log sanitize event
        const byCategory: CategoryStatistics = {
          email: 0, phone: 0, ip: 0, pan: 0, aadhaar: 0, credit_card: 0,
        };
        for (const d of allDets) byCategory[d.category] += 1;
        auditLog.addEntry({
          source: sourceName,
          eventType: 'sanitize',
          redactionMode: redaction.settings.mode,
          totalEntities: allDets.length,
          byCategory,
        });
      } catch {
        // silent
      }
    } else {
      // Plain text mode
      const result = redaction.applyToText(inputText, detection.detections);
      setLiveSegments(result.segments);
      setSanitizedText(result.sanitizedText);
      setStats(buildStats(detection.detections, result.redactedCount, result.charactersSanitized));

      if (detection.detections.length > 0) {
        const byCategory: CategoryStatistics = {
          email: 0, phone: 0, ip: 0, pan: 0, aadhaar: 0, credit_card: 0,
        };
        for (const d of detection.detections) byCategory[d.category] += 1;
        auditLog.addEntry({
          source: sourceName,
          eventType: 'sanitize',
          redactionMode: redaction.settings.mode,
          totalEntities: detection.detections.length,
          byCategory,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    detection.detections,
    detection.options,
    redaction.settings,
    inputText,
    sourceType,
  ]);

  // Run detection whenever input or options change
  useEffect(() => {
    if (sourceType !== 'csv') {
      detection.runDetection(inputText, sourceType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, detection.options, sourceType]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    setSourceName('Pasted text');
    setSourceType('paste');
    setFileError(null);
  }, []);

  const handleFileLoaded = useCallback((text: string, fileName: string, type: InputSourceType) => {
    setInputText(text);
    setSourceName(fileName);
    setSourceType(type);
    setFileError(null);
    detection.clearDetections();
    redaction.resetSession();
    if (type !== 'csv') {
      detection.runDetection(text, type);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadSample = useCallback(() => {
    const sample = SAMPLE_TEXT;
    setInputText(sample);
    setSourceName('Pasted text');
    setSourceType('paste');
    setFileError(null);
    detection.clearDetections();
    redaction.resetSession();
    detection.runDetection(sample, 'paste');
    editorRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = useCallback(() => {
    setInputText('');
    setSourceName('Pasted text');
    setSourceType('paste');
    setFileError(null);
    setLiveSegments([]);
    setSanitizedText('');
    setStats(null);
    detection.clearDetections();
    redaction.resetSession();
    auditLog.addEntry({
      source: sourceName,
      eventType: 'clear',
      redactionMode: redaction.settings.mode,
      totalEntities: 0,
      byCategory: { email: 0, phone: 0, ip: 0, pan: 0, aadhaar: 0, credit_card: 0 },
    });
    editorRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceName]);

  const handleStartSanitizing = useCallback(() => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => editorRef.current?.focus(), 400);
  }, []);

  const handleExport = useCallback(() => {
    const byCategory: CategoryStatistics = {
      email: 0, phone: 0, ip: 0, pan: 0, aadhaar: 0, credit_card: 0,
    };
    if (stats) {
      Object.assign(byCategory, stats.byCategory);
    }
    auditLog.addEntry({
      source: sourceName,
      eventType: 'export',
      redactionMode: redaction.settings.mode,
      totalEntities: stats?.totalEntities ?? 0,
      byCategory,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceName, stats, redaction.settings.mode]);

  // Category counts for filter badges
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<string, number>> = {};
    if (sourceType === 'csv' && stats) {
      return stats.byCategory;
    }
    for (const d of detection.detections) {
      counts[d.category] = (counts[d.category] ?? 0) + 1;
    }
    return counts;
  }, [detection.detections, sourceType, stats]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire if in textarea/input unless it's a shortcut key
      const target = e.target as HTMLElement;
      const inEditor = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
      if (!e.altKey) return;
      if (inEditor && e.altKey) {
        // Allow alt shortcuts even in editor
      }

      if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleLoadSample();
      } else if (e.altKey && e.key === 'c') {
        e.preventDefault();
        handleClear();
      } else if (e.altKey && e.key === 'd') {
        e.preventDefault();
        if (sanitizedText) {
          if (sourceType === 'csv') {
            exportSanitizedCSV(sanitizedText, sourceName, sourceType);
          } else {
            exportSanitizedText(sanitizedText, sourceName, sourceType);
          }
          handleExport();
        }
      } else if (e.altKey && e.key === '?') {
        e.preventDefault();
        setShowKbHelp((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleLoadSample, handleClear, sanitizedText, sourceType, sourceName, handleExport]);

  // Word/char counts
  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100">
      {showKbHelp && <KeyboardHelp onClose={() => setShowKbHelp(false)} />}

      <Navbar />

      <main id="main-content">
        {/* Hero */}
        <Hero onLoadSample={handleLoadSample} onStartSanitizing={handleStartSanitizing} />

        {/* Workspace */}
        <section
          id="workspace"
          ref={workspaceRef}
          aria-labelledby="workspace-heading"
          className="max-w-7xl mx-auto px-4 py-10"
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 id="workspace-heading" className="text-xl font-bold text-slate-100">
              Sanitization Workspace
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <PrivacyIndicator compact />
              <button
                onClick={() => setShowKbHelp(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded px-1"
                aria-label="Show keyboard shortcuts (Alt+?)"
                title="Keyboard shortcuts (Alt+?)"
              >
                <Keyboard className="w-4 h-4" aria-hidden="true" />
                Shortcuts
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left column: Input + controls */}
            <div className="xl:col-span-1 flex flex-col gap-5">
              {/* Input editor */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="pii-editor" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Input Document
                  </label>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span aria-label={`${charCount} characters`}>{charCount.toLocaleString()} chars</span>
                    <span>·</span>
                    <span aria-label={`${wordCount} words`}>{wordCount.toLocaleString()} words</span>
                    <span>·</span>
                    <span className="text-slate-400">{sourceName}</span>
                  </div>
                </div>

                <textarea
                  id="pii-editor"
                  ref={editorRef}
                  value={inputText}
                  onChange={handleTextChange}
                  placeholder="Paste text here, or upload a file below..."
                  className="w-full h-52 bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-sm font-mono text-slate-200 placeholder-slate-600 resize-y focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 leading-relaxed"
                  aria-label="Text editor for PII scanning"
                  aria-describedby="editor-status"
                  spellCheck={false}
                />

                {/* Status for screen readers */}
                <div id="editor-status" className="sr-only" aria-live="polite" aria-atomic="true">
                  {detection.isDetecting
                    ? 'Detecting PII...'
                    : detection.detections.length > 0
                    ? `${detection.detections.length} PII entities detected`
                    : inputText
                    ? 'No PII detected'
                    : 'Enter text to scan'}
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                    title="Alt+S"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    Load Sample
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={!inputText}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-400 disabled:opacity-40 rounded-lg px-3 py-1.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                    title="Alt+C"
                    aria-label="Clear and reset editor"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Clear
                  </button>
                </div>
              </div>

              {/* File uploader */}
              <FileUploader
                onFileLoaded={handleFileLoaded}
                onError={(msg) => setFileError(msg)}
                currentSource={sourceName !== 'Pasted text' ? sourceName : null}
              />

              {/* File error */}
              {fileError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-red-900/30 border border-red-800/50 text-red-300 text-xs p-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{fileError}</span>
                  <button
                    onClick={() => setFileError(null)}
                    className="ml-auto shrink-0 hover:text-red-100 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Redaction mode */}
              <RedactionSelector
                mode={redaction.settings.mode}
                onChange={redaction.setMode}
              />

              {/* Category filters */}
              <CategoryFilters
                enabledCategories={detection.options.enabledCategories}
                onChange={detection.setEnabledCategories}
                counts={categoryCounts}
              />

              {/* Unvalidated toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={detection.options.includeUnvalidatedFormatMatches}
                  onChange={(e) => detection.setIncludeUnvalidated(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/40 focus:ring-2"
                  aria-label="Include unvalidated format-only matches (e.g., Aadhaar-shaped numbers that fail Verhoeff checksum)"
                />
                <span className="text-xs text-slate-400">Include unvalidated format matches</span>
              </label>

              {/* Label settings */}
              <LabelSettings
                settings={redaction.settings}
                onFullLabelChange={redaction.setFullMaskLabel}
                onUseCategoryLabelsChange={redaction.setUseCategoryLabels}
                onCategoryLabelChange={redaction.setCategoryLabel}
              />
            </div>

            {/* Right column: Diff + stats + export + audit */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* Diff viewer */}
              <DiffViewer
                originalText={inputText}
                detections={sourceType === 'csv' ? [] : detection.detections}
                segments={sourceType === 'csv' ? [] : liveSegments}
                isCSV={sourceType === 'csv'}
              />

              {/* CSV notice */}
              {sourceType === 'csv' && inputText && (
                <div className="rounded-lg bg-cyan-900/20 border border-cyan-800/40 p-3 text-xs text-cyan-300">
                  CSV mode: PII detected and sanitized per cell. Download to get the sanitized CSV.
                  {stats && stats.totalEntities > 0 && (
                    <span className="ml-2 font-semibold">{stats.totalEntities} entities found.</span>
                  )}
                </div>
              )}

              {/* Statistics */}
              <StatisticsDashboard stats={stats} hasInput={inputText.length > 0} />

              {/* Export */}
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Export Sanitized Output
                </h3>
                <ExportControls
                  sanitizedText={sanitizedText}
                  sourceType={sourceType}
                  sourceName={sourceName}
                  hasContent={sanitizedText.length > 0}
                  onExport={handleExport}
                />
              </div>

              {/* Audit log */}
              <AuditLog
                entries={auditLog.entries}
                onClear={() => {
                  auditLog.clearLog();
                }}
              />
            </div>
          </div>
        </section>

        <HowItWorks />
        <PrivacyStatus />
      </main>

      <Footer />
    </div>
  );
}
