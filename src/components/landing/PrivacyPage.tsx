import React, { useState, useEffect } from 'react';
import { AuroraBackground } from '../ui/aurora-background';

const GITHUB_REPO = 'https://github.com/christliebdela/leeflet';
const GITHUB_RELEASES = 'https://github.com/christliebdela/leeflet/releases';

export const PrivacyPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

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
      {/* ── Top Navigation Bar ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-white/[0.08] bg-[#08090a]/75 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'border-b border-transparent bg-transparent shadow-none'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
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

          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <nav className="hidden md:flex items-center gap-1 text-[#8a8f98]">
              <a href="/" className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]">
                Home
              </a>
              <a href="/#byod" className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]">
                Features
              </a>
              <a href="/#pricing" className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]">
                Pricing
              </a>
              <a href="/#faq" className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]">
                FAQ
              </a>
              <a href="/docs" className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]">
                Docs
              </a>
              <a href="/changelog" className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]">
                Changelog
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
              href="/#download"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-[#ededef] hover:text-white border border-white/[0.12] hover:border-white/[0.22] backdrop-blur-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Legal Content ── */}
      <main className="relative z-10 pt-28 sm:pt-36 pb-24 px-6 max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
            Legal & Data Sovereignty
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#ededef]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
            Last updated: September 2026. Leeflet is designed from first principles around local data ownership and complete privacy.
          </p>
        </div>

        <div className="space-y-8 text-sm text-[#8a8f98] leading-relaxed">
          {/* Section 1 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">1. Zero Telemetry & Zero Tracking</h2>
            <p>
              Leeflet does not collect, record, track, transmit, or sell any personal data, usage analytics, behavior metrics, or diagnostic telemetry. We do not use third-party tracking scripts, advertising trackers, or tracking cookies.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">2. Local-First SQLite Persistence</h2>
            <p>
              All issues, backlog states, queues, custom labels, and user notes are stored strictly in an embedded SQLite database file located on your local disk filesystem.
            </p>
            <p>
              Your data never touches remote servers unless you explicitly configure a Bring Your Own Database (BYOD) cloud synchronization provider.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">3. Bring Your Own Database (BYOD) Synchronization</h2>
            <p>
              If you enable team or multi-device cloud synchronization, Leeflet connects directly from your local machine to your private Supabase project via secure HTTPS and WebSockets (WSS).
            </p>
            <p>
              There are no Leeflet-hosted intermediary proxies or cloud relays. Your database credentials (URL and API Key) are stored locally in your encrypted application configuration and are never transmitted to the creators of Leeflet.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">4. Software Updates</h2>
            <p>
              When checking for updates, the desktop app makes a direct, anonymous HTTP request to the public GitHub Releases API to compare semantic version tags. No identifying hardware IDs or system fingerprints are transmitted.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">5. Full Open Source Transparency</h2>
            <p>
              Leeflet is licensed under the permissive MIT License. You can independently verify and audit our entire source code, build pipelines, and network requests on{' '}
              <a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="text-[#ededef] hover:underline">
                GitHub
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* ── Multi-Column Structured Footer ── */}
      <footer className="border-t border-white/[0.06] pt-16 pb-12 px-6 max-w-6xl mx-auto text-xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <img src="/logo_alpha.png" alt="Leeflet" className="w-5 h-5 rounded opacity-90" />
              <span className="font-brand text-2xl text-[#ededef]">leeflet</span>
            </div>
            <p className="text-xs text-[#71717a] leading-relaxed max-w-sm">
              Free, local-first project &amp; task tracker and keyboard-driven desktop workspace for solo developers and engineering teams.
            </p>
            <div className="text-[11px] font-mono text-[#52525b]">
              MIT Licensed · Zero Telemetry
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium">Product</div>
            <ul className="space-y-2 text-[#8a8f98]">
              <li><a href="/#byod" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/#manifesto" className="hover:text-white transition-colors">Manifesto</a></li>
              <li><a href="/#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/docs" className="hover:text-white transition-colors">Docs</a></li>
              <li><a href="/changelog" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium">Community</div>
            <ul className="space-y-2 text-[#8a8f98]">
              <li><a href={GITHUB_REPO} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
              <li><a href={`${GITHUB_REPO}/issues`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Issues</a></li>
              <li><a href={GITHUB_RELEASES} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Releases</a></li>
              <li><a href={`${GITHUB_REPO}/discussions`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Discussions</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium">Legal & Trust</div>
            <ul className="space-y-2 text-[#8a8f98]">
              <li><a href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">MIT License</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors text-[#ededef]">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="https://christliebdela.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Author</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52525b]">
          <div>
            © {new Date().getFullYear()} Leeflet. Built by{' '}
            <a href="https://christliebdela.vercel.app/" target="_blank" rel="noreferrer" className="text-[#8a8f98] hover:text-white transition-colors">
              Christlieb Dela
            </a>.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-[#71717a]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </AuroraBackground>
  );
};
