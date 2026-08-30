import React, { useEffect } from 'react';
import { useLeafStore } from './store/useLeafStore';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { ItemListView } from './components/ItemListView';
import { MyQueueView } from './components/MyQueueView';
import { TeamView } from './components/TeamView';
import { ProfileView } from './components/ProfileView';
import { ItemDetailPane } from './components/ItemDetailPane';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { StickyNoteView } from './components/StickyNoteView';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsView } from './components/SettingsView';
import { ProjectModal } from './components/ProjectModal';
import { openQuickCaptureWindow, enterMiniMode } from './utils/window';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastContainer } from './components/ui/ToastContainer';
import { fetchRandomDevJoke, warmJokePool } from './utils/jokes';

export const App: React.FC = () => {
  const {
    projects,
    viewMode,
    selectedItemId,
    setSelectedItemId,
    setViewMode,
    setSelectedProjectId,
    deleteItem,
    initialize,
    isLoading,
    loadingMessage,
    isStandby,
    standbyJokesEnabled,
    setStandby,
    setQuickCaptureOpen,
  } = useLeafStore();

  // Joke navigation state (history so ← goes back, → fetches next)
  const [jokeHistory, setJokeHistory] = React.useState<string[]>([]);
  const [jokeHistoryIndex, setJokeHistoryIndex] = React.useState(0);
  const standbyJoke = jokeHistory[jokeHistoryIndex] ?? null;

  // Load first joke when entering Standby
  useEffect(() => {
    if (isStandby && standbyJokesEnabled) {
      let isCurrent = true;
      fetchRandomDevJoke().then((joke) => {
        if (isCurrent) {
          setJokeHistory([joke]);
          setJokeHistoryIndex(0);
        }
      });
      return () => { isCurrent = false; };
    } else {
      setJokeHistory([]);
      setJokeHistoryIndex(0);
    }
  }, [isStandby, standbyJokesEnabled]);

  // One-time workspace initialization on mount
  useEffect(() => {
    initialize();
    // Pre-build joke pool in background so standby is instant
    warmJokePool();
  }, [initialize]);

  // Global & In-App Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Standby navigation
      if (isStandby) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          setStandby(false);
        } else if (standbyJokesEnabled && (e.key === '>' || e.key === 'ArrowRight')) {
          e.preventDefault();
          // Advance: if at end of history fetch a new one, else step forward
          setJokeHistory((prev) => {
            const atEnd = jokeHistoryIndex >= prev.length - 1;
            if (atEnd) {
              fetchRandomDevJoke().then((joke) => {
                setJokeHistory((h) => [...h, joke]);
                setJokeHistoryIndex((i) => i + 1);
              });
              return prev; // updated async
            }
            setJokeHistoryIndex((i) => i + 1);
            return prev;
          });
        } else if (standbyJokesEnabled && (e.key === '<' || e.key === 'ArrowLeft')) {
          e.preventDefault();
          setJokeHistoryIndex((i) => Math.max(0, i - 1));
        }
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        Boolean(activeEl) &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName || '') ||
          activeEl?.isContentEditable ||
          Boolean(activeEl?.closest('[contenteditable="true"]')));

      // Standby / Privacy Mask toggle (Z key when not in an input)
      if (!isInput && (e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setStandby(true);
        return;
      }

      // 1. Quick capture shortcut (Alt+L or Alt+N)
      if (
        (e.altKey && (e.key === 'l' || e.key === 'L' || e.key === 'n' || e.key === 'N')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'l' || e.key === 'L' || e.key === 'n' || e.key === 'N'))
      ) {
        e.preventDefault();
        openQuickCaptureWindow();
        return;
      }

      // 2. Open Settings: 's' / 'S' (when not typing in input) or Ctrl + ,
      if (!isInput && (e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setViewMode({ type: 'settings' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === ',' || e.key === '<')) {
        e.preventDefault();
        setViewMode({ type: 'settings' });
        return;
      }

      // 3. New Item In-App: 'n', 'N' or 'Ctrl+N' (when not in text input)
      if (!isInput && (e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setQuickCaptureOpen(true);
        return;
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setQuickCaptureOpen(true);
        return;
      }

      // 4. Navigation Shortcuts (Ctrl+I, Ctrl+Q, Ctrl+Shift+A)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setViewMode({ type: 'inbox' });
        setSelectedItemId(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        setViewMode({ type: 'my_queue' });
        setSelectedItemId(null);
        return;
      }

      // 5. Mini Mode: 'm' / 'M' (when not typing) or Ctrl+M
      if (!isInput && (e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        enterMiniMode();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        enterMiniMode();
        return;
      }

      // 6. Number keys 1-9 to switch between projects when not typing
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= projects.length) {
          e.preventDefault();
          const targetProj = projects[num - 1];
          if (targetProj) {
            setSelectedProjectId(targetProj.id);
          }
          return;
        }
      }

      // 6. Delete selected item when card is focused and not editing text
      if (!isInput && selectedItemId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        deleteItem(selectedItemId);
        return;
      }

      // 7. Escape: Clear selection
      if (e.key === 'Escape') {
        if (selectedItemId) {
          setSelectedItemId(null);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    projects,
    selectedItemId,
    setSelectedItemId,
    setViewMode,
    setSelectedProjectId,
    deleteItem,
    setQuickCaptureOpen,
    isStandby,
    setStandby,
  ]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#f8f9fa] dark:bg-[#0f0f11] flex items-center justify-center animate-in fade-in duration-200 select-none">
        <div className="flex flex-col items-center gap-2.5">
          <img
            src="/leaf_logo.png"
            alt="leeflet"
            className="w-12 h-12 object-contain animate-pulse"
          />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-brand text-3xl font-normal text-[#111827] dark:text-[#f4f4f5] tracking-tight">
              leeflet
            </span>
            <span className="text-[11px] font-mono text-[#9ca3af] dark:text-[#71717a]">
              {loadingMessage || 'loading workspace...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isStandby) {
    return (
      <div className="h-screen w-screen bg-[#f8f9fa] dark:bg-[#0f0f11] flex flex-col items-center justify-center animate-in fade-in duration-200 select-none relative px-6">
        <div className="flex flex-col items-center gap-2.5">
          <img
            src="/logo_alpha.png"
            alt="leeflet"
            className="w-14 h-14 object-contain animate-pulse"
          />
          <span className="font-brand text-4xl font-normal text-[#111827] dark:text-[#f4f4f5] tracking-tight">
            leeflet
          </span>
        </div>

        {/* Bottom Subtext */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1 text-center pointer-events-none max-w-lg px-4">
          <span className="text-[11px] font-mono text-[#9ca3af] dark:text-[#71717a] tracking-wide leading-snug">
            {standbyJokesEnabled && standbyJoke ? standbyJoke : 'taking a coffee break...'}
          </span>
          {(!standbyJokesEnabled || !standbyJoke) && (
            <span className="text-[10px] font-mono text-[#9ca3af] dark:text-[#71717a]">
              press z to resume
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-screen w-screen flex bg-[#f8f9fa] dark:bg-[#0f0f11] text-[#111827] dark:text-[#f4f4f5] overflow-hidden select-none">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative">
          {/* Fixed Unified Header */}
          <HeaderBar />

          {/* Dynamic Body Content & Detail / Settings Pane */}
          <main className="flex-1 min-h-0 flex overflow-hidden relative">
            <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
              {viewMode.type === 'my_queue' ? (
                <MyQueueView />
              ) : viewMode.type === 'team' ? (
                <TeamView />
              ) : viewMode.type === 'profile' ? (
                <ProfileView />
              ) : viewMode.type === 'settings' ? (
                <SettingsView />
              ) : (
                <ItemListView />
              )}
            </div>

            {/* Item Detail Split Slide-In Pane */}
            <ItemDetailPane />
          </main>
        </div>

        {/* Modals and Overlays */}
        <QuickCaptureModal />
        <StickyNoteView />
        <OnboardingModal />
        <ProjectModal />

        {/* Global In-App Toast Notifications */}
        <ToastContainer />
      </div>
    </TooltipProvider>
  );
};

export default App;
