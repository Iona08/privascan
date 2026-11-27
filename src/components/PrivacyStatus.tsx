import { ShieldCheck, Lock, Database, Wifi, Eye, Server } from 'lucide-react';

const checks = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-green-400" aria-hidden="true" />,
    title: 'Zero Network Requests',
    desc: 'No fetch, XHR, WebSocket, or analytics. No external CDNs, fonts, or tracking. Verified by CSP in production.',
    status: 'safe',
  },
  {
    icon: <Lock className="w-5 h-5 text-green-400" aria-hidden="true" />,
    title: 'No Persistent Storage',
    desc: 'No localStorage, sessionStorage, IndexedDB, or cookies. Audit log is counts-only, in memory, cleared on page reload.',
    status: 'safe',
  },
  {
    icon: <Database className="w-5 h-5 text-green-400" aria-hidden="true" />,
    title: 'No Cloud Storage',
    desc: 'Your document is never uploaded anywhere. Sanitization happens entirely in JavaScript running locally in your tab.',
    status: 'safe',
  },
  {
    icon: <Eye className="w-5 h-5 text-green-400" aria-hidden="true" />,
    title: 'No Content in Console',
    desc: 'No document content, detected values, or pseudonym mappings are written to the browser console.',
    status: 'safe',
  },
  {
    icon: <Server className="w-5 h-5 text-green-400" aria-hidden="true" />,
    title: 'Offline Capable',
    desc: 'After the page loads once, PRIVAScan works with no network connection. All assets are bundled locally.',
    status: 'safe',
  },
  {
    icon: <Wifi className="w-5 h-5 text-amber-400" aria-hidden="true" />,
    title: 'Rule-Based Detection',
    desc: 'Detection is deterministic regex + validation (Luhn, Verhoeff, PAN type codes, IP parsing) — no AI/LLM API calls.',
    status: 'info',
  },
];

export function PrivacyStatus() {
  return (
    <section
      id="privacy-status"
      aria-labelledby="privacy-heading"
      className="py-20 px-4 bg-slate-900/30"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center mb-10 gap-3">
          <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-800/50 text-green-400 text-xs font-semibold rounded-full px-4 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Privacy Audit Passed
          </div>
          <h2 id="privacy-heading" className="text-2xl sm:text-3xl font-bold text-slate-100 text-center">
            Privacy Status
          </h2>
          <p className="text-slate-400 text-sm max-w-xl text-center">
            Truthful, verifiable claims about what PRIVAScan does and does not do with your data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((check) => (
            <div
              key={check.title}
              className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                {check.icon}
                <h3 className="font-semibold text-slate-100 text-sm">{check.title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{check.desc}</p>
              <div
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  check.status === 'safe' ? 'text-green-500' : 'text-amber-500'
                }`}
              >
                {check.status === 'safe' ? '✓ Verified' : 'ℹ Info'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
