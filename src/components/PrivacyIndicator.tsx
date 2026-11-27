import { ShieldCheck } from 'lucide-react';

interface PrivacyIndicatorProps {
  compact?: boolean;
}

export function PrivacyIndicator({ compact = false }: PrivacyIndicatorProps) {
  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400"
        title="All processing happens locally in your browser. No data is sent anywhere."
      >
        <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
        Client-Side Only
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 bg-green-900/30 border border-green-800/50 text-green-400 text-xs font-semibold rounded-full px-4 py-2"
      role="status"
      aria-label="Privacy guarantee: 100% client-side processing. Your data never leaves your browser."
    >
      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
      100% Client-Side Processing — Your Data Never Leaves Your Browser
    </div>
  );
}
