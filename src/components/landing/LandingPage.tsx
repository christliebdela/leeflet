import React, { useState } from 'react';
import { WobbleCard } from '../ui/wobble-card';

const GITHUB_REPO = 'https://github.com/christliebdela/leeflet';
const GITHUB_RELEASES = 'https://github.com/christliebdela/leeflet/releases';

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full py-4 text-left flex items-center justify-between gap-4 group cursor-pointer"
      >
        <span className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">
          {question}
        </span>
        <span className="text-[#71717a] group-hover:text-[#a1a1aa] transition-transform duration-200 shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open ? 'max-h-60 pb-4 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-xs sm:text-sm text-[#8a8f98] leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const scrollTo = (id: string) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
          {/* Brand - Uses the app's signature font-brand font, scrolls to hero */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('hero');
            }}
            className="flex items-center gap-2.5 group no-underline text-inherit cursor-pointer"
          >
            <img
              src="/logo_alpha.png"
              alt="Leeflet"
              className="w-5 h-5 rounded object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-brand text-2xl font-normal tracking-tight text-[#ededef]">
              leeflet
            </span>
          </a>

          {/* Header links grouped together on the far right - focused on downloads */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <nav className="hidden md:flex items-center gap-1 text-[#8a8f98]">
              <a
                href="#byod"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('byod');
                }}
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-md hover:bg-white/[0.04] cursor-pointer"
              >
                Features
              </a>
              <a
                href="/changelog"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-md hover:bg-white/[0.04]"
              >
                Changelog
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('faq');
                }}
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-md hover:bg-white/[0.04] cursor-pointer"
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
              href="#download"
              onClick={(e) => {
                e.preventDefault();
                scrollTo('download');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#ededef] text-[#08090a] hover:bg-white rounded-md transition-colors shadow-sm cursor-pointer"
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
      <main className="relative z-10 pt-28 sm:pt-36">
        {/* ── Hero Section (Linear Left-Aligned, Punchy & Convincing) ── */}
        <section id="hero" className="pb-16 px-6 max-w-6xl mx-auto scroll-mt-28">
          <div className="max-w-4xl">
            {/* Left-Aligned Headline - One Line */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] text-[#ededef] leading-[1.1]">
              Free, open source issue tracker for solo devs and teams.
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm text-[#8a8f98] leading-relaxed max-w-xl">
              Local SQLite by default, with a one-click BYOD flow to sync with your own Supabase. No subscriptions, no accounts, no telemetry.
            </p>

            {/* Direct Download Action */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={`${GITHUB_RELEASES}/latest`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#ededef] text-[#08090a] hover:bg-white transition-all shadow-sm group"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Leeflet</span>
              </a>
            </div>
          </div>

          {/* ── App UI Preview Card (Clean Card, No Browser Header, Scaled by 2px) ── */}
          <div className="mt-12 sm:mt-16 relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 bg-gradient-to-b from-white/[0.03] to-transparent rounded-2xl filter blur-xl pointer-events-none"
            />

            <div className="relative rounded-xl border border-white/[0.08] bg-[#0e1013] overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]">
              <img
                src="/leaf.png"
                alt="Leeflet Workspace Interface"
                className="w-full h-auto block select-none"
                style={{
                  width: 'calc(100% + 4px)',
                  maxWidth: 'none',
                  margin: '-2px',
                }}
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ── Data Sovereignty & Workflow (Unified WobbleCard Bento Grid) ── */}
        <section id="byod" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="max-w-3xl mb-12">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
              Data Sovereignty & Workflow
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededef]">
              Your data belongs to you. Not a SaaS vendor.
            </h2>
            <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed max-w-2xl">
              Most productivity apps hold your tasks hostage behind subscriptions and proprietary servers. Leeflet gives you true autonomy with our BYOD architecture and a workflow engineered for speed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">

            {/* Card 1: Local-First SQLite — wide */}
            <WobbleCard containerClassName="col-span-1 lg:col-span-2 bg-white/[0.03] min-h-[320px]">
              <div className="max-w-xs relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.04]">
                    Out of the Box
                  </span>
                  <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest">Zero Config</span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[#ededef]">
                  Local-First SQLite Engine
                </h3>
                <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
                  Install and start capturing immediately. Every task, queue, and note is stored in an embedded SQLite database on your disk. Blazing fast, zero network overhead, works forever offline.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-[#52525b] font-mono">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#a1a1aa] shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>No signups, no logins, no internet required</span>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-[0.04] pointer-events-none select-none">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                  <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
                  <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
                </svg>
              </div>
            </WobbleCard>

            {/* Card 2: BYOD Cloud Sync — narrow */}
            <WobbleCard containerClassName="col-span-1 bg-white/[0.03] min-h-[320px]">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.04]">
                    Optional
                  </span>
                  <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest">BYOD</span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[#ededef]">
                  Bring Your Own Supabase
                </h3>
                <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
                  Paste your Supabase URL and Anon key into Settings. Your tasks sync via WebSocket push, protected by Row Level Security. We never see your keys or data.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-[#52525b] font-mono">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#a1a1aa] shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Free Supabase tier is more than enough</span>
                </div>
              </div>
            </WobbleCard>

            {/* Card 3: Global Quick Capture */}
            <WobbleCard containerClassName="col-span-1 bg-white/[0.03] min-h-[240px]">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#3f3f46] mb-4">01</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Global Quick Capture</h3>
                <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
                  Hit{' '}
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white/[0.06] border border-white/[0.08] rounded text-[#d4d4d8]">
                    Ctrl+Shift+Space
                  </kbd>{' '}
                  anywhere. Type a thought, set priority, and disappear — without breaking your focus.
                </p>
              </div>
            </WobbleCard>

            {/* Card 4: Personal Focus Queue */}
            <WobbleCard containerClassName="col-span-1 bg-white/[0.03] min-h-[240px]">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#3f3f46] mb-4">02</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Personal Focus Queue</h3>
                <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
                  Pull high-priority issues from the backlog into your queue. Execute one at a time with instant keyboard toggles for status, priority, and subtasks.
                </p>
              </div>
            </WobbleCard>

            {/* Card 5: Desktop Widgets */}
            <WobbleCard containerClassName="col-span-1 bg-white/[0.03] min-h-[240px]">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#3f3f46] mb-4">03</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Companion Desktop Widgets</h3>
                <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
                  Pin sticky notes and floating queue widgets directly on your desktop. Always-on-top, transparent, and completely independent of the main window.
                </p>
              </div>
            </WobbleCard>

            {/* Card 6: MIT License */}
            <WobbleCard containerClassName="col-span-1 bg-white/[0.03] min-h-[240px]">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#3f3f46] mb-4">04</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">MIT Licensed</h3>
                <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
                  Fully open source under the MIT license. Inspect the code, fork it, self-host it, or contribute. No gated features, no paywalls, no strings attached.
                </p>
              </div>
            </WobbleCard>

            {/* Card 7: Auto-updater — wide */}
            <WobbleCard containerClassName="col-span-1 lg:col-span-2 bg-white/[0.03] min-h-[240px]">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#3f3f46] mb-4">05</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Built-in Auto-updater</h3>
                <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed">
                  When a new release is signed and published on GitHub, an in-app banner lets you install it in one click. Always on the latest version without manual downloads.
                </p>
              </div>
            </WobbleCard>

          </div>

        </section>

        {/* ── FAQ Section (Interactive Accordion with Left Image Card) ── */}
        <section id="faq" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="mb-8">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
              FAQ
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededef]">
              Frequently asked questions.
            </h2>
            <p className="mt-2 text-sm text-[#8a8f98] leading-relaxed">
              Everything you need to know about licensing, data ownership, and desktop capabilities.
            </p>
          </div>

          <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-white/[0.01] px-6">
            <FaqItem
              question="Is Leeflet really 100% free and open source?"
              answer="Yes. Leeflet is released under the permissive MIT license. There are no paid tiers, no gated features, no trial periods, and no ads. You can inspect, modify, and fork the full source code on GitHub."
            />
            <FaqItem
              question="How does the Bring Your Own Database (BYOD) flow work?"
              answer="Most task trackers force you onto their cloud servers and charge per user. Leeflet gives you two options: 1) Run completely offline with your local SQLite database, or 2) Enter your own Supabase project URL and Anon key in Settings. Your tasks sync directly to your private Supabase database via WebSocket push, protected by Row Level Security. We never store or touch your credentials."
            />
            <FaqItem
              question="Can I use Leeflet completely offline without any setup?"
              answer="Yes. When you download the desktop app, it uses an embedded SQLite database on your computer. You don't need an account, an internet connection, or any configuration. Just launch and begin capturing."
            />
            <FaqItem
              question="Do I need to sign up or create an account?"
              answer="No. There are zero accounts or sign-up forms required to use Leeflet. If you choose to enable cloud sync, authentication is handled directly through your own Supabase project."
            />
            <FaqItem
              question="How do desktop updates work?"
              answer="Leeflet has a built-in auto-updater. When a new version is published and signed on GitHub, an in-app banner appears allowing you to install the update in one click."
            />
            <FaqItem
              question="Which operating systems are supported?"
              answer="Windows, macOS, and Linux are supported with lightweight native installers and automatic background updates."
            />
          </div>
        </section>


        {/* ── Download Strip (Focused exclusively on downloads) ── */}
        <section id="download" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="p-8 sm:p-12 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
                Get Started
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#ededef]">
                Download Leeflet
              </h3>
              <p className="mt-2 text-sm text-[#8a8f98] max-w-lg leading-relaxed">
                Free, open source, and lightweight under 15MB. Available for Windows, macOS, and Linux with automatic background updates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`${GITHUB_RELEASES}/latest`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#ededef] text-[#08090a] hover:bg-white transition-all shadow-sm"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Leeflet</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Minimal Footer (No Web App link) ── */}
      <footer className="border-t border-white/[0.06] py-10 px-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52525b]">
        <div className="flex items-center gap-2">
          <img src="/logo_alpha.png" alt="Leeflet" className="w-4 h-4 rounded opacity-75" />
          <span className="font-brand text-base text-[#8a8f98]">leeflet</span>
          <span>· Free & open source under MIT · Built by <a href="https://christliebdela.vercel.app/" target="_blank" rel="noreferrer" className="text-[#8a8f98] hover:text-white transition-colors">Christlieb Dela</a></span>
        </div>

        <div className="flex items-center gap-5">
          <a
            href="/changelog"
            className="text-[#8a8f98] hover:text-white transition-colors"
          >
            Changelog
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
