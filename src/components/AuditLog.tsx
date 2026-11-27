import React from 'react';
import type { AuditLogEntry } from '../types/pii';
import { CATEGORY_META } from '../types/pii';
import { Clock, Trash2, ClipboardList } from 'lucide-react';

interface AuditLogProps {
  entries: AuditLogEntry[];
  onClear: () => void;
}

const EVENT_TYPE_LABEL: Record<AuditLogEntry['eventType'], string> = {
  sanitize: 'Sanitized',
  export: 'Exported',
  reset: 'Reset',
  clear: 'Cleared',
};

const EVENT_TYPE_COLOR: Record<AuditLogEntry['eventType'], string> = {
  sanitize: 'text-cyan-400',
  export: 'text-green-400',
  reset: 'text-amber-400',
  clear: 'text-red-400',
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function AuditLog({ entries, onClear }: AuditLogProps) {
  if (entries.length === 0) {
    return (
      <section aria-labelledby="audit-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="audit-heading" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Audit Log
          </h2>
        </div>
        <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 p-6 text-center">
          <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" aria-hidden="true" />
          <p className="text-slate-500 text-sm">No events recorded yet</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="audit-heading" aria-live="polite" aria-relevant="additions">
      <div className="flex items-center justify-between mb-3">
        <h2 id="audit-heading" className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Audit Log
          <span className="ml-2 text-slate-500 font-normal normal-case tracking-normal">
            ({entries.length})
          </span>
        </h2>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded px-1"
          aria-label="Clear audit log history"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          Clear history
        </button>
      </div>

      <div className="rounded-xl border border-slate-700/40 bg-slate-800/20 overflow-hidden max-h-80 overflow-y-auto">
        <table className="w-full text-xs" aria-label="Audit log entries">
          <thead>
            <tr className="border-b border-slate-700/40 bg-slate-800/40">
              <th className="text-left px-3 py-2 text-slate-400 font-medium" scope="col">Time</th>
              <th className="text-left px-3 py-2 text-slate-400 font-medium" scope="col">Event</th>
              <th className="text-left px-3 py-2 text-slate-400 font-medium hidden sm:table-cell" scope="col">Source</th>
              <th className="text-left px-3 py-2 text-slate-400 font-medium hidden sm:table-cell" scope="col">Mode</th>
              <th className="text-right px-3 py-2 text-slate-400 font-medium" scope="col">Entities</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b border-slate-800/40 ${i === 0 ? 'bg-slate-700/10' : ''} hover:bg-slate-800/30 transition-colors`}
              >
                <td className="px-3 py-2 text-slate-500 font-mono whitespace-nowrap">
                  <Clock className="w-3 h-3 inline mr-1 opacity-50" aria-hidden="true" />
                  {formatTimestamp(entry.timestamp)}
                </td>
                <td className={`px-3 py-2 font-semibold ${EVENT_TYPE_COLOR[entry.eventType]}`}>
                  {EVENT_TYPE_LABEL[entry.eventType]}
                </td>
                <td className="px-3 py-2 text-slate-400 max-w-[120px] truncate hidden sm:table-cell" title={entry.source}>
                  {entry.source}
                </td>
                <td className="px-3 py-2 text-slate-400 capitalize hidden sm:table-cell">
                  {entry.redactionMode}
                </td>
                <td className="px-3 py-2 text-right text-slate-300 font-medium">
                  {entry.totalEntities}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
