import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { currentMonitor } from '@tauri-apps/api/window';

let isOpeningCapture = false;

export async function openQuickCaptureWindow(): Promise<void> {
  if (isOpeningCapture) return;
  isOpeningCapture = true;
  try {
    const existing = await WebviewWindow.getByLabel('quick_capture');
    if (existing) {
      await existing.show();
      await existing.unminimize();
      await existing.setFocus();
      return;
    }

    const logicalWidth = 430;
    const logicalHeight = 250;

    let targetPhysicalX: number | undefined;
    let targetPhysicalY: number | undefined;
    let physicalW = logicalWidth;
    let physicalH = logicalHeight;

    try {
      const monitor = await currentMonitor();
      if (monitor) {
        const scaleFactor = monitor.scaleFactor || 1;
        physicalW = Math.round(logicalWidth * scaleFactor);
        physicalH = Math.round(logicalHeight * scaleFactor);
        const marginY = Math.round(65 * scaleFactor);

        targetPhysicalX = monitor.position.x + Math.round((monitor.size.width - physicalW) / 2);
        targetPhysicalY = monitor.position.y + monitor.size.height - physicalH - marginY;
      }
    } catch {
      // Fallback
    }

    const { PhysicalPosition, PhysicalSize } = await import('@tauri-apps/api/dpi');
    const win = new WebviewWindow('quick_capture', {
      url: '/?window=capture',
      title: 'New Item',
      width: logicalWidth,
      height: logicalHeight,
      resizable: false,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      shadow: true,
      visible: true,
      skipTaskbar: true,
    });

    win.once('tauri://created', async () => {
      try {
        await win.setSize(new PhysicalSize(physicalW, physicalH));
        if (targetPhysicalX !== undefined && targetPhysicalY !== undefined) {
          await win.setPosition(new PhysicalPosition(targetPhysicalX, targetPhysicalY));
        }
      } catch {
        // ignore
      }
    });

    win.once('tauri://error', (e) => {
      console.error('Error creating quick_capture window:', e);
    });
  } catch (err) {
    console.error('Failed to open quick capture window:', err);
  } finally {
    setTimeout(() => {
      isOpeningCapture = false;
    }, 200);
  }
}

export async function openStickyNoteWindow(itemId: string): Promise<void> {
  try {
    const cleanId = itemId.replace(/-/g, '_');
    const label = `sticky_${cleanId}`;
    const existing = await WebviewWindow.getByLabel(label);
    if (existing) {
      await existing.show();
      await existing.unminimize();
      await existing.setFocus();
      return;
    }

    const width = 340;
    const height = 380;
    let x: number | undefined;
    let y: number | undefined;

    try {
      const monitor = await currentMonitor();
      if (monitor) {
        const scaleFactor = monitor.scaleFactor || 1;
        const screenWidth = monitor.size.width / scaleFactor;
        const screenHeight = monitor.size.height / scaleFactor;
        const monitorX = monitor.position.x / scaleFactor;
        const monitorY = monitor.position.y / scaleFactor;

        // Position at bottom-right corner with margin
        x = Math.round(monitorX + screenWidth - width - 24);
        y = Math.round(monitorY + screenHeight - height - 64);
      }
    } catch {
      // Fallback
    }

    const win = new WebviewWindow(label, {
      url: `/?window=sticky&id=${itemId}`,
      title: 'leeflet',
      width,
      height,
      x,
      y,
      minWidth: 260,
      minHeight: 200,
      resizable: true,
      decorations: false,
      transparent: true,
      alwaysOnTop: false,
      shadow: true,
      skipTaskbar: true,
    });

    win.once('tauri://error', (e) => {
      console.error('Error creating sticky note window:', e);
    });
  } catch (err) {
    console.error('Failed to open sticky note window:', err);
  }
}

export async function openQueueWidgetWindow(): Promise<void> {
  try {
    const existing = await WebviewWindow.getByLabel('queue_widget');
    if (existing) {
      await existing.show();
      await existing.unminimize();
      await existing.setFocus();
      return;
    }

    const width = 330;
    const height = 420;
    let x: number | undefined;
    let y: number | undefined;

    const savedX = localStorage.getItem('leaf_queue_widget_pos_x');
    const savedY = localStorage.getItem('leaf_queue_widget_pos_y');
    const savedAlwaysOnTop = localStorage.getItem('leaf_queue_widget_always_on_top') === 'true';

    if (savedX !== null && savedY !== null && !isNaN(Number(savedX)) && !isNaN(Number(savedY))) {
      x = parseInt(savedX, 10);
      y = parseInt(savedY, 10);
    } else {
      try {
        const monitor = await currentMonitor();
        if (monitor) {
          const scaleFactor = monitor.scaleFactor || 1;
          const screenWidth = monitor.size.width / scaleFactor;
          const screenHeight = monitor.size.height / scaleFactor;
          const monitorX = monitor.position.x / scaleFactor;
          const monitorY = monitor.position.y / scaleFactor;

          // Position in the bottom-right corner with ~12px gap from edges/taskbar
          x = Math.round(monitorX + screenWidth - width - 12);
          y = Math.round(monitorY + screenHeight - height - 58);
        }
      } catch {
        // Fallback
      }
    }

    const win = new WebviewWindow('queue_widget', {
      url: '/?window=queue_widget',
      title: 'My Queue (Mini Mode)',
      width,
      height,
      x,
      y,
      minWidth: 300,
      maxWidth: 480,
      minHeight: 280,
      maxHeight: 720,
      resizable: true,
      maximizable: false,
      decorations: false,
      transparent: true,
      alwaysOnTop: savedAlwaysOnTop,
      shadow: false,
      skipTaskbar: true,
    });

    win.once('tauri://created', async () => {
      try {
        await win.setMaximizable(false);
      } catch {
        // ignore
      }
    });

    win.once('tauri://error', (e) => {
      console.error('Error creating queue widget window:', e);
    });
  } catch (err) {
    console.error('Failed to open queue widget window:', err);
  }
}

export async function enterMiniMode(): Promise<void> {
  try {
    await openQueueWidgetWindow();
    const mainWin = await WebviewWindow.getByLabel('main');
    if (mainWin) {
      await mainWin.hide();
    }
  } catch (err) {
    // Web browser localhost fallback
    window.open('/?window=queue_widget', 'leaf_queue_widget', 'width=320,height=420');
  }
}

export async function exitMiniMode(): Promise<void> {
  try {
    const mainWin = await WebviewWindow.getByLabel('main');
    if (mainWin) {
      await mainWin.show();
      await mainWin.unminimize();
      await mainWin.setFocus();
    }
  } catch (err) {
    console.error('Failed to exit mini mode:', err);
  }
}

export async function closeCurrentWindow(): Promise<void> {
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();
    await win.close();
  } catch {
    window.close();
  }
}
