import React from 'react';
import { Shield, Github } from 'lucide-react';
import { ALL_CATEGORIES, CATEGORY_META } from '../types/pii';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-900/30 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-cyan-400" aria-hidden="true" />
              <span className="font-bold text-slate-100 tracking-tight">PRIVAScan</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              100% client-side PII sanitization. Your data never leaves your browser.
            </p>
          </div>

          {/* Supported Categories */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-3">
              Supported PII
            </h3>
            <ul className="space-y-1">
              {ALL_CATEGORIES.map((cat) => (
                <li key={cat} className="text-xs text-slate-400">
                  {CATEGORY_META[cat].label}
                </li>
              ))}
            </ul>
          </div>

          {/* Tech + Disclaimer */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-3">
              Tech Stack
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              React 19 · Vite · TypeScript · Tailwind CSS · Vitest
            </p>
            <div className="flex items-center gap-2 text-slate-500">
              <Github className="w-4 h-4" aria-hidden="true" />
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:text-cyan-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <p className="text-xs text-slate-500 text-center leading-relaxed max-w-3xl mx-auto">
            <strong className="text-slate-400">Disclaimer:</strong> Detection is rule-based and not
            100% accurate — false positives and negatives will occur. Always review output before
            sharing. PRIVAScan does not detect names, addresses, or all locale-specific identifiers.
            This tool is not legal or compliance advice. Use it as one layer in a broader privacy
            workflow.
          </p>
        </div>
      </div>
    </footer>
  );
}
