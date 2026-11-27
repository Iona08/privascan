import type { PIICategory, CategoryFilterMap } from '../types/pii';
import { ALL_CATEGORIES, CATEGORY_META } from '../types/pii';

interface CategoryFiltersProps {
  enabledCategories: CategoryFilterMap;
  onChange: (categories: CategoryFilterMap) => void;
  counts: Partial<Record<PIICategory, number>>;
}

const CATEGORY_COLORS: Record<PIICategory, string> = {
  email: 'text-amber-400 border-amber-500/50 bg-amber-900/20',
  phone: 'text-green-400 border-green-500/50 bg-green-900/20',
  ip: 'text-blue-400 border-blue-500/50 bg-blue-900/20',
  pan: 'text-purple-400 border-purple-500/50 bg-purple-900/20',
  aadhaar: 'text-cyan-400 border-cyan-500/50 bg-cyan-900/20',
  credit_card: 'text-red-400 border-red-500/50 bg-red-900/20',
};

export function CategoryFilters({ enabledCategories, onChange, counts }: CategoryFiltersProps) {
  const toggle = (cat: PIICategory) => {
    onChange({ ...enabledCategories, [cat]: !enabledCategories[cat] });
  };

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Category Filters
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label="PII category filters">
        {ALL_CATEGORIES.map((cat) => {
          const enabled = enabledCategories[cat];
          const count = counts[cat] ?? 0;
          const colors = CATEGORY_COLORS[cat];
          return (
            <label
              key={cat}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all focus-within:ring-2 focus-within:ring-cyan-400/50 ${
                enabled ? colors : 'text-slate-600 border-slate-700/50 bg-slate-800/30'
              }`}
              title={CATEGORY_META[cat].description}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggle(cat)}
                className="sr-only"
                aria-label={`${enabled ? 'Disable' : 'Enable'} ${CATEGORY_META[cat].label} detection`}
              />
              <span>{CATEGORY_META[cat].shortLabel}</span>
              {count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full text-[10px] font-bold ${
                    enabled ? 'bg-current/20' : 'bg-slate-700'
                  }`}
                  aria-label={`${count} detected`}
                >
                  {count}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
