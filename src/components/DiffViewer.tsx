import React, { useRef, useEffect, useCallback } from 'react';
import type { PIIDetection, RedactedSegment } from '../types/pii';
import { CATEGORY_META } from '../types/pii';

interface DiffViewerProps {
  originalText: string;
  detections: PIIDetection[];
  segments: RedactedSegment[];
  isCSV: boolean;
}

// Category color classes for highlights - both background and text
const CATEGORY_HIGHLIGHT: Record<string, { orig: string; san: string; label: string }> = {
  email: { orig: 'bg-amber-500/20 border-b border-amber-500/60', san: 'bg-amber-900/30 border-b border-amber-700/60', label: 'EMAIL' },
  phone: { orig: 'bg-green-500/20 border-b border-green-500/60', san: 'bg-green-900/30 border-b border-green-700/60', label: 'PHONE' },
  ip: { orig: 'bg-blue-500/20 border-b border-blue-500/60', san: 'bg-blue-900/30 border-b border-blue-700/60', label: 'IP' },
  pan: { orig: 'bg-purple-500/20 border-b border-purple-500/60', san: 'bg-purple-900/30 border-b border-purple-700/60', label: 'PAN' },
  aadhaar: { orig: 'bg-cyan-500/20 border-b border-cyan-500/60', san: 'bg-cyan-900/30 border-b border-cyan-700/60', label: 'AADHAAR' },
  credit_card: { orig: 'bg-red-500/20 border-b border-red-500/60', san: 'bg-red-900/30 border-b border-red-700/60', label: 'CARD' },
};

function OriginalPanel({ text, detections }: { text: string; detections: PIIDetection[] }) {
  if (!text) {
    return (
      <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/40 p-4 font-mono text-xs text-slate-500 italic overflow-auto">
        Original document will appear here...
      </div>
    );
  }

  // Build segments from detections
  const segments: Array<{ type: 'text' | 'pii'; text: string; detection?: PIIDetection }> = [];
  const sorted = [...detections].sort((a, b) => a.start - b.start);
  let cursor = 0;

  for (const det of sorted) {
    if (det.start < cursor) continue;
    if (det.start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, det.start) });
    }
    segments.push({ type: 'pii', text: det.value, detection: det });
    cursor = det.end;
  }
  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) });
  }

  return (
    <div
      className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/40 p-4 font-mono text-xs text-slate-300 overflow-auto whitespace-pre-wrap break-words min-h-[200px]"
      aria-label="Original document"
      tabIndex={0}
    >
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        }
        const cat = seg.detection!.category;
        const colors = CATEGORY_HIGHLIGHT[cat];
        const shortLabel = CATEGORY_META[cat].shortLabel;
        return (
          <mark
            key={i}
            className={`${colors?.orig ?? ''} rounded-sm relative group cursor-default`}
            aria-label={`${shortLabel}: ${seg.detection!.confidence}`}
          >
            {seg.text}
            {/* Tooltip */}
            <span
              className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block group-focus:block bg-slate-800 border border-slate-600 text-slate-200 text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none"
              role="tooltip"
            >
              {shortLabel} · {seg.detection!.confidence}
              {seg.detection!.detail ? ` · ${seg.detection!.detail}` : ''}
            </span>
          </mark>
        );
      })}
    </div>
  );
}

function SanitizedPanel({ segments }: { segments: RedactedSegment[] }) {
  if (segments.length === 0) {
    return (
      <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/40 p-4 font-mono text-xs text-slate-500 italic overflow-auto">
        Sanitized document will appear here...
      </div>
    );
  }

  return (
    <div
      className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/40 p-4 font-mono text-xs text-slate-300 overflow-auto whitespace-pre-wrap break-words min-h-[200px]"
      aria-label="Sanitized document"
      tabIndex={0}
    >
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <React.Fragment key={i}>{seg.text}</React.Fragment>;
        }
        const cat = seg.detection!.category;
        const colors = CATEGORY_HIGHLIGHT[cat];
        const shortLabel = CATEGORY_META[cat].shortLabel;
        return (
          <mark
            key={i}
            className={`${colors?.san ?? ''} rounded-sm relative group cursor-default`}
            aria-label={`${shortLabel} redacted`}
          >
            {seg.text}
            {/* Tooltip */}
            <span
              className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block group-focus:block bg-slate-800 border border-slate-600 text-slate-200 text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none"
              role="tooltip"
            >
              {shortLabel} · redacted
            </span>
          </mark>
        );
      })}
    </div>
  );
}

export function DiffViewer({ originalText, detections, segments, isCSV }: DiffViewerProps) {
  return (
    <div
      className="w-full"
      aria-label="Side-by-side diff view"
      role="region"
    >
      {/* Legend */}
      {detections.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3" aria-label="Color legend for PII categories" role="list">
          {Object.entries(CATEGORY_HIGHLIGHT).map(([cat, colors]) => {
            const catKey = cat as keyof typeof CATEGORY_HIGHLIGHT;
            const hasDetection = detections.some((d) => d.category === catKey);
            if (!hasDetection) return null;
            return (
              <span
                key={cat}
                role="listitem"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.orig} text-slate-200`}
              >
                <span aria-hidden="true">■</span>
                {colors.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Two panels */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">
            Original
          </div>
          <OriginalPanel text={originalText} detections={detections} />
        </div>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            Sanitized
            {segments.some((s) => s.type === 'pii') && (
              <span className="text-green-400 font-normal normal-case tracking-normal text-[10px]">
                ✓ {segments.filter((s) => s.type === 'pii').length} replaced
              </span>
            )}
          </div>
          <SanitizedPanel segments={segments} />
        </div>
      </div>
    </div>
  );
}
