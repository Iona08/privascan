import React from 'react';
import type { ScanStatistics } from '../types/pii';
import { CATEGORY_META, ALL_CATEGORIES } from '../types/pii';
import { ShieldCheck, AlertTriangle, Scan } from 'lucide-react';

interface StatisticsDashboardProps {
  stats: ScanStatistics | null;
  hasInput: boolean;
}

const CATEGORY_COLORS = {
  email: 'bg-amber-900/30 border-amber-700/40 text-amber-300',
  phone: 'bg-green-900/30 border-green-700/40 text-green-300',
  ip: 'bg-blue-900/30 border-blue-700/40 text-blue-300',
  pan: 'bg-purple-900/30 border-purple-700/40 text-purple-300',
  aadhaar: 'bg-cyan-900/30 border-cyan-700/40 text-cyan-300',
  credit_card: 'bg-red-900/30 border-red-700/40 text-red-300',
};

export function StatisticsDashboard({ stats, hasInput }: StatisticsDashboardProps) {
  if (!hasInput) {
    return (
      <div
        className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-8 text-center"
        aria-live="polite"
        aria-label="Statistics dashboard empty state"
      >
        <Scan className="w-10 h-10 text-slate-600 mx-auto mb-3" aria-hidden="true" />
        <p className="text-slate-500 text-sm">Paste or upload text to see statistics</p>
      </div>
    );
  }

  if (!stats || stats.totalEntities === 0) {
    return (
      <div
        className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-6 text-center"
        aria-live="polite"
        aria-label="No PII detected"
      >
        <ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-green-400 font-semibold text-sm">No PII Detected</p>
        <p className="text-slate-500 text-xs mt-1">The document appears clean with current filters.</p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="stats-heading"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 id="stats-heading" className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Detection Statistics
      </h2>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/40 p-3">
          <div className="text-2xl font-bold text-slate-100" aria-label={`${stats.totalEntities} total PII entities`}>
            {stats.totalEntities}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Total Entities</div>
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/40 p-3">
          <div className="text-2xl font-bold text-green-400" aria-label={`${stats.sanitizedEntities} sanitized`}>
            {stats.sanitizedEntities}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Sanitized</div>
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/40 p-3">
          <div className="text-2xl font-bold text-cyan-400" aria-label={`${stats.validatedCount} validated`}>
            {stats.validatedCount}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Validated</div>
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/40 p-3">
          <div className="text-2xl font-bold text-amber-400" aria-label={`${stats.charactersSanitized} characters sanitized`}>
            {stats.charactersSanitized}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Chars Redacted</div>
        </div>
      </div>

      {/* Confidence breakdown */}
      {stats.formatMatchCount > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-amber-900/15 border border-amber-800/30 text-xs text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {stats.formatMatchCount} format-match-only{' '}
            {stats.formatMatchCount === 1 ? 'detection' : 'detections'} (checksum unconfirmed)
          </span>
        </div>
      )}

      {/* Per-category breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const count = stats.byCategory[cat];
          if (count === 0) return null;
          return (
            <div
              key={cat}
              className={`rounded-lg border p-2.5 ${CATEGORY_COLORS[cat]}`}
              aria-label={`${count} ${CATEGORY_META[cat].label} detected`}
            >
              <div className="text-lg font-bold">{count}</div>
              <div className="text-[10px] opacity-80">{CATEGORY_META[cat].label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
