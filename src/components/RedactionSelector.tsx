import React from 'react';
import type { RedactionMode } from '../types/pii';
import { EyeOff, Hash, User } from 'lucide-react';

interface RedactionSelectorProps {
  mode: RedactionMode;
  onChange: (mode: RedactionMode) => void;
}

const MODES: Array<{
  id: RedactionMode;
  label: string;
  short: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'full',
    label: 'Full Mask',
    short: 'Full',
    desc: 'Replaces entire PII with [REDACTED] or custom label',
    icon: <EyeOff className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'partial',
    label: 'Partial Mask',
    short: 'Partial',
    desc: 'Format-preserving — keeps last digits, first char, etc.',
    icon: <Hash className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'pseudonym',
    label: 'Pseudonymize',
    short: 'Pseudo',
    desc: 'Consistent placeholders (USER_01, PHONE_01) per value',
    icon: <User className="w-4 h-4" aria-hidden="true" />,
  },
];

export function RedactionSelector({ mode, onChange }: RedactionSelectorProps) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Redaction Mode
      </legend>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Redaction mode">
        {MODES.map((m) => {
          const isSelected = mode === m.id;
          return (
            <label
              key={m.id}
              className={`relative flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer transition-all focus-within:ring-2 focus-within:ring-cyan-400/50 ${
                isSelected
                  ? 'border-cyan-500/80 bg-cyan-900/20 text-cyan-300'
                  : 'border-slate-700/60 bg-slate-800/30 text-slate-400 hover:border-slate-600'
              }`}
              title={m.desc}
            >
              <input
                type="radio"
                name="redaction-mode"
                value={m.id}
                checked={isSelected}
                onChange={() => onChange(m.id)}
                className="sr-only"
                aria-label={`${m.label}: ${m.desc}`}
              />
              <div className={`flex items-center gap-1.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`}>
                {m.icon}
                <span className="text-xs font-semibold">{m.label}</span>
              </div>
              <span className="text-[10px] leading-relaxed text-slate-500 hidden sm:block">{m.desc}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
