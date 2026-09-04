export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
  rawUpdate?: any;
}

const isTauriApp = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
};

export async function getAppVersion(): Promise<string> {
  if (isTauriApp()) {
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      const v = await getVersion();
      if (v) return v;
    } catch {
      // fallback
    }
  }
  return '0.6.0';
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const currentAppVersion = await getAppVersion();

  if (!isTauriApp()) {
    // In web browser / dev preview without native backend
    return {
      available: false,
      currentVersion: currentAppVersion,
      version: currentAppVersion,
    };
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();

    if (update) {
      return {
        available: true,
        currentVersion: update.currentVersion || currentAppVersion,
        version: update.version,
        date: update.date,
        body: update.body,
        rawUpdate: update,
      };
    }

    return {
      available: false,
      currentVersion: currentAppVersion,
      version: currentAppVersion,
    };
  } catch (err: any) {
    console.warn('Tauri updater check error (e.g. no remote release manifest published yet):', err);
    // If endpoint is not found or in dev mode without manifest
    return {
      available: false,
      currentVersion: currentAppVersion,
      version: currentAppVersion,
    };
  }
}

export async function installUpdate(
  rawUpdate: any,
  onProgress?: (downloaded: number, total: number) => void
): Promise<boolean> {
  if (!isTauriApp() || !rawUpdate) {
    // Simulation for dev mode
    let current = 0;
    const total = 100;
    while (current < total) {
      await new Promise((r) => setTimeout(r, 80));
      current += 10;
      if (onProgress) onProgress(current, total);
    }
    return true;
  }

  try {
    let downloaded = 0;
    let contentLength = 0;

    await rawUpdate.downloadAndInstall((event: any) => {
      if (event.event === 'Started') {
        contentLength = event.data.contentLength || 0;
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
        if (onProgress) {
          onProgress(downloaded, contentLength);
        }
      } else if (event.event === 'Finished') {
        if (onProgress && contentLength > 0) {
          onProgress(contentLength, contentLength);
        }
      }
    });

    return true;
  } catch (err) {
    console.error('Error in downloadAndInstall:', err);
    throw err;
  }
}

export async function relaunchApp(): Promise<void> {
  if (isTauriApp()) {
    try {
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch {
      window.location.reload();
    }
  } else {
    window.location.reload();
  }
}
