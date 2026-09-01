import React, { useState, useEffect } from 'react';
import { AuroraBackground } from '../ui/aurora-background';
import { INITIAL_SCHEMA_SQL } from '../../utils/schemaSql';

const GITHUB_REPO = 'https://github.com/christliebdela/leeflet';

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: string;
}

const SECTIONS: DocSection[] = [
  { id: 'getting-started', title: 'Start Guide', category: 'Getting started', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { id: 'installation', title: 'Installation & Paths', category: 'Getting started', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { id: 'quick-capture', title: 'Global Quick Capture', category: 'Getting started', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  
  { id: 'byod-supabase', title: 'BYOD Supabase Sync', category: 'Sync & Database', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  { id: 'database-schema', title: 'SQL Schema Script', category: 'Sync & Database', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  
  { id: 'shortcuts', title: 'Keyboard Shortcuts', category: 'Workflow', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { id: 'desktop-widgets', title: 'Companion Widgets', category: 'Workflow', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  
  { id: 'backups', title: 'Backups & Raw SQLite', category: 'Data Sovereignty', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
];

export const DocsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Getting started': true,
    'Sync & Database': true,
    'Workflow': true,
    'Data Sovereignty': true,
  });
  const [copied, setCopied] = useState(false);

  // Scroll to section from URL hash on initial load (e.g. /docs#byod-supabase)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Small delay to ensure DOM is fully rendered before scrolling
      const timer = setTimeout(() => {
        scrollToSection(hash);
      }, 150);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copySql = () => {
    navigator.clipboard.writeText(INITIAL_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['Getting started', 'Sync & Database', 'Workflow', 'Data Sovereignty'];

  return (
    <AuroraBackground showRadialGradient={false}>
      {/* ── Linear-Style Fixed Layout with Aurora Flow ── */}
      <div className="relative z-10 flex h-screen w-full overflow-hidden text-[#ededef] font-sans antialiased selection:bg-white/20 selection:text-white">
        
        {/* ── Left Sidebar (Fixed 240px, Frosted Glass) ── */}
        <aside className="w-[240px] h-screen shrink-0 border-r border-white/[0.08] bg-[#08090a]/50 backdrop-blur-3xl flex flex-col justify-between select-none z-20 shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.04)]">
          
          {/* Sidebar Header */}
          <div>
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.08]">
              <a href="/" className="flex items-center gap-2.5 group no-underline text-inherit cursor-pointer">
                <img
                  src="/logo_alpha.png"
                  alt="Leeflet"
                  className="w-5 h-5 rounded object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <span className="font-semibold text-sm tracking-tight text-[#ededef]">Docs</span>
              </a>

              <button
                type="button"
                onClick={() => scrollToSection('getting-started')}
                className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#71717a] hover:text-[#ededef] transition-colors cursor-pointer"
                title="Search documentation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>

            {/* Navigation Groups List */}
            <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] scrollbar-thin scrollbar-thumb-white/[0.06]">
              {categories.map((cat) => {
                const isOpen = !!openGroups[cat];
                const items = SECTIONS.filter((s) => s.category === cat);

                return (
                  <div key={cat} className="space-y-0.5">
                    {/* Category Toggle Header */}
                    <button
                      onClick={() => toggleGroup(cat)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-[#8a8f98] hover:text-[#ededef] transition-colors cursor-pointer rounded-md hover:bg-white/[0.03]"
                    >
                      <span className="font-medium">{cat}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-150 text-[#71717a] ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Sub-items */}
                    {isOpen && (
                      <div className="space-y-0.5 pt-0.5">
                        {items.map((sec) => {
                          const isActive = activeSection === sec.id;
                          return (
                            <button
                              key={sec.id}
                              onClick={() => scrollToSection(sec.id)}
                              style={{
                                fontFamily: '"Inter Variable", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
                                fontWeight: 510,
                                fontSize: '13px',
                                lineHeight: 'normal',
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer text-left ${
                                isActive
                                  ? 'bg-white/[0.1] text-white font-medium shadow-sm backdrop-blur-md border border-white/[0.14]'
                                  : 'text-[#8a8f98] hover:text-[#ededef] hover:bg-white/[0.04]'
                              }`}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 shrink-0">
                                <path d={sec.icon} />
                              </svg>
                              <span className="truncate">{sec.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer Links (Pinned Linear Style) */}
          <div className="border-t border-white/[0.08] p-3 space-y-0.5 text-xs text-[#8a8f98]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.08] text-white font-medium border border-white/[0.1]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Docs</span>
            </div>

            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-white/[0.04] hover:text-[#ededef] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub Repository</span>
            </a>

            <a
              href="/"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-white/[0.04] hover:text-[#ededef] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back to Home</span>
            </a>
          </div>
        </aside>

        {/* ── Main Scrollable Reading Area ── */}
        <div className="flex-1 h-screen flex flex-col overflow-hidden">
          
          {/* Main Sticky Top Bar (Frosted Glass) */}
          <header className="h-14 shrink-0 border-b border-white/[0.08] px-8 flex items-center justify-between bg-[#08090a]/40 backdrop-blur-xl z-10">
            <div className="flex items-center gap-2 text-xs text-[#8a8f98]">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <span>/</span>
              <span className="text-[#ededef] font-medium">Docs</span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/#download"
                className="px-3.5 py-1.5 rounded-full bg-white text-black font-medium text-xs hover:bg-white/90 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Download App
              </a>
            </div>
          </header>

          {/* Content Container (Full Width, Centered) */}
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <div className="max-w-5xl mx-auto py-10 px-8 sm:px-12 space-y-12 pb-24">
              
              {/* Hero Section */}
              <div className="space-y-3 pt-2">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#ededef]">
                  <span className="font-brand text-4xl sm:text-5xl font-normal tracking-normal text-white">leeflet</span> Docs
                </h1>
                <p className="text-base text-[#8a8f98] max-w-2xl leading-relaxed">
                  Get an overview of Leeflet&apos;s local-first architecture, embedded SQLite database, Supabase cloud sync, and keyboard-driven workflows.
                </p>
              </div>

              {/* Frosted Bento Grid */}
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#71717a] font-semibold">
                  Popular
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Bento Card 1 */}
                  <div
                    onClick={() => scrollToSection('getting-started')}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] hover:border-white/[0.14] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all cursor-pointer space-y-8 group flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#ededef] group-hover:scale-105 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">Start Guide</div>
                      <div className="text-xs text-[#8a8f98] leading-relaxed">Learn how to use the app and master local-first workflows</div>
                    </div>
                  </div>

                  {/* Bento Card 2 */}
                  <div
                    onClick={() => scrollToSection('byod-supabase')}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] hover:border-white/[0.14] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all cursor-pointer space-y-8 group flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#ededef] group-hover:scale-105 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">BYOD Cloud Sync</div>
                      <div className="text-xs text-[#8a8f98] leading-relaxed">Connect your private Supabase project for real-time sync</div>
                    </div>
                  </div>

                  {/* Bento Card 3 */}
                  <div
                    onClick={() => scrollToSection('shortcuts')}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] hover:border-white/[0.14] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all cursor-pointer space-y-8 group flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#ededef] group-hover:scale-105 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">Shortcuts</div>
                      <div className="text-xs text-[#8a8f98] leading-relaxed">System-wide Alt+L capture & vim navigation keys</div>
                    </div>
                  </div>

                  {/* Bento Card 4 */}
                  <div
                    onClick={() => scrollToSection('backups')}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] hover:border-white/[0.14] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all cursor-pointer space-y-8 group flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#ededef] group-hover:scale-105 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">Data Sovereignty</div>
                      <div className="text-xs text-[#8a8f98] leading-relaxed">Raw SQLite backups, zero telemetry, full ownership</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Detailed Documentation Sections (Frosted Glass Cards) ── */}
              <div className="space-y-12 pt-6">
                
                {/* Section 1: Getting Started */}
                <section id="getting-started" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">01 · Architecture</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Getting Started with Leeflet</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Leeflet is an ultra-fast, local-first issue tracker and developer workspace built on Rust and Tauri. Unlike traditional web applications, Leeflet runs natively on your machine, stores everything in an embedded SQLite database on your SSD, and never requires an account or internet connection to function.
                  </p>
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-xs font-mono text-[#a1a1aa] space-y-1.5">
                    <div className="text-[#ededef] font-medium">Core Tenets:</div>
                    <div>• Zero accounts or forced signups</div>
                    <div>• 100% offline functionality with embedded SQLite</div>
                    <div>• Optional BYOD (Bring Your Own Database) cloud sync with your private Supabase</div>
                    <div>• Permissive MIT License</div>
                  </div>
                </section>

                {/* Section 2: Installation & Paths */}
                <section id="installation" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">02 · Setup</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Installation & File System Storage</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Download the installer for your operating system from the releases page. Leeflet is a single self-contained binary under 15MB.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
                      <div className="text-xs font-semibold text-[#ededef]">Windows Database Location</div>
                      <code className="text-[11px] font-mono text-[#a1a1aa] mt-1.5 block break-all">
                        %USERPROFILE%\Documents\leeflet\leaf.db
                      </code>
                    </div>
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
                      <div className="text-xs font-semibold text-[#ededef]">macOS & Linux Database Location</div>
                      <code className="text-[11px] font-mono text-[#a1a1aa] mt-1.5 block break-all">
                        ~/.local/share/leeflet/leaf.db
                      </code>
                    </div>
                  </div>
                </section>

                {/* Section 3: BYOD Supabase Sync */}
                <section id="byod-supabase" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">03 · Cloud Sync</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Bring Your Own Database (BYOD) Sync</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    When you want multi-device synchronization or team collaboration, connect your personal Supabase project in under 60 seconds:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-[#8a8f98]">
                    <li><strong className="text-[#ededef]">Create a Supabase Project:</strong> Open <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#ededef] underline">supabase.com</a> and spin up a new free project.</li>
                    <li><strong className="text-[#ededef]">Run the Migration:</strong> Paste the SQL schema below in your Supabase SQL Editor.</li>
                    <li><strong className="text-[#ededef]">Connect in Leeflet:</strong> Open Leeflet Settings (<kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/[0.06] rounded border border-white/[0.08]">Cmd/Ctrl+,</kbd>), paste your Supabase URL & Anon Key, and click <span className="text-[#ededef] font-medium">&quot;Save &amp; Connect&quot;</span>.</li>
                  </ol>
                </section>

                {/* Section 4: SQL Schema */}
                <section id="database-schema" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">04 · Database Schema</div>
                    <button
                      onClick={copySql}
                      className="px-3 py-1.5 text-xs font-mono rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-[#ededef] border border-white/[0.14] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#ededef]">Supabase Migration Script</h2>
                  <pre className="p-4 rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-xl text-[11px] font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed max-h-[420px] scrollbar-thin scrollbar-thumb-white/[0.08]">
{INITIAL_SCHEMA_SQL}
                  </pre>
                </section>

                {/* Section 5: Keyboard Shortcuts */}
                <section id="shortcuts" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">05 · Navigation</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Keyboard Shortcuts</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Leeflet is fully navigable without a mouse. Master these shortcuts for maximum productivity:
                  </p>

                  <div className="border border-white/[0.08] rounded-xl overflow-hidden text-xs bg-white/[0.01] backdrop-blur-xl">
                    <table className="w-full text-left">
                      <thead className="bg-white/[0.03] text-[#ededef] font-mono text-[11px] border-b border-white/[0.08]">
                        <tr>
                          <th className="p-3">Action</th>
                          <th className="p-3">Shortcut</th>
                          <th className="p-3">Scope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-[#8a8f98]">
                        <tr>
                          <td className="p-3 text-[#ededef]">Global Quick Capture</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Alt+L</kbd></td>
                          <td className="p-3 text-[11px] font-mono text-emerald-400">System-wide (OS)</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">New Issue</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">C</kbd> or <kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">N</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Toggle Focus Queue</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Q</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Set Priority (Urgent/High/Med/Low)</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">1 - 4</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Search Issues</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">/</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Command Palette</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Ctrl/Cmd+K</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Delete Selected Task</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Delete</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 6: Quick Capture */}
                <section id="quick-capture" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">06 · Floating Bar</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Global Quick Capture</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 font-mono text-xs bg-white/[0.06] rounded text-white border border-white/[0.08]">Alt+L</kbd> from any application (IDE, browser, terminal) to trigger the native floating capture bar. Type your issue title, hit Enter, and it saves directly to your local database without switching windows.
                  </p>
                </section>

                {/* Section 7: Companion Widgets */}
                <section id="desktop-widgets" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">07 · Desktop Companion</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Companion Desktop Widgets</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Detach individual task items as always-on-top transparent sticky notes or float your active personal queue next to your code editor during heads-down execution sessions.
                  </p>
                </section>

                {/* Section 8: Backups */}
                <section id="backups" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">08 · Data Sovereignty</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Backups & Raw Database Inspection</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Because your data is stored in standard SQLite, you can backup, inspect, or query your database using any tool like `sqlite3`, DBeaver, or TablePlus.
                  </p>
                  <pre className="p-4 rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-xl text-[11px] font-mono text-[#d4d4d8] overflow-x-auto">
{`# Query your local database directly from the terminal:
sqlite3 ~/Documents/leeflet/leaf.db "SELECT id, title, status FROM items LIMIT 10;"`}
                  </pre>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuroraBackground>
  );
};
