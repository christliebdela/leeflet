import React, { useEffect } from 'react';
import { useLeafStore } from '../../store/useLeafStore';
import { Sidebar } from '../Sidebar';
import { HeaderBar } from '../HeaderBar';
import { ItemListView } from '../ItemListView';
import { MyQueueView } from '../MyQueueView';
import { TeamView } from '../TeamView';
import { ProfileView } from '../ProfileView';
import { SettingsView } from '../SettingsView';
import { ItemDetailPane } from '../ItemDetailPane';
import { QuickCaptureModal } from '../QuickCaptureModal';
import { ProjectModal } from '../ProjectModal';
import { TooltipProvider } from '../ui/tooltip';
import { ToastContainer } from '../ui/ToastContainer';
import { Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const InteractiveAppDemo: React.FC = () => {
  const {
    isDemoMode,
    enterDemoMode,
    theme,
    colorTheme,
    itemViewLayout,
    viewMode,
    selectedItemId,
    setSelectedItemId,
    isQuickCaptureOpen,
    isProjectModalOpen,
    itemToDelete,
    setItemToDelete,
    deleteItem,
    isStandby,
    setStandby,
  } = useLeafStore();

  // Initialize demo workspace on mount
  useEffect(() => {
    enterDemoMode();
  }, [enterDemoMode]);

  // Support 'z' / 'Z' shortcut to toggle coffee break
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'z' || e.key === 'Z') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setStandby(!useLeafStore.getState().isStandby);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setStandby]);

  if (!isDemoMode) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "w-full h-[600px] sm:h-[660px] lg:h-[720px] bg-[#e8e9eb] dark:bg-[var(--theme-bg-shell,#121214)] flex flex-col overflow-hidden text-[#111827] dark:text-[#f4f4f5] select-none font-sans text-xs transition-colors relative",
          theme === 'dark' ? 'dark' : ''
        )}
        data-color-theme={colorTheme}
      >
        {isStandby ? (
          <div
            onClick={() => setStandby(false)}
            className="w-full h-full flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-[#0f0f11] animate-in fade-in duration-200 cursor-pointer relative px-6 select-none"
          >
            <div className="flex flex-col items-center gap-2.5 pointer-events-none">
              <img
                src="/logo_alpha.png"
                alt="leeflet"
                className="w-12 h-12 object-contain animate-pulse invert dark:invert-0"
              />
              <span className="font-brand text-3xl font-normal text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                leeflet
              </span>
            </div>

            <div className="absolute bottom-8 flex flex-col items-center gap-1 text-center pointer-events-none max-w-lg px-4">
              <span className="text-[11px] font-mono text-[#9ca3af] dark:text-[#71717a] tracking-wide leading-snug">
                taking a coffee break...
              </span>
              <span className="text-[10px] font-mono text-[#9ca3af] dark:text-[#71717a]">
                click anywhere or press z to resume
              </span>
            </div>
          </div>
        ) : (
          /* ── Real Leeflet App Shell ── */
          <div className="flex-1 min-h-0 flex bg-[#e8e9eb] dark:bg-[var(--theme-bg-shell,#121214)] text-[#111827] dark:text-[#f4f4f5] overflow-hidden relative py-2 pr-2 transition-colors">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Floating Inset Workspace Card */}
          <div className="flex-1 h-full flex flex-col min-w-0 relative z-10 -ml-4 bg-[#f8f9fa] dark:bg-[var(--theme-bg-app,#0f0f11)] rounded-[10px] border border-[#e5e7eb] dark:border-[var(--theme-border,#27272a)] shadow-sm overflow-hidden transition-colors">
            {/* Unified HeaderBar */}
            <div className="relative shrink-0">
              <HeaderBar />
              {Boolean(selectedItemId) && (itemViewLayout === 'board' || itemViewLayout === 'cards') && (
                <div
                  onClick={() => setSelectedItemId(null)}
                  className="absolute inset-0 right-[360px] bg-black/10 backdrop-blur-[2px] z-20 transition-all duration-200 cursor-pointer animate-in fade-in"
                />
              )}
            </div>

            {/* Dynamic Body Content */}
            <main className="flex-1 min-h-0 flex overflow-hidden relative">
              <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative">
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

                {Boolean(selectedItemId) && (itemViewLayout === 'board' || itemViewLayout === 'cards') && (
                  <div
                    onClick={() => setSelectedItemId(null)}
                    className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-20 transition-all duration-200 cursor-pointer animate-in fade-in"
                  />
                )}
              </div>

              {/* Item Detail Split Slide-In Pane */}
              {itemViewLayout === 'board' || itemViewLayout === 'cards' ? (
                <div className="absolute right-0 top-0 bottom-0 z-30 flex pointer-events-none [&>*]:pointer-events-auto">
                  <ItemDetailPane />
                </div>
              ) : (
                <ItemDetailPane />
              )}
            </main>
          </div>
        </div>
      )}

        {/* Global Modals in Demo */}
        {isQuickCaptureOpen && <QuickCaptureModal />}
        {isProjectModalOpen && <ProjectModal />}

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100"
            onClick={() => setItemToDelete(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#18181b] rounded-[8px] border border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5">
                <div className="flex items-center gap-2 text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <h2 className="text-xs font-bold text-[#f4f4f5]">Delete Task</h2>
                </div>
                <button
                  onClick={() => setItemToDelete(null)}
                  className="p-1 rounded-[4px] hover:bg-[#27272a] text-[#a1a1aa]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-white">"{itemToDelete.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-3 py-1.5 border border-[#27272a] text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#27272a]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => {
                    deleteItem(itemToDelete.id);
                    setItemToDelete(null);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] text-xs font-semibold shadow-subtle transition-all"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Demo Toast Container */}
        <ToastContainer />
      </div>
    </TooltipProvider>
  );
};
