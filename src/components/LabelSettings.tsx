import React from 'react';
import type { RedactionSettings, PIICategory } from '../types/pii';
import { ALL_CATEGORIES, CATEGORY_META } from '../types/pii';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface LabelSettingsProps {
  settings: Pick<RedactionSettings, 'fullMaskLabel' | 'useCategoryLabels' | 'categoryLabels'>;
  onFullLabelChange: (label: string) => void;
  onUseCategoryLabelsChange: (use: boolean) => void;
  onCategoryLabelChange: (category: PIICategory, label: string) => void;
}

export function LabelSettings({
  settings,
  onFullLabelChange,
  onUseCategoryLabelsChange,
  onCategoryLabelChange,
}: LabelSettingsProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-800/20">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded-xl"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="label-settings-panel"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Settings className="w-4 h-4 text-slate-500" aria-hidden="true" />
          Mask Label Settings
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div id="label-settings-panel" className="px-4 pb-4 flex flex-col gap-4">
          {/* Global label */}
          <div>
            <label htmlFor="global-mask-label" className="block text-xs font-medium text-slate-400 mb-1">
              Global mask label
            </label>
            <input
              id="global-mask-label"
              type="text"
              value={settings.fullMaskLabel}
              onChange={(e) => onFullLabelChange(e.target.value)}
              placeholder="[REDACTED]"
              className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
              aria-describedby="global-label-hint"
            />
            <p id="global-label-hint" className="text-xs text-slate-500 mt-1">
              Must not be empty. Falls back to [REDACTED] if blank.
            </p>
          </div>

          {/* Per-category labels toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.useCategoryLabels}
              onChange={(e) => onUseCategoryLabelsChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/40 focus:ring-2"
              aria-label="Use per-category labels instead of global label"
            />
            <span className="text-xs text-slate-300">Use per-category labels</span>
          </label>

          {/* Per-category label inputs */}
          {settings.useCategoryLabels && (
            <div className="grid grid-cols-2 gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <label
                    htmlFor={`cat-label-${cat}`}
                    className="block text-xs text-slate-500 mb-1"
                  >
                    {CATEGORY_META[cat].shortLabel}
                  </label>
                  <input
                    id={`cat-label-${cat}`}
                    type="text"
                    value={settings.categoryLabels[cat]}
                    onChange={(e) => onCategoryLabelChange(cat, e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
                    aria-label={`Label for ${CATEGORY_META[cat].label}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
