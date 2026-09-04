import React, { useState, useEffect } from 'react';
import { WobbleCard } from '../ui/wobble-card';
import { LandingBackground, BackgroundToggle } from './LandingBackground';
import { InteractiveAppDemo } from './InteractiveAppDemo';
import {
  useReleaseDownload,
  OSIcon,
  WindowsIcon,
  AppleIcon,
  LinuxIcon,
  GITHUB_REPO,
  GITHUB_RELEASES,
} from '../../utils/releaseDownload';

interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
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
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="text-xs sm:text-sm text-[#8a8f98] leading-relaxed space-y-2">
          {answer}
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [starCount, setStarCount] = useState<number>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { os, osName, downloadUrl, allDownloads } = useReleaseDownload();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    fetch('https://api.github.com/repos/christliebdela/leeflet')
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data) => {
        if (typeof data?.stargazers_count === 'number') {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatStars = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

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
    <LandingBackground>
      {/* ── Fixed Top Navigation Bar (Seamless at top, frosted glass on scroll) ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'border-b border-white/[0.08] bg-[#08090a]/75 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'border-b border-transparent bg-transparent shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
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
              className="w-7 h-7 rounded object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-brand text-2xl font-normal tracking-tight text-[#ededef]">
              leeflet
            </span>
          </a>

          {/* Header links */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <nav className="hidden md:flex items-center gap-1 text-[#8a8f98]">
              <a
                href="#byod"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('byod');
                }}
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04] cursor-pointer"
              >
                Features
              </a>
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('pricing');
                }}
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04] cursor-pointer"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('faq');
                }}
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04] cursor-pointer"
              >
                FAQ
              </a>
              <a
                href="/docs"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
                Docs
              </a>
              {/* <a
                href="/changelog"
                className="px-3 py-1.5 hover:text-[#ededef] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
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

            {/* Background Style Toggle */}
            <BackgroundToggle />

            {/* Glass Navigation Download Button */}
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-[#ededef] hover:text-white border border-white/[0.10] hover:border-white/[0.16] backdrop-blur-xl transition-colors duration-150 shadow-sm cursor-pointer"
            >
              <OSIcon os={os} className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content Container with top padding for fixed header ── */}
      <main className="relative z-10 pt-28 sm:pt-36">
        {/* ── Hero Section (Linear Left-Aligned, Punchy & Convincing) ── */}
        <section id="hero" className="pb-16 px-6 max-w-7xl mx-auto scroll-mt-28">
          <div className="max-w-4xl">
            {/* GitHub Stars Text Link above Headline (No Pill) */}
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mb-4 text-xs text-[#8a8f98] hover:text-[#ededef] transition-colors group cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-75 group-hover:opacity-100 transition-opacity">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Star on GitHub</span>
              <span className="text-[#52525b]">•</span>
              <span className="font-mono flex items-center gap-1 text-[#ededef]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{formatStars(starCount)}</span>
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#ededef]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>

            {/* Left-Aligned Headline - One Line */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-[-0.04em] text-[#ededef] leading-[1.1]">
              The open-source workspace for developers and teams.
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm text-[#8a8f98] leading-relaxed max-w-xl">
              Local by default, optional BYOD sync. No subscriptions, no accounts, no telemetry.
            </p>

            {/* Glass Download Action Button */}
            <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.14] hover:border-white/[0.20] backdrop-blur-xl transition-colors duration-150 shadow-sm group cursor-pointer"
              >
                <OSIcon os={os} className="w-4 h-4 text-[#ededef] group-hover:text-white" />
                <span>Download <span className="font-brand text-lg font-normal">leeflet</span> for {osName}</span>
              </a>

              {/* Other OS quick links */}
              <div className="flex items-center gap-2.5 text-xs text-[#71717a]">
                <span>or for:</span>
                {os !== 'windows' && (
                  <a href={allDownloads.windows} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
                    <WindowsIcon className="w-3.5 h-3.5" />
                    <span>Windows</span>
                  </a>
                )}
                {os !== 'mac' && (
                  <a href={allDownloads.mac} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
                    <AppleIcon className="w-3.5 h-3.5" />
                    <span>macOS</span>
                  </a>
                )}
                {os !== 'linux' && (
                  <a href={allDownloads.linux} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
                    <LinuxIcon className="w-3.5 h-3.5" />
                    <span>Linux</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── App UI Preview Card (Clean Card, No Browser Header, Scaled by 2px) ── */}
          <div className="mt-12 sm:mt-16 relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 bg-gradient-to-b from-white/[0.03] to-transparent rounded-2xl filter blur-xl pointer-events-none"
            />

            <div className="relative rounded-xl border border-white/[0.08] bg-[#0e1013] overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]">
              {/* Mobile Hero Screenshot (Square aspect for compact viewports) */}
              <img
                src="/leaf_mobile.png"
                alt="Leeflet Workspace Interface"
                className="w-full h-auto block sm:hidden select-none"
                loading="eager"
              />

              {/* Desktop Interactive Live Demo */}
              <div className="hidden sm:block w-full">
                <InteractiveAppDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ── Social Proof / Trusted By Teams Strip ── */}
        <section className="py-14 px-6 max-w-7xl mx-auto border-t border-white/[0.04]">
          <p className="text-center text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] text-[#71717a] mb-8">
            Trusted by engineers & builders across
          </p>
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-between gap-5 sm:gap-6 md:gap-7 lg:gap-4 w-full">
            
            {/* Ventrix RMS */}
            <a
              href="https://app.ventryman.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group cursor-pointer transition-opacity duration-200 opacity-75 hover:opacity-100 shrink-0 whitespace-nowrap"
            >
              <img
                src="/trustees/ventrix-logo.png"
                alt="Ventrix RMS"
                className="h-6 sm:h-7 w-auto object-contain brightness-0 invert transition-all"
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Ventrix RMS</span>
            </a>

            {/* IdeaGap */}
            <a
              href="https://ideagap.org/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group cursor-pointer transition-opacity duration-200 opacity-75 hover:opacity-100 shrink-0 whitespace-nowrap"
            >
              <img
                src="/trustees/ideagap.png"
                alt="IdeaGap"
                className="h-6 sm:h-7 w-auto object-contain brightness-0 invert transition-all"
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">IdeaGap</span>
            </a>

            {/* Supabase */}
            <a
              href="https://supabase.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group cursor-pointer transition-opacity duration-200 opacity-75 hover:opacity-100 shrink-0 whitespace-nowrap"
            >
              <img
                src="/trustees/supabase.png"
                alt="Supabase"
                className="h-5 sm:h-6 w-auto object-contain brightness-0 invert transition-all"
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Supabase</span>
            </a>

            {/* Vercel */}
            <a
              href="https://vercel.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group cursor-pointer transition-opacity duration-200 opacity-75 hover:opacity-100 shrink-0 whitespace-nowrap"
            >
              <img
                src="/trustees/logo-vercel.svg"
                alt="Vercel"
                className="w-4 h-4 sm:w-5 sm:h-5 object-contain brightness-0 invert transition-all"
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Vercel</span>
            </a>

            {/* Cursor */}
            <a
              href="https://cursor.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group cursor-pointer transition-opacity duration-200 opacity-75 hover:opacity-100 shrink-0 whitespace-nowrap"
            >
              <img
                src="/trustees/cursor.png"
                alt="Cursor"
                className="h-5 sm:h-6 w-auto object-contain brightness-0 invert transition-all"
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Cursor</span>
            </a>

            {/* Tuma */}
            <a
              href="https://tuma-nu.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group cursor-pointer transition-opacity duration-200 opacity-75 hover:opacity-100 shrink-0 whitespace-nowrap"
            >
              <img
                src="/trustees/tuma.png"
                alt="Tuma"
                className="h-5 sm:h-6 w-auto object-contain brightness-0 invert transition-all"
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Tuma</span>
            </a>

            {/* Qlaima */}
            <a
              href="https://qlaima.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group cursor-pointer transition-opacity duration-200 opacity-75 hover:opacity-100 shrink-0 whitespace-nowrap"
            >
              <img
                src="/trustees/qlaima.png"
                alt="Qlaima"
                className="h-5 sm:h-6 w-auto object-contain brightness-0 invert transition-all"
              />
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">Qlaima</span>
            </a>

          </div>
        </section>

        {/* ── Data Sovereignty & Workflow (Unified WobbleCard Bento Grid with Glass Effect) ── */}
        <section id="byod" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="max-w-3xl mb-12">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
              Architecture & Workflow
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededef]">
              Engineered for autonomy. Designed for speed.
            </h2>
            <p className="mt-3 text-sm text-[#8a8f98] leading-relaxed max-w-2xl">
              Break free from vendor lock-in, sluggish web wrappers, and mandatory cloud silos. Leeflet gives you true data ownership with local-first persistence and native performance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">

            {/* Card 1: Local-First SQLite — wide */}
            <WobbleCard containerClassName="col-span-1 lg:col-span-2">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
                    Local-First
                  </span>
                  <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest">Zero Latency</span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[#ededef]">
                  Embedded SQLite Database
                </h3>
                <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed max-w-lg">
                  Every issue, board state, and user note writes directly to an embedded SQLite database on disk. Enjoy sub-millisecond query execution, zero network overhead, and 100% offline functionality without dependencies.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#71717a] font-mono relative z-10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#a1a1aa] shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Direct filesystem access · Zero setup overhead</span>
              </div>
            </WobbleCard>

            {/* Card 2: BYOD Cloud Sync — narrow */}
            <WobbleCard containerClassName="col-span-1">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
                    BYOD
                  </span>
                  <span className="text-[10px] font-mono text-[#52525b] uppercase tracking-widest">Realtime</span>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[#ededef]">
                  Private Cloud Synchronization
                </h3>
                <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed">
                  Connect your personal Supabase instance with a single URL and Anon key. Tasks synchronize bidirectionally over encrypted WebSockets, secured by PostgreSQL Row Level Security (RLS).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-[#71717a] font-mono relative z-10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#a1a1aa] shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>End-to-end direct client connection</span>
              </div>
            </WobbleCard>

            {/* Card 3: Global Quick Capture */}
            <WobbleCard containerClassName="col-span-1">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">01</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Global Quick Capture</h3>
                <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed">
                  Trigger the native overlay from anywhere via{' '}
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white/[0.06] border border-white/[0.08] rounded text-[#d4d4d8]">
                    Alt+L
                  </kbd>. File issues, log thoughts, and assign priorities instantly without breaking context.
                </p>
              </div>
            </WobbleCard>

            {/* Card 4: Personal Focus Queue */}
            <WobbleCard containerClassName="col-span-1">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">02</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Execution-First Focus Queue</h3>
                <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed">
                  Isolate high-impact issues from the backlog into your active working queue. Cycle through tasks with rapid keyboard shortcuts for priority, status, and subtask completion.
                </p>
              </div>
            </WobbleCard>

            {/* Card 5: Desktop Widgets */}
            <WobbleCard containerClassName="col-span-1">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">03</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Detachable Desktop Widgets</h3>
                <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed">
                  Pin translucent sticky notes and floating task queues directly to your desktop. Fully independent windows with always-on-top positioning and persistent screen coordinates.
                </p>
              </div>
            </WobbleCard>

            {/* Card 6: MIT License */}
            <WobbleCard containerClassName="col-span-1">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">04</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Permissive MIT License</h3>
                <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed">
                  100% transparent and open source. Audit the codebase, customize builds, or contribute to core modules. No synthetic feature paywalls or telemetry backdoors.
                </p>
              </div>
            </WobbleCard>

            {/* Card 7: Auto-updater — wide */}
            <WobbleCard containerClassName="col-span-1 lg:col-span-2">
              <div className="relative z-10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#52525b] mb-3">05</div>
                <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">Cryptographically Signed Updates</h3>
                <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed max-w-lg">
                  Stay on the bleeding edge effortlessly. When new versions are compiled and cryptographically signed on GitHub, Leeflet delivers in-app release alerts for seamless one-click background upgrades.
                </p>
              </div>
            </WobbleCard>

          </div>

        </section>

        {/* ── Why I Built Leeflet (Manifesto / Founder Note) ── */}
        <section id="manifesto" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="p-8 sm:p-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
            
            {/* Two-column layout: text left, screenshot right */}
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
              
              {/* Left: Founder text */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98] mb-4">
                  Manifesto
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededef]">
                  Why I built <span className="font-brand text-3xl sm:text-4xl font-normal tracking-normal text-white">leeflet</span>.
                </h2>

                <div className="mt-6 space-y-4 text-sm text-[#8a8f98] leading-relaxed">
                  <p>
                    Modern project trackers look polished, but almost all of them trap your tasks inside closed proprietary clouds and charge steep per-seat monthly subscriptions for basic CRUD operations. You cannot simply inspect a local database file on disk, work offline without friction, or capture thoughts without logging into an account.
                  </p>
                  <p>
                    I wanted something grounded in data sovereignty: a native desktop app that stores everything in an embedded SQLite database on your SSD, functions forever without an internet connection, and gives you a zero-markup BYOD flow to sync with your own Supabase project when your team needs real-time collaboration.
                  </p>
                  <p>
                    Leeflet is built for engineers and creators who value privacy, keyboard-first velocity, and owning their data. It is 100% free and open source forever under the MIT license.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/author_avatar.jpg"
                      alt="Christlieb Dela"
                      className="w-10 h-10 rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-300 border border-white/[0.16] shadow-sm"
                    />
                    <div>
                      <div className="text-xs font-medium text-[#ededef]">Christlieb Dela</div>
                      <div className="text-[11px] text-[#71717a]">Creator of Leeflet</div>
                    </div>
                  </div>
                  
                  <a
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#8a8f98] hover:text-[#ededef] transition-colors"
                  >
                    <span>View on GitHub</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Right: Mascot logo */}
              <div className="hidden lg:flex w-[300px] shrink-0 relative items-end justify-center self-stretch">
                <div className="absolute inset-0 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />
                <img
                  src="/logo_alpha.png"
                  alt="Leeflet mascot"
                  className="relative h-full w-auto max-h-[420px] opacity-[0.08] mix-blend-luminosity select-none pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }}
                  draggable={false}
                />
              </div>

            </div>
          </div>
        </section>

        {/* ── Pricing Section (100% Free & Open Source Satirical / Clean Pricing) ── */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="max-w-3xl mb-12">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
              Pricing
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededef]">
              Zero cost. Zero subscriptions.
            </h2>
            <p className="mt-2 text-sm text-[#8a8f98] leading-relaxed max-w-xl">
              No per-seat SaaS taxes, no artificial feature gates, and no credit cards required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Plan 1: Solo Developer */}
            <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between hover:border-white/[0.14] transition-colors">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#a1a1aa] mb-3">
                  Solo Developer
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-[#ededef]">$0</span>
                  <span className="text-xs text-[#71717a] font-mono">/ forever</span>
                </div>
                <p className="mt-3 text-xs text-[#8a8f98] leading-relaxed">
                  Local-first issue tracking on your machine with instant startup and offline storage.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-[#8a8f98] border-t border-white/[0.06] pt-6">
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Unlimited tasks & queues</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Embedded SQLite database</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Global Quick Capture shortcut</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Companion desktop widgets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Zero telemetry or analytics</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.10] text-[#ededef] hover:text-white border border-white/[0.10] hover:border-white/[0.16] backdrop-blur-xl transition-colors duration-150 shadow-sm cursor-pointer"
                >
                  <OSIcon os={os} className="w-3.5 h-3.5" />
                  <span>Download Free for {osName}</span>
                </a>
              </div>
            </div>

            {/* Plan 2: Engineering Team (BYOD) */}
            <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between hover:border-white/[0.14] transition-colors">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#a1a1aa] mb-3">
                  Team · BYOD Sync
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-[#ededef]">$0</span>
                  <span className="text-xs text-[#71717a] font-mono">/ forever + your Supabase</span>
                </div>
                <p className="mt-3 text-xs text-[#8a8f98] leading-relaxed">
                  Real-time collaborative cloud sync powered by your own private Supabase instance.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-[#8a8f98] border-t border-white/[0.06] pt-6">
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[#ededef]">Everything in Solo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Live WebSocket multi-client sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Row Level Security (RLS) policies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Unlimited team members & seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Zero intermediary server access</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a
                  href="/docs#byod-supabase"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.14] hover:border-white/[0.20] backdrop-blur-xl transition-colors duration-150 shadow-sm cursor-pointer"
                >
                  View BYOD Setup
                </a>
              </div>
            </div>

            {/* Plan 3: Open Source / Enterprise */}
            <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between hover:border-white/[0.14] transition-colors">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#a1a1aa] mb-3">
                  Self-Hosted / Fork
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-[#ededef]">$0</span>
                  <span className="text-xs text-[#71717a] font-mono">/ MIT License</span>
                </div>
                <p className="mt-3 text-xs text-[#8a8f98] leading-relaxed">
                  Inspect every line of code, fork the repo, customize builds, and self-host on your own infrastructure.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-[#8a8f98] border-t border-white/[0.06] pt-6">
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>100% open source code on GitHub</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Permissive MIT License</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Custom Tauri & React builds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Self-hosted PostgreSQL backend</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ededef] shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Zero vendor lock-in forever</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.10] text-[#ededef] hover:text-white border border-white/[0.10] hover:border-white/[0.16] backdrop-blur-xl transition-colors duration-150 shadow-sm cursor-pointer"
                >
                  View Source Code
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Section (2-Column Grid with Glassmorphic Accordion & Support Card) ── */}
        <section id="faq" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="mb-10">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
              FAQ
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#ededef]">
              Answers to common questions.
            </h2>
            <p className="mt-2 text-sm text-[#8a8f98] leading-relaxed">
              Everything you need to know about licensing, data ownership, and desktop capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: FAQ Accordion List */}
            <div className="lg:col-span-7 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl px-6 py-2">
              <FaqItem
                question="Who maintains the software?"
                isOpen={openFaqIndex === 0}
                onToggle={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                answer={
                  <>
                    <p>
                      Mostly me – <a href="https://christliebdela.vercel.app/" target="_blank" rel="noreferrer" className="text-white underline underline-offset-2 hover:text-[#ededef]">Christlieb Dela</a>. Leeflet started as a side project because I wanted a cleaner, faster task workspace that gives you true ownership over your data. It's grown from there.
                    </p>
                    <p>
                      Contributions, bug reports, and feature requests are welcome on <a href="https://github.com/christliebdela/leeflet" target="_blank" rel="noreferrer" className="text-white underline underline-offset-2 hover:text-[#ededef]">GitHub</a>. For anything else you can reach me at <a href="mailto:info@terax.app" className="text-white underline underline-offset-2 hover:text-[#ededef]">info@terax.app</a>.
                    </p>
                  </>
                }
              />
              <FaqItem
                question="Is Leeflet completely free, or are there hidden paid tiers?"
                isOpen={openFaqIndex === 1}
                onToggle={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                answer="100% free with zero paywalls. Leeflet is released under the permissive MIT license. Every feature, from offline SQLite persistence and desktop widgets to real-time BYOD sync is unlocked for everyone."
              />
              <FaqItem
                question="Do I ever have to create an account?"
                isOpen={openFaqIndex === 2}
                onToggle={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                answer="No. You never need to sign up, enter an email, or generate login credentials. You simply download the binary, launch it, and your workspace is live immediately."
              />
              <FaqItem
                question="Does any task or note data ever leave my computer?"
                isOpen={openFaqIndex === 3}
                onToggle={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
                answer="Never by default. Everything remains in your local SQLite database on disk. If you choose to enable cloud sync, your data communicates directly with your own private Supabase instance over encrypted WebSockets."
              />
              <FaqItem
                question="How does the private Supabase integration work?"
                isOpen={openFaqIndex === 4}
                onToggle={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
                answer="Enter your personal Supabase project URL and Anon key in Settings. Your tasks sync in real time using PostgreSQL with Row Level Security. We operate zero intermediary servers and never touch your credentials."
              />
              <FaqItem
                question="Which desktop platforms are supported?"
                isOpen={openFaqIndex === 5}
                onToggle={() => setOpenFaqIndex(openFaqIndex === 5 ? null : 5)}
                answer="Leeflet runs natively on Windows, macOS (Intel & Apple Silicon), and Linux with lightweight installers and background automatic updates."
              />
              <FaqItem
                question="Where can I report bugs or suggest new features?"
                isOpen={openFaqIndex === 6}
                onToggle={() => setOpenFaqIndex(openFaqIndex === 6 ? null : 6)}
                answer="All development happens openly on GitHub. You can open issues, submit pull requests, or discuss upcoming feature roadmaps in our public repository."
              />
            </div>

            {/* Right Column: Community & Support Glass Cards */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="h-full p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl hover:border-white/[0.14] transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
                      Community & Support
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold tracking-tight text-[#ededef]">
                    Have a question not answered here?
                  </h3>

                  <p className="mt-2.5 text-sm text-[#8a8f98] leading-relaxed">
                    Leeflet is developed in public. Open an issue, join discussions, or submit feature requests directly on our GitHub repository.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col gap-2.5">
                  <a
                    href={`${GITHUB_REPO}/issues`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.10] text-[#ededef] hover:text-white border border-white/[0.10] hover:border-white/[0.16] backdrop-blur-xl transition-colors duration-150 shadow-sm cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span>Ask on GitHub Issues</span>
                  </a>

                  <a
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs text-[#8a8f98] hover:text-[#ededef] hover:bg-white/[0.04] transition-colors"
                  >
                    <span>Browse Source Code</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ── Download Strip (Glassmorphic CTA Card & Button) ── */}
        <section id="download" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.06] scroll-mt-16">
          <div className="p-8 sm:p-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8a8f98]">
                Get Started
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#ededef]">
                Download <span className="font-brand text-3xl font-normal tracking-normal text-white">leeflet</span>
              </h3>
              <p className="mt-2 text-sm text-[#8a8f98] max-w-lg leading-relaxed">
                Free, open source, and lightweight under 15MB. Available for Windows, macOS, and Linux with automatic background updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.14] hover:border-white/[0.20] backdrop-blur-xl transition-colors duration-150 shadow-sm cursor-pointer"
              >
                <OSIcon os={os} className="w-4 h-4 text-white" />
                <span>Download <span className="font-brand text-lg font-normal">leeflet</span> for {osName}</span>
              </a>

              <div className="flex items-center gap-2 text-xs text-[#71717a] sm:pl-2">
                {os !== 'windows' && (
                  <a href={allDownloads.windows} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#a1a1aa] hover:text-white border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-150">
                    <WindowsIcon className="w-4 h-4" />
                  </a>
                )}
                {os !== 'mac' && (
                  <a href={allDownloads.mac} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#a1a1aa] hover:text-white border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-150">
                    <AppleIcon className="w-4 h-4" />
                  </a>
                )}
                {os !== 'linux' && (
                  <a href={allDownloads.linux} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#a1a1aa] hover:text-white border border-white/[0.08] hover:border-white/[0.14] transition-colors duration-150">
                    <LinuxIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Multi-Column Structured Footer ── */}
      <footer className="border-t border-white/[0.06] pt-16 pb-12 px-6 max-w-7xl mx-auto text-xs">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          <div className="col-span-2 space-y-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-hidden transition-transform active:scale-[0.98]"
              aria-label="Scroll to top"
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

          {/* Col 2: Product */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#a1a1aa] font-medium">Product</div>
            <ul className="space-y-2 text-[#8a8f98]">
              <li>
                <a
                  href="#byod"
                  onClick={(e) => { e.preventDefault(); scrollTo('byod'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => { e.preventDefault(); scrollTo('pricing'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#manifesto"
                  onClick={(e) => { e.preventDefault(); scrollTo('manifesto'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Manifesto
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => { e.preventDefault(); scrollTo('faq'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a href="/docs" className="hover:text-white transition-colors">
                  Docs
                </a>
              </li>
              {/* <li>
                <a href="/changelog" className="hover:text-white transition-colors">
                  Changelog
                </a>
              </li> */}
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
    </LandingBackground>
  );
};
