import React, { useState, useEffect } from 'react';
import { Minus, X } from 'lucide-react';

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const initWindowListener = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        const max = await win.isMaximized();
        setIsMaximized(max);

        unlisten = await win.onResized(async () => {
          try {
            const isMax = await win.isMaximized();
            setIsMaximized(isMax);
          } catch {
            // Ignore
          }
        });
      } catch {
        // Browser fallback
      }
    };

    initWindowListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.minimize();
    } catch {
      // Browser fallback
    }
  };

  const handleToggleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.toggleMaximize();
      // Update state with slight delay to ensure window manager finished transition
      setTimeout(async () => {
        try {
          const isMax = await win.isMaximized();
          setIsMaximized(isMax);
        } catch {
          // Ignore
        }
      }, 50);
    } catch {
      setIsMaximized((prev) => !prev);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.close();
    } catch {
      // Browser fallback
    }
  };

  return (
    <div
      className="flex items-center text-[#6b7280] dark:text-[#a1a1aa] select-none shrink-0"
      data-tauri-drag-region="false"
    >
      <button
        onClick={handleMinimize}
        title="Minimize"
        className="w-8 h-7 flex items-center justify-center hover:bg-[#e5e7eb] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors rounded-[4px]"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleToggleMaximize}
        title={isMaximized ? 'Restore Down' : 'Maximize'}
        className="w-8 h-7 flex items-center justify-center hover:bg-[#e5e7eb] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors rounded-[4px]"
      >
        {isMaximized ? (
          /* Restore Icon (Two overlapping squares) */
          <svg
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="w-3 h-3"
          >
            <path d="M3 1.5H8.5V7" />
            <rect x="1.5" y="3" width="5.5" height="5.5" rx="0.5" />
          </svg>
        ) : (
          /* Maximize Icon (Single square) */
          <svg
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="w-3 h-3"
          >
            <rect x="1.5" y="1.5" width="7" height="7" rx="0.5" />
          </svg>
        )}
      </button>

      <button
        onClick={handleClose}
        title="Close"
        className="w-8 h-7 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors rounded-[4px]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
