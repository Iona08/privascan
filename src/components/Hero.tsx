import { ChevronDown, Shield, Zap } from 'lucide-react';

interface HeroProps {
  onLoadSample: () => void;
  onStartSanitizing: () => void;
}

export function Hero({ onLoadSample, onStartSanitizing }: HeroProps) {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 px-4"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-cyan-950/50 border border-cyan-800/50 text-cyan-400 text-xs font-semibold rounded-full px-4 py-1.5">
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          100% Client-Side Processing — Your Data Never Leaves Your Browser
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 leading-tight tracking-tight"
        >
          Your Data.{' '}
          <span className="text-cyan-400">Your Privacy.</span>
          <br />
          Your Control.
        </h1>

        {/* Subheading */}
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          Detect, classify, and sanitize sensitive information instantly — without sending your data anywhere.
          Emails, phones, IPs, PAN, Aadhaar, and credit cards — all processed locally.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={onStartSanitizing}
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg px-6 py-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2 @motion-reduce:transition-none"
            aria-label="Scroll to editor and start sanitizing"
          >
            <Zap className="w-4 h-4" aria-hidden="true" />
            Start Sanitizing
          </button>
          <button
            onClick={onLoadSample}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-100 font-semibold rounded-lg px-6 py-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2"
            aria-label="Load sample PII data into editor (Alt+S)"
            title="Keyboard shortcut: Alt+S"
          >
            Load Sample Data
          </button>
        </div>

        {/* Scroll indicator */}
        <ChevronDown
          className="w-5 h-5 text-slate-600 mt-4 animate-bounce"
          aria-hidden="true"
          style={{ animationDuration: '2s' }}
        />
      </div>
    </section>
  );
}
