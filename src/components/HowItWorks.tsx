import { ShieldCheck, Zap, Eye, Download } from 'lucide-react';

const steps = [
  {
    icon: <Zap className="w-6 h-6 text-cyan-400" aria-hidden="true" />,
    title: 'Paste or Upload',
    desc: 'Drop your text, .txt, or .csv file into the editor. All processing happens right here — no uploads, no servers.',
  },
  {
    icon: <Eye className="w-6 h-6 text-purple-400" aria-hidden="true" />,
    title: 'Auto-Detect PII',
    desc: 'Six PII categories are detected using deterministic rule-based engines — emails, phones, IPs, PAN, Aadhaar (Verhoeff), and cards (Luhn). Results appear instantly.',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-green-400" aria-hidden="true" />,
    title: 'Choose Redaction Mode',
    desc: 'Full mask, partial mask (format-preserving), or consistent pseudonymization. Switch modes instantly and preview in a live side-by-side diff view.',
  },
  {
    icon: <Download className="w-6 h-6 text-amber-400" aria-hidden="true" />,
    title: 'Download Sanitized Output',
    desc: 'Download sanitized .txt or .csv files. Sanitized content only — the original and pseudonym mappings never leave the browser.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="py-20 px-4"
    >
      <div className="max-w-5xl mx-auto">
        <h2
          id="how-heading"
          className="text-2xl sm:text-3xl font-bold text-center text-slate-100 mb-3"
        >
          How It Works
        </h2>
        <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto text-sm sm:text-base">
          Everything runs in your browser. No data leaves your device at any point.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 flex flex-col gap-3 hover:border-slate-600/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900/80 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <span className="text-xs font-mono text-slate-500 select-none">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">{step.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
