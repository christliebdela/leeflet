import React, { useState, useEffect } from 'react';
import { AuroraBackground } from '../ui/aurora-background';
import { INITIAL_SCHEMA_SQL } from '../../utils/schemaSql';
import { useReleaseDownload, OSIcon } from '../../utils/releaseDownload';

const GITHUB_REPO = 'https://github.com/christliebdela/leeflet';

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: string;
}

const SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Architecture & Model',
    category: 'Getting started',
    icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  },
  {
    id: 'installation',
    title: 'Installation & Paths',
    category: 'Getting started',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  },
  {
    id: 'quick-capture',
    title: 'Global Quick Capture',
    category: 'Getting started',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },

  {
    id: 'byod-supabase',
    title: 'BYOD Supabase Sync',
    category: 'Sync & Database',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
  },
  {
    id: 'database-schema',
    title: 'SQL Schema Script',
    category: 'Sync & Database',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'team-collaboration',
    title: 'Team Sync & SMTP Invites',
    category: 'Sync & Database',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },

  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    category: 'Workflow & UI',
    icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  },
  {
    id: 'desktop-widgets',
    title: 'Companion Widgets & Mini',
    category: 'Workflow & UI',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  },
  {
    id: 'themes-customization',
    title: 'Themes & Personalization',
    category: 'Workflow & UI',
    icon: 'M7 21a4 4 0 01-4-4 4 4 0 014-4 4 4 0 014 4 4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-3a2 2 0 00-2-2h-3m-6 7a4 4 0 01-4-4 4 4 0 014-4 4 4 0 014 4 4 4 0 01-4 4zm0 0v-4m0 0h4',
  },

  {
    id: 'backups',
    title: 'Data Sovereignty & SQLite',
    category: 'Data Sovereignty',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
];

export const DocsPage: React.FC = () => {
  const { os, downloadUrl } = useReleaseDownload();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Getting started': true,
    'Sync & Database': true,
    'Workflow & UI': true,
    'Data Sovereignty': true,
  });
  const [copied, setCopied] = useState(false);

  // Scroll to section from URL hash on initial load
  useEffect(() => {
    const rawHash = window.location.hash.replace('#', '');
    const hash = rawHash === 'byod' ? 'byod-supabase' : rawHash;
    if (hash) {
      const timer = setTimeout(() => {
        scrollToSection(hash);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const scrollToSection = (id: string) => {
    const targetId = id === 'byod' ? 'byod-supabase' : id;
    setActiveSection(targetId);
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copySql = () => {
    navigator.clipboard.writeText(INITIAL_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['Getting started', 'Sync & Database', 'Workflow & UI', 'Data Sovereignty'];

  return (
    <AuroraBackground showRadialGradient={false}>
      {/* Linear-Style Fixed Layout with Aurora Flow */}
      <div className="relative z-10 flex h-screen w-full overflow-hidden text-[#ededef] font-sans antialiased selection:bg-white/20 selection:text-white">
        
        {/* Left Sidebar (Fixed 240px, Frosted Glass) */}
        <aside className="w-[240px] h-screen shrink-0 border-r border-white/[0.08] bg-[#08090a]/50 backdrop-blur-3xl flex flex-col justify-between select-none z-20 shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.04)]">
          {/* Sidebar Header */}
          <div>
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.08]">
              <a href="/" className="flex items-center gap-2.5 group no-underline text-inherit cursor-pointer">
                <img
                  src="/logo_alpha.png"
                  alt="Leeflet"
                  className="w-6 h-6 rounded object-contain opacity-90 group-hover:opacity-100 transition-opacity"
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

          {/* Sidebar Footer Links */}
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

        {/* Main Scrollable Reading Area */}
        <div className="flex-1 h-screen flex flex-col overflow-hidden">
          {/* Main Sticky Top Bar */}
          <header className="h-14 shrink-0 border-b border-white/[0.08] px-8 flex items-center justify-between bg-[#08090a]/40 backdrop-blur-xl z-10">
            <div className="flex items-center gap-2 text-xs text-[#8a8f98]">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <span>/</span>
              <span className="text-[#ededef] font-medium">Docs</span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black font-medium text-xs hover:bg-white/90 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <OSIcon os={os} className="w-3.5 h-3.5" />
                <span>Download App</span>
              </a>
            </div>
          </header>

          {/* Content Container */}
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <div className="max-w-5xl mx-auto py-10 px-8 sm:px-12 space-y-12 pb-24">
              
              {/* Hero Section */}
              <div className="space-y-3 pt-2">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#ededef]">
                  <span className="font-brand text-4xl sm:text-5xl font-normal tracking-normal text-white">leeflet</span> Documentation
                </h1>
                <p className="text-base text-[#8a8f98] max-w-2xl leading-relaxed">
                  Everything you need to know about Leeflet&apos;s local-first architecture, embedded SQLite database, optional Supabase cloud sync, team collaboration, and keyboard-driven workflows.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#71717a] font-semibold">
                  Quick Navigation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Bento Card 1 */}
                  <div
                    onClick={() => scrollToSection('getting-started')}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] hover:border-white/[0.14] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all cursor-pointer space-y-8 group flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#ededef] group-hover:scale-105 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">Local Architecture</div>
                      <div className="text-xs text-[#8a8f98] leading-relaxed">Native Rust + SQLite engine, zero telemetry</div>
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
                      <div className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">BYOD Supabase Sync</div>
                      <div className="text-xs text-[#8a8f98] leading-relaxed">Direct PostgreSQL sync with Row Level Security</div>
                    </div>
                  </div>

                  {/* Bento Card 3 */}
                  <div
                    onClick={() => scrollToSection('shortcuts')}
                    className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl hover:bg-white/[0.06] hover:border-white/[0.14] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all cursor-pointer space-y-8 group flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#ededef] group-hover:scale-105 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                        <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M6 12h.001M10 12h.001M14 12h.001M18 12h.001M7 16h10"></path>
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#ededef] group-hover:text-white transition-colors">Keyboard Workflows</div>
                      <div className="text-xs text-[#8a8f98] leading-relaxed">Full mouse-free navigation and Alt+L quick capture</div>
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

              {/* Detailed Documentation Sections */}
              <div className="space-y-12 pt-6">
                
                {/* Section 1: Architecture */}
                <section id="getting-started" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">01 · Architecture</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Local-First Architecture & Core Tenets</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Leeflet is an ultra-fast, local-first developer workspace and task management tool built with Rust and Tauri. Unlike traditional SaaS project management platforms that require always-on connectivity, central accounts, and monthly subscription tiers, Leeflet executes directly on your hardware and writes instantly to an embedded SQLite database.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>Zero Latency Reads & Writes</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Every keystroke, state change, and project switch happens in under 5ms directly in SQLite with zero network round trips.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>100% Offline Resilience</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Works on flights, trains, or offline remote environments. Your data never leaves your disk unless you configure cloud sync.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 shrink-0">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>Zero Intermediary Servers</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Leeflet operates zero proprietary cloud servers. When you enable cloud sync, your desktop connects directly to your own Supabase instance.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        <span>Open Source (MIT)</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Inspect every line of code, run custom builds, and maintain absolute ownership over your workflow tools.</p>
                    </div>
                  </div>
                </section>

                {/* Section 2: Installation & Paths */}
                <section id="installation" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">02 · Setup & Filesystem</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Installation & Database File Locations</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Download the pre-compiled native installer or portable archive for your platform. Leeflet is a compact native binary with zero heavy browser bloat.
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

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl text-xs text-[#8a8f98] leading-relaxed">
                    <span className="text-[#ededef] font-medium">Automatic In-App Updates:</span> Leeflet checks GitHub Releases for signed binary updates. When an update is ready, a notification badge appears in Settings with a 1-click update button.
                  </div>
                </section>

                {/* Section 3: Quick Capture */}
                <section id="quick-capture" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">03 · Rapid Capture</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Global Quick Capture (<kbd className="px-1.5 py-0.5 font-mono text-xs bg-white/[0.06] rounded text-white border border-white/[0.08]">Alt+L</kbd>)</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Capture thoughts, bugs, and tasks from anywhere on your operating system without losing your flow or context switching:
                  </p>

                  <div className="space-y-2.5 text-xs text-[#8a8f98] leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong className="text-[#ededef]">Global Hotkey:</strong> Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/[0.06] rounded border border-white/[0.08]">Alt+L</kbd> from any window (VS Code, terminal, browser, Slack).</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong className="text-[#ededef]">Auto-Expanding Modal:</strong> The floating window dynamically sizes itself to accommodate wrapped text, multi-line notes, and checklists.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span><strong className="text-[#ededef]">Instant Save:</strong> Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/[0.06] rounded border border-white/[0.08]">Ctrl+Enter</kbd> to save directly to your inbox and dismiss the modal. Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/[0.06] rounded border border-white/[0.08]">Esc</kbd> to cancel.</span>
                    </div>
                  </div>
                </section>

                {/* Section 4: BYOD Supabase Sync */}
                <section id="byod-supabase" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">04 · Cloud Synchronization</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Bring Your Own Database (BYOD) Sync</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    When you need multi-machine synchronization or team collaboration, connect your personal Supabase project in under 60 seconds with zero proprietary vendor lock-in:
                  </p>
                  
                  <ol className="list-decimal list-inside space-y-2.5 text-xs text-[#8a8f98] leading-relaxed">
                    <li><strong className="text-[#ededef]">Create a Free Supabase Project:</strong> Navigate to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#ededef] underline">supabase.com</a> and create a new project.</li>
                    <li><strong className="text-[#ededef]">Run the Migration Script:</strong> Copy the SQL schema below and run it in the Supabase SQL Editor.</li>
                    <li><strong className="text-[#ededef]">Connect in Leeflet:</strong> Open Leeflet Settings (<kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white/[0.06] rounded border border-white/[0.08]">Ctrl+,</kbd>), paste your Supabase Project URL & Anon Key, and click <span className="text-[#ededef] font-medium">&quot;Save &amp; Connect&quot;</span>.</li>
                  </ol>

                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs text-emerald-300 space-y-1">
                    <div className="font-semibold">Row Level Security (RLS) Protected:</div>
                    <p className="text-emerald-200/80 leading-relaxed">All sync queries run over encrypted HTTPS directly to your PostgreSQL database. Your workspace data, projects, tasks, checklists, and invites sync in real time using Postgres Change Streams.</p>
                  </div>
                </section>

                {/* Section 5: SQL Schema */}
                <section id="database-schema" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">05 · Database Schema</div>
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
                  <h2 className="text-xl font-semibold tracking-tight text-[#ededef]">Supabase SQL Migration Script</h2>
                  <p className="text-xs text-[#8a8f98] leading-relaxed">
                    This script provisions tables for workspaces, members, invites, projects, tasks, and checklists along with indexes and RLS policies.
                  </p>
                  <pre className="p-4 rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-xl text-[11px] font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed max-h-[420px] scrollbar-thin scrollbar-thumb-white/[0.08]">
{INITIAL_SCHEMA_SQL}
                  </pre>
                </section>

                {/* Section 6: Team Collaboration */}
                <section id="team-collaboration" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">06 · Collaboration</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Team Workspaces, Roles & Custom SMTP Invites</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Collaborate with teammates without giving up local-first control:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Instant Invite Links & Codes</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Generate 8-character invite tokens or link codes. Teammates paste the code into <strong className="text-white">Join Team Workspace</strong> and connect immediately.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 shrink-0">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>Custom SMTP Email Delivery</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Configure your own SMTP server (Gmail App Passwords, Resend, SendGrid, Postmark) in Settings to dispatch elegant invite emails to teammates.</p>
                    </div>
                  </div>
                </section>

                {/* Section 7: Keyboard Shortcuts */}
                <section id="shortcuts" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">07 · Navigation</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Keyboard Shortcuts Matrix</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Leeflet is designed for mouse-free power users. Keep your hands on the keyboard:
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
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Alt + L</kbd></td>
                          <td className="p-3 text-[11px] font-mono text-emerald-400">System-wide (OS)</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">New Item (In-App)</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">N</kbd> or <kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">C</kbd> or <kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Ctrl + N</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Search Workspace</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Ctrl + K</kbd> or <kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">/</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Settings &amp; Preferences</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Ctrl + ,</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Toggle Sidebar</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Ctrl + B</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Go to Backlog (Inbox)</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Ctrl + I</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Go to My Queue</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Ctrl + Q</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Switch Projects (1 - 9)</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">1 - 9</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Mini Mode (Queue Widget)</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">M</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Coffee Break / Standby Mask</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Z</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-[#ededef]">Close Detail / Modal</td>
                          <td className="p-3"><kbd className="px-1.5 py-0.5 font-mono bg-white/[0.06] rounded text-white border border-white/[0.08]">Esc</kbd></td>
                          <td className="p-3 text-[11px] font-mono">In-App</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 8: Companion Widgets */}
                <section id="desktop-widgets" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">08 · Desktop Companions</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Always-On-Top Widgets & Mini Mode</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Work without window juggling using Leeflet&apos;s lightweight companion widgets:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
                          <line x1="12" y1="17" x2="12" y2="22" />
                          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                        </svg>
                        <span>Detachable Sticky Notes</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Pin any task as an always-on-top transparent sticky note. Edit checklists, adjust notes, and monitor progress directly over your code editor.</p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#ededef]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 shrink-0">
                          <polyline points="4 14 10 14 10 20" />
                          <polyline points="20 10 14 10 14 4" />
                          <line x1="14" y1="10" x2="21" y2="3" />
                          <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                        <span>Mini Focus Queue</span>
                      </div>
                      <p className="text-xs text-[#8a8f98] leading-relaxed">Compress your entire active task queue into a sleek, minimal floating card (<kbd className="px-1 py-0.5 font-mono text-[10px] bg-white/[0.06] rounded border border-white/[0.08]">M</kbd>) positioned alongside your IDE.</p>
                    </div>
                  </div>
                </section>

                {/* Section 9: Themes & Personalization */}
                <section id="themes-customization" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">09 · Aesthetics</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Themes & Personalization</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Tailored specifically for developer aesthetics with curated high-contrast and warm dark presets:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-center font-mono">
                    <div className="p-3 rounded-lg border border-white/[0.08] bg-black/60 text-[#ededef]">Noir (Default)</div>
                    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200">Charcoal</div>
                    <div className="p-3 rounded-lg border-[#45372b] bg-[#24201c] text-[#d4bca0]">Claude Warm</div>
                    <div className="p-3 rounded-lg border-[#292e42] bg-[#1a1b26] text-[#7aa2f7]">Tokyo Night</div>
                    <div className="p-3 rounded-lg border-[#363a4f] bg-[#1e2030] text-[#8aadf4]">Catppuccin</div>
                    <div className="p-3 rounded-lg border-[#504945] bg-[#282828] text-[#ebdbb2]">Gruvbox</div>
                    <div className="p-3 rounded-lg border-[#44475a] bg-[#282a36] text-[#bd93f9]">Dracula</div>
                    <div className="p-3 rounded-lg border-[#24283b] bg-[#1f2335] text-[#bb9af7]">Storm</div>
                  </div>
                </section>

                {/* Section 10: Backups & SQLite */}
                <section id="backups" className="p-8 sm:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-4 scroll-mt-20">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">10 · Data Sovereignty</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#ededef]">Backups & Direct SQLite CLI Querying</h2>
                  <p className="text-sm text-[#8a8f98] leading-relaxed">
                    Because your data lives in standard SQLite, you are never locked in. Back up the raw <code className="text-[11px] font-mono text-emerald-400">leaf.db</code> file, query it with any SQLite client, or export to JSON/CSV from Settings.
                  </p>
                  <pre className="p-4 rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-xl text-[11px] font-mono text-[#d4d4d8] overflow-x-auto leading-relaxed">
{`# Inspect your local database directly with the sqlite3 CLI:
sqlite3 ~/Documents/leeflet/leaf.db "SELECT id, title, status, priority FROM items ORDER BY created_at DESC LIMIT 10;"

# Export entire database schema & data to a SQL dump file:
sqlite3 ~/Documents/leeflet/leaf.db ".dump" > leeflet_backup.sql`}
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
