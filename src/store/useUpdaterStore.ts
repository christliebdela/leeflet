import { create } from 'zustand';
import { checkForUpdate, installUpdate, relaunchApp, UpdateInfo } from '../services/updater';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error';

interface UpdaterState {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion: string | null;
  releaseDate: string | null;
  releaseNotes: string | null;
  downloadProgress: { downloaded: number; total: number; percent: number };
  error: string | null;
  isModalOpen: boolean;
  lastCheckedAt: string | null;
  autoCheckEnabled: boolean;
  rawUpdate: any | null;

  // Actions
  setModalOpen: (isOpen: boolean) => void;
  setAutoCheckEnabled: (enabled: boolean) => void;
  checkForUpdates: (silent?: boolean) => Promise<UpdateInfo | null>;
  startDownloadAndInstall: () => Promise<boolean>;
  restartAndApply: () => Promise<void>;
  simulateUpdateForTesting: () => void;
}

const getStoredAutoCheck = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('leaf_auto_check_updates') !== 'false';
};

const getStoredLastChecked = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('leaf_last_checked_update');
};

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  status: 'idle',
  currentVersion: '0.6.0',
  availableVersion: null,
  releaseDate: null,
  releaseNotes: null,
  downloadProgress: { downloaded: 0, total: 0, percent: 0 },
  error: null,
  isModalOpen: false,
  lastCheckedAt: getStoredLastChecked(),
  autoCheckEnabled: getStoredAutoCheck(),
  rawUpdate: null,

  setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),

  setAutoCheckEnabled: (enabled) => {
    localStorage.setItem('leaf_auto_check_updates', String(enabled));
    set({ autoCheckEnabled: enabled });
  },

  checkForUpdates: async (silent = false) => {
    set({ status: 'checking', error: null });
    const nowIso = new Date().toISOString();
    localStorage.setItem('leaf_last_checked_update', nowIso);
    set({ lastCheckedAt: nowIso });

    try {
      const result = await checkForUpdate();
      if (result && result.available) {
        set({
          status: 'available',
          currentVersion: result.currentVersion,
          availableVersion: result.version,
          releaseDate: result.date || null,
          releaseNotes: result.body || 'A new version of Leeflet is ready for download with improvements and fixes.',
          rawUpdate: result.rawUpdate,
          isModalOpen: !silent, // Automatically open modal on manual check, or just show badge on silent background check
        });
        return result;
      } else {
        set({
          status: 'up-to-date',
          currentVersion: result?.currentVersion || get().currentVersion,
          availableVersion: null,
          rawUpdate: null,
        });
        return result;
      }
    } catch (err: any) {
      console.warn('Update check error:', err);
      const errMsg = err?.message || 'Unable to check for updates.';
      set({ status: 'error', error: errMsg });
      return null;
    }
  },

  startDownloadAndInstall: async () => {
    const { rawUpdate } = get();
    set({ status: 'downloading', downloadProgress: { downloaded: 0, total: 0, percent: 0 }, error: null });

    try {
      const success = await installUpdate(rawUpdate, (downloaded: number, total: number) => {
        const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;
        set({ downloadProgress: { downloaded, total, percent } });
      });

      if (success) {
        set({ status: 'downloaded', downloadProgress: { downloaded: 100, total: 100, percent: 100 } });
        return true;
      } else {
        set({ status: 'error', error: 'Failed to download update package.' });
        return false;
      }
    } catch (err: any) {
      console.error('Install update failed:', err);
      set({ status: 'error', error: err?.message || 'Error downloading update.' });
      return false;
    }
  },

  restartAndApply: async () => {
    await relaunchApp();
  },

  simulateUpdateForTesting: () => {
    set({
      status: 'available',
      currentVersion: '0.6.0',
      availableVersion: '0.7.0',
      releaseDate: new Date().toLocaleDateString(),
      releaseNotes: `### What's New in v0.7.0
- **Cross-Workspace Database Inheritance**: Seamless global database credentials across all workspaces.
- **Team Collaboration Guards**: Clear prerequisites preventing broken invites without cloud connectivity.
- **Auto-Updater Stability**: Complete bundle updater artifacts with zero-friction updates.`,
      isModalOpen: true,
      error: null,
    });
  },
}));

// Automatically detect runtime native application version from Tauri
if (typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__)) {
  import('@tauri-apps/api/app')
    .then(({ getVersion }) => {
      getVersion()
        .then((v) => {
          if (v) useUpdaterStore.setState({ currentVersion: v });
        })
        .catch(() => {});
    })
    .catch(() => {});
}

