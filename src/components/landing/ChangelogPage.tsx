import React from 'react';

const GITHUB_REPO = 'https://github.com/christliebdela/leeflet';
const GITHUB_RELEASES = 'https://github.com/christliebdela/leeflet/releases';

export const ChangelogPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-[#08090a] text-[#ededef] font-sans antialiased selection:bg-white/20 selection:text-white">
      {/* ── Background Subtle Glow ── */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.035) 0%, transparent 40%), radial-gradient(circle at 85% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 45%)',
        }}
      />

      {/* ── Fixed Top Navigation Bar ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#08090a]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand - uses the app's signature font-brand font */}
          <a href="/" className="flex items-center gap-2.5 group no-underline text-inherit">
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
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-md hover:bg-white/[0.04]"
              >
                Home
              </a>
              <a
                href="/#byod"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-md hover:bg-white/[0.04]"
              >
                BYOD Flow
              </a>
              <a
                href="/#faq"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-md hover:bg-white/[0.04]"
              >
                FAQ
              </a>
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-md hover:bg-white/[0.04] inline-flex items-center gap-1"
              >
                <span>GitHub</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </nav>

            <a
              href="/#download"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#ededef] text-[#08090a] hover:bg-white rounded-md transition-colors shadow-sm"
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
          {/* Release v0.2.0 */}
          <article className="relative">
            {/* Timeline Dot */}
            <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-[#08090a]" />

            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="font-mono text-sm font-semibold text-[#ededef] px-2.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1]">
                v0.2.0
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Latest Release
              </span>
              <span className="text-xs font-mono text-[#71717a]">
                September 2026
              </span>
            </div>

            <h2 className="text-xl font-semibold text-[#ededef] tracking-tight mt-3 mb-4">
              Auto-updater, Dynamic Stat Badges & Streamlined Metric Ribbons
            </h2>

            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-4">
              <ul className="space-y-3 text-sm text-[#8a8f98]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Auto-updater & In-App Alerts:</strong> Seamless one-click background updates directly inside Leeflet with GitHub signed releases.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Dynamic Stat Badge Animations:</strong> Smooth, responsive header metrics that adjust seamlessly to search and filter states.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Sleek Backlog Metrics Strip:</strong> Streamlined dashboard filter ribbon above backlog task items.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Role-Based Access Control:</strong> Enhanced security gates and permission models for team workspaces.
                  </span>
                </li>
              </ul>

              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-4">
                <a
                  href={`${GITHUB_RELEASES}/tag/v0.2.0`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8a8f98] hover:text-[#ededef] transition-colors"
                >
                  <span>View release on GitHub</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </article>

          {/* Release v0.1.0 */}
          <article className="relative">
            {/* Timeline Dot */}
            <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3 h-3 rounded-full bg-white/30 ring-4 ring-[#08090a]" />

            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="font-mono text-sm font-semibold text-[#ededef] px-2.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]">
                v0.1.0
              </span>
              <span className="text-xs font-mono text-[#71717a]">
                August 2026
              </span>
            </div>

            <h2 className="text-xl font-semibold text-[#ededef] tracking-tight mt-3 mb-4">
              Initial Public Launch & Core Architecture
            </h2>

            <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-4">
              <ul className="space-y-3 text-sm text-[#8a8f98]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Global Quick Capture:</strong> System-wide <kbd className="font-mono text-xs bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">Ctrl+Shift+Space</kbd> floating capture bar that saves without context switching.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Personal Focus Queue:</strong> Drag-and-drop queue for laser-focused execution of one task at a time.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Local-First SQLite Engine:</strong> Native desktop persistence with sub-100ms startup and offline support.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Bring Your Own Database (BYOD):</strong> Optional real-time cloud synchronization using personal Supabase instances.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#a1a1aa] mt-1 shrink-0">•</span>
                  <span>
                    <strong className="text-[#ededef] font-medium">Detachable Desktop Widgets:</strong> Transparent floating sticky notes and always-on-top companion widgets.
                  </span>
                </li>
              </ul>

              <div className="pt-4 border-t border-white/[0.06] flex items-center gap-4">
                <a
                  href={`${GITHUB_RELEASES}/tag/v0.1.0`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8a8f98] hover:text-[#ededef] transition-colors"
                >
                  <span>View release on GitHub</span>
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

      {/* ── Minimal Footer ── */}
      <footer className="border-t border-white/[0.06] py-10 px-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52525b]">
        <div className="flex items-center gap-2">
          <img src="/logo_alpha.png" alt="Leeflet" className="w-4 h-4 rounded opacity-75" />
          <span className="font-brand text-base text-[#8a8f98]">leeflet</span>
          <span>· Free & open source under MIT · Built by <a href="https://christliebdela.vercel.app/" target="_blank" rel="noreferrer" className="text-[#8a8f98] hover:text-white transition-colors">Christlieb Dela</a></span>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="/"
            className="text-[#8a8f98] hover:text-white transition-colors"
          >
            Home
          </a>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="text-[#8a8f98] hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href={GITHUB_RELEASES}
            target="_blank"
            rel="noreferrer"
            className="text-[#8a8f98] hover:text-white transition-colors"
          >
            Releases
          </a>
        </div>
      </footer>
    </div>
  );
};
