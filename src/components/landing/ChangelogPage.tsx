import React, { useState, useEffect } from 'react';
import { AuroraBackground } from '../ui/aurora-background';
import {
  useReleaseDownload,
  OSIcon,
  GITHUB_REPO,
  GITHUB_RELEASES,
} from '../../utils/releaseDownload';

export const ChangelogPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { os, downloadUrl } = useReleaseDownload();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AuroraBackground>
      {/* ── Fixed Top Navigation Bar (Seamless at top, frosted glass on scroll) ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-white/[0.08] bg-[#08090a]/75 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'border-b border-transparent bg-transparent shadow-none'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand - uses the app's signature font-brand font */}
          <a href="/" className="flex items-center gap-2.5 group no-underline text-inherit cursor-pointer">
            <img
              src="/logo_alpha.png"
              alt="Leeflet"
              className="w-5 h-5 rounded object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-brand text-2xl font-normal tracking-tight text-[#ededef]">
              leeflet
            </span>
          </a>

          {/* Header Links on the Far Right */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <nav className="hidden md:flex items-center gap-1 text-[#8a8f98]">
              <a
                href="/"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Home
              </a>
              <a
                href="/#byod"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Features
              </a>
              <a
                href="/#pricing"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Pricing
              </a>
              <a
                href="/#faq"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                FAQ
              </a>
              <a
                href="/docs"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Docs
              </a>
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04] inline-flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-75">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </a>
            </nav>

            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-[#ededef] hover:text-white border border-white/[0.12] hover:border-white/[0.22] backdrop-blur-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <OSIcon os={os} className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content Container with top padding for fixed header ── */}
      <main className="relative z-10 pt-28 pb-20 px-6 max-w-4xl mx-auto">
        {/* Left-Aligned Header */}
        <div className="mb-14">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98] mb-3">
            Changelog
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#ededef]">
            Product updates & releases.
          </h1>
          <p className="mt-4 text-base text-[#8a8f98] leading-relaxed max-w-xl">
            Every release is built in public, signed, and published directly to GitHub.
          </p>
        </div>

        {/* Release Timeline */}
        <div className="space-y-12 border-l border-white/[0.08] pl-6 sm:pl-8 ml-2">
          {/* Release v0.1.0 - Initial Launch */}
          <article className="relative">
            {/* Timeline Dot */}
            <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-[#08090a]" />

            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="font-mono text-xs font-semibold text-[#ededef] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1]">
                v0.1.0
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Initial Public Launch · Today
              </span>
              <span className="text-xs font-mono text-[#71717a]">
                September 1, 2026
              </span>
            </div>

            <h2 className="text-xl font-semibold text-[#ededef] tracking-tight mt-3 mb-4">
              Inaugural Release — Local-First Workspace, Global Quick Capture & BYOD Supabase Sync
            </h2>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4 hover:border-white/[0.14] transition-colors">
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Welcome to the very first public release of <strong className="text-white font-medium">Leeflet</strong>. Designed from the ground up for developers who demand keyboard velocity, data sovereignty, and zero cloud lock-in.
              </p>

              <ul className="space-y-3 text-sm text-[#8a8f98]">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Local-First SQLite Core:</strong> Sub-100ms startup times, zero network dependency, and 100% offline data persistence stored directly on your SSD.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Global Quick Capture (<kbd className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">Alt+L</kbd>):</strong> Native system-wide floating capture bar that saves tasks instantly without context switching out of your IDE or browser.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Personal Focus Queue:</strong> Drag-and-drop execution queue designed for deep work and tackling high-priority items one by one.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Bring Your Own Database (BYOD) Sync:</strong> Connect your personal Supabase project in 60 seconds for secure, encrypted real-time cloud backup and multi-device sync with zero intermediary servers.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Detachable Companion Widgets:</strong> Float your active queue or detach task items as always-on-top transparent sticky notes.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">16 OLED & Modern Dark Themes:</strong> Tailored palettes including Noir, Charcoal, Tokyo Night, Catppuccin, Gruvbox, and Monokai.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Auto-Updater Integration:</strong> Built-in GitHub releases verification with automatic in-app upgrade alerts.
                  </span>
                </li>
              </ul>

              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-4">
                <a
                  href={GITHUB_RELEASES}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8a8f98] hover:text-[#ededef] transition-colors"
                >
                  <span>View releases on GitHub</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* ── Multi-Column Structured Footer ── */}
      <footer className="border-t border-white/[0.06] pt-16 pb-12 px-6 max-w-6xl mx-auto text-xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          <div className="col-span-2 space-y-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 group cursor-pointer text-left focus:outline-hidden transition-transform active:scale-[0.98]"
              title="Scroll to top"
            >
              <img src="/logo_alpha.png" alt="Leeflet" className="w-5 h-5 rounded opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="font-brand text-2xl text-[#ededef] group-hover:text-white transition-colors">leeflet</span>
            </button>
            <p className="text-xs text-[#71717a] leading-relaxed max-w-sm">
              Free, local-first project &amp; task tracker and keyboard-driven desktop workspace for solo developers and engineering teams.
            </p>
            <div className="text-[11px] font-mono text-[#52525b]">
              MIT Licensed · Zero Telemetry
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium">Product</div>
            <ul className="space-y-2 text-[#8a8f98]">
              <li>
                <a href="/#byod" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/#manifesto" className="hover:text-white transition-colors">
                  Manifesto
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/docs" className="hover:text-white transition-colors">
                  Docs
                </a>
              </li>
              <li>
                <a href="/changelog" className="hover:text-white transition-colors">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Community */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium">Community</div>
            <ul className="space-y-2 text-[#8a8f98]">
              <li>
                <a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href={`${GITHUB_REPO}/issues`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Issues
                </a>
              </li>
              <li>
                <a href={GITHUB_RELEASES} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Releases
                </a>
              </li>
              <li>
                <a href={`${GITHUB_REPO}/discussions`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Discussions
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Trust */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium">Legal & Trust</div>
            <ul className="space-y-2 text-[#8a8f98]">
              <li>
                <a href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  MIT License
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="https://christliebdela.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Author
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52525b]">
          <div>
            © {new Date().getFullYear()} Leeflet. Built by{' '}
            <a href="https://christliebdela.vercel.app/" target="_blank" rel="noreferrer" className="text-[#8a8f98] hover:text-white transition-colors">
              Christlieb Dela
            </a>.
          </div>
        </div>
      </footer>
    </AuroraBackground>
  );
};
