import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { currentMonitor } from '@tauri-apps/api/window';

export async function openQuickCaptureWindow(): Promise<void> {
  try {
    const logicalWidth = 390;
    const logicalHeight = 245;

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

    const existing = await WebviewWindow.getByLabel('quick_capture');
    if (existing) {
      try {
        const { PhysicalSize, PhysicalPosition } = await import('@tauri-apps/api/dpi');
        await existing.setSize(new PhysicalSize(physicalW, physicalH));
        if (targetPhysicalX !== undefined && targetPhysicalY !== undefined) {
          await existing.setPosition(new PhysicalPosition(targetPhysicalX, targetPhysicalY));
        }
      } catch (err) {
        console.error('Error repositioning existing window:', err);
      }
      await existing.show();
      await existing.unminimize();
      await existing.setFocus();
      return;
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
      title: 'leaf',
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

    const width = 280;
    const height = 360;
    let x: number | undefined;
    let y: number | undefined;

    try {
      const monitor = await currentMonitor();
      if (monitor) {
        const scaleFactor = monitor.scaleFactor || 1;
        const screenWidth = monitor.size.width / scaleFactor;
        const monitorX = monitor.position.x / scaleFactor;
        const monitorY = monitor.position.y / scaleFactor;

        // Position at top-right corner
        x = Math.round(monitorX + screenWidth - width - 24);
        y = Math.round(monitorY + 60);
      }
    } catch {
      // Fallback
    }

    const win = new WebviewWindow('queue_widget', {
      url: '/?window=queue_widget',
      title: 'My Queue',
      width,
      height,
      x,
      y,
      minWidth: 240,
      minHeight: 260,
      resizable: true,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      shadow: true,
    });

    win.once('tauri://error', (e) => {
      console.error('Error creating queue widget window:', e);
    });
  } catch (err) {
    console.error('Failed to open queue widget window:', err);
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
