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
import { Trash2, X } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastContainer } from './components/ui/ToastContainer';
import { fetchRandomDevJoke, warmJokePool } from './utils/jokes';
import { UpdateModal } from './components/UpdateModal';
import { useUpdaterStore } from './store/useUpdaterStore';

export const App: React.FC = () => {
  const {
    items,
    projects,
    viewMode,
    selectedItemId,
    itemToDelete,
    setItemToDelete,
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
    toggleSidebar,
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

    // Silent background update check after startup
    const timer = setTimeout(() => {
      const { autoCheckEnabled, checkForUpdates } = useUpdaterStore.getState();
      if (autoCheckEnabled) {
        checkForUpdates(true).catch(() => {});
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [initialize]);

  // Web / Browser URL hash invite link listener
  useEffect(() => {
    const handleHashJoin = async () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (hash && (hash.includes('join=') || hash.includes('data='))) {
        try {
          const raw = hash.includes('join=') ? hash.split('join=')[1] : hash.split('data=')[1];
          const cleanRaw = raw.split('&')[0];
          const jsonStr = decodeURIComponent(escape(atob(cleanRaw)));
          const payload = JSON.parse(jsonStr);

          if (payload.workspaceName || payload.wsName) {
            const teamName = payload.workspaceName || payload.wsName;
            const targetWorkspaceId = payload.workspaceId || payload.wsId;
            const supabaseUrl = payload.supabaseUrl || payload.url;
            const supabaseKey = payload.supabaseAnonKey || payload.key;
            const userRole = payload.role || 'member';

            const defaultPath = `leeflet://workspaces/team-${Date.now()}`;
            const newWs = await useLeafStore.getState().createWorkspace(teamName, defaultPath, targetWorkspaceId);
            if (newWs && newWs.id) {
              if (supabaseUrl && supabaseKey) {
                localStorage.setItem(`leeflet_supabase_url_${newWs.id}`, supabaseUrl);
                localStorage.setItem(`leeflet_supabase_anon_key_${newWs.id}`, supabaseKey);
                localStorage.setItem(`leeflet_sync_mode_${newWs.id}`, 'cloud');
              }
              localStorage.setItem(`leeflet_workspace_role_${newWs.id}`, userRole);
              localStorage.setItem(`leeflet_is_joined_workspace_${newWs.id}`, 'true');

              let myProfileName = '';
              let myProfileEmail = '';
              let myProfileMascot = '';
              let myProfileAvatarUrl = '';
              try {
                const pRaw = localStorage.getItem('leeflet_user_profile_data') || localStorage.getItem('leaf_user_profile_data');
                if (pRaw) {
                  const p = JSON.parse(pRaw);
                  if (p.fullName && p.fullName !== 'Alex' && p.fullName !== 'Alex Rivera' && p.fullName !== 'User') {
                    myProfileName = p.fullName;
                  }
                  if (p.email) myProfileEmail = p.email;
                  if (p.avatarMascot) myProfileMascot = p.avatarMascot;
                  if (p.avatarUrl) myProfileAvatarUrl = p.avatarUrl;
                }
              } catch {}

              if (!myProfileName) {
                myProfileName = payload.invitedName || (payload.invitedEmail ? payload.invitedEmail.split('@')[0] : 'Team Member');
              }
              if (!myProfileEmail) {
                myProfileEmail = payload.invitedEmail || '';
              }

              // Update local profile with invited name if fresh
              try {
                const pRaw = localStorage.getItem('leeflet_user_profile_data');
                if (!pRaw || pRaw.includes('Alex Rivera') || pRaw.includes('"fullName":""')) {
                  localStorage.setItem('leeflet_user_profile_data', JSON.stringify({
                    fullName: myProfileName,
                    username: myProfileName.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    email: myProfileEmail,
                    title: userRole.charAt(0).toUpperCase() + userRole.slice(1),
                    avatarMascot: myProfileMascot || 'bot-spark',
                    avatarColor: 'bg-blue-600 dark:bg-blue-500',
                  }));
                }
              } catch {}

              const { OWNER_MEMBER_UUID, saveStoredTeamMembers } = await import('./utils/team');
              const { pushTeamMemberToCloud, pullTeamMembersFromCloud, deleteWorkspaceInviteFromCloud } = await import('./services/cloudSync');

              const adminMember = {
                id: OWNER_MEMBER_UUID,
                name: payload.invitedBy || 'Workspace Admin',
                email: '',
                role: 'Admin' as const,
                status: 'active' as const,
                joinedAt: 'Workspace Creator',
                avatarColor: 'bg-violet-600 dark:bg-violet-500',
              };

              const selfMember = {
                id: crypto.randomUUID(),
                name: myProfileName,
                email: myProfileEmail,
                role: (userRole.charAt(0).toUpperCase() + userRole.slice(1)) as any,
                status: 'active' as const,
                joinedAt: 'Joined just now',
                avatarColor: 'bg-blue-600 dark:bg-blue-500',
                avatarMascot: myProfileMascot || undefined,
                avatarUrl: myProfileAvatarUrl || undefined,
              };

              saveStoredTeamMembers([adminMember, selfMember], newWs.id);

              if (supabaseUrl && supabaseKey) {
                await pushTeamMemberToCloud(newWs.id, selfMember);
                if (myProfileEmail) {
                  await deleteWorkspaceInviteFromCloud(newWs.id, myProfileEmail);
                }
                const remoteMembers = await pullTeamMembersFromCloud(newWs.id);
                if (remoteMembers.length > 0) {
                  saveStoredTeamMembers(remoteMembers, newWs.id);
                }
              }

              window.location.hash = '';
              await useLeafStore.getState().initialize('joining team workspace...');
            }
          }
        } catch (err) {
          console.warn('Could not parse web invite hash:', err);
        }
      }
    };

    handleHashJoin();
    window.addEventListener('hashchange', handleHashJoin);
    return () => window.removeEventListener('hashchange', handleHashJoin);
  }, []);

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

      // 1. Quick capture shortcut (Alt+L or Ctrl+Shift+L)
      if (
        (e.altKey && (e.key === 'l' || e.key === 'L')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'l' || e.key === 'L'))
      ) {
        e.preventDefault();
        openQuickCaptureWindow();
        return;
      }

      // 2. Open Settings: Ctrl + , / Cmd + ,
      if ((e.ctrlKey || e.metaKey) && (e.key === ',' || e.key === '<')) {
        e.preventDefault();
        setViewMode({ type: 'settings' });
        return;
      }

      // 3. New Item In-App: 'n', 'N', 'c', 'C' or 'Ctrl+N' (when not in text input)
      if (!isInput && (e.key === 'n' || e.key === 'N' || e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
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

      // 4b. Toggle Sidebar: Ctrl + B / Cmd + B
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
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
        const target = items.find((i) => i.id === selectedItemId);
        if (target) {
          const confirmPref = localStorage.getItem('leaf_pref_confirm_delete') !== 'false';
          if (!confirmPref) {
            deleteItem(selectedItemId);
          } else {
            setItemToDelete(target);
          }
        }
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
    toggleSidebar,
  ]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#f8f9fa] dark:bg-[#0f0f11] flex items-center justify-center animate-in fade-in duration-200 select-none">
        <div className="flex flex-col items-center gap-2.5">
          <img
            src="/leaf_logo.png"
            alt="leeflet"
            className="w-12 h-12 object-contain animate-pulse invert dark:invert-0"
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
            className="w-14 h-14 object-contain animate-pulse invert dark:invert-0"
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

        {/* Task Delete Confirmation Modal */}
        {itemToDelete && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setItemToDelete(null);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          >
            <div
              onKeyDown={(e) => {
                if (e.key === 'Escape') setItemToDelete(null);
                if (e.key === 'Enter') {
                  e.preventDefault();
                  deleteItem(itemToDelete.id);
                  setItemToDelete(null);
                }
              }}
              className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                  <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                    Delete Task
                  </h2>
                </div>
                <button
                  onClick={() => setItemToDelete(null)}
                  className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[#111827] dark:text-white">"{itemToDelete.title}"</span>? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
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

        {/* Global In-App Toast Notifications */}
        <ToastContainer />

        {/* Global App Updater Modal */}
        <UpdateModal />
      </div>
    </TooltipProvider>
  );
};

export default App;
