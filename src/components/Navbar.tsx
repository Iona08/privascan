import React, { useEffect, useRef } from 'react';
import { Shield, Menu, X } from 'lucide-react';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setMenuOpen((v) => !v);
    onMenuToggle?.();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const navLinks = [
    { href: '#workspace', label: 'Dashboard' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#privacy-status', label: 'Privacy Status' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800/60">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 bg-cyan-500 text-slate-900 font-semibold px-3 py-1 rounded text-sm"
      >
        Skip to content
      </a>
      <nav
        className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        <a
          href="#"
          className="flex items-center gap-2 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded"
          aria-label="PRIVAScan home"
        >
          <Shield
            className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors"
            aria-hidden="true"
          />
          <span className="font-bold text-slate-100 tracking-tight text-lg">
            PRIVA<span className="text-cyan-400">Scan</span>
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded px-1"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-900/40 text-green-400 border border-green-800/60 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
              Client-Side Only
            </span>
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-slate-400 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded transition-colors"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          id="mobile-menu"
          className="md:hidden border-t border-slate-800/60 bg-[#070B14]/95"
        >
          <ul className="px-4 py-3 flex flex-col gap-3" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block text-sm text-slate-300 hover:text-cyan-400 transition-colors py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded px-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
