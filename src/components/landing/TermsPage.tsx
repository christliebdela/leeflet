import React, { useState, useEffect } from 'react';
import { LandingBackground, BackgroundToggle } from './LandingBackground';
import {
  useReleaseDownload,
  OSIcon,
  GITHUB_REPO,
  GITHUB_RELEASES,
} from '../../utils/releaseDownload';

export const TermsPage: React.FC = () => {
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
    <LandingBackground>
      {/* ── Top Navigation Bar ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-white/[0.08] bg-[#08090a]/75 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'border-b border-transparent bg-transparent shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group no-underline text-inherit cursor-pointer">
            <img
              src="/logo_alpha.png"
              alt="Leeflet"
              className="w-7 h-7 rounded object-contain opacity-90 group-hover:opacity-100 transition-opacity"
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
              {/* <a href="/changelog" className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]">
                Changelog
              </a> */}
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

            <BackgroundToggle />

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

      {/* ── Main Legal Content ── */}
      <main className="relative z-10 pt-28 sm:pt-36 pb-24 px-6 max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
            Legal & Licensing
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-[#ededef]">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
            Last updated: September 2026. Leeflet is distributed as free, open source software under the standard MIT License.
          </p>
        </div>

        <div className="space-y-8 text-sm text-[#8a8f98] leading-relaxed">
          {/* Section 1 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">1. Permissive MIT License Grant</h2>
            <p>
              Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">2. Software Provided &quot;As Is&quot;</h2>
            <p>
              The Software is provided &quot;as is&quot;, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">3. Limitation of Liability</h2>
            <p>
              In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the Software or the use or other dealings in the Software.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">4. User Responsibility & BYOD Cloud Infrastructure</h2>
            <p>
              When utilizing Bring Your Own Database (BYOD) cloud synchronization, you are exclusively responsible for managing, securing, and maintaining your third-party Supabase account, database backups, connection credentials, and PostgreSQL security policies.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
            <h2 className="text-base font-semibold text-[#ededef]">5. Contributions & Modifications</h2>
            <p>
              All contributions made to the official Leeflet GitHub repository are accepted under the terms of the project&apos;s MIT License. You retain copyright to your original contributions while granting the public the permissions provided under the license.
            </p>
          </section>
        </div>
      </main>

      {/* ── Multi-Column Structured Footer ── */}
      <footer className="border-t border-white/[0.06] pt-16 pb-12 px-6 max-w-7xl mx-auto text-xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          <div className="col-span-2 space-y-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-hidden transition-transform active:scale-[0.98]"
              title="Scroll to top"
            >
              <img src="/logo_alpha.png" alt="Leeflet" className="w-7 h-7 rounded object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="font-brand text-2xl text-[#ededef] group-hover:text-white transition-colors">leeflet</span>
            </button>
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
              {/* <li><a href="/changelog" className="hover:text-white transition-colors">Changelog</a></li> */}
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
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors text-[#ededef]">Terms of Service</a></li>
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
        </div>
      </footer>
    </LandingBackground>
  );
};
