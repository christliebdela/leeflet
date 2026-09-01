import React, { useEffect } from 'react';
import { useUpdaterStore } from '../store/useUpdaterStore';
import { Sparkles, ArrowRight, Download, RefreshCw, X, CheckCircle2, AlertTriangle } from 'lucide-react';

// Helper to format release markdown text into clean neutral UI elements
function renderFormattedReleaseNotes(text: string) {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1.5" />;

    // Heading 3 (### Heading)
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-xs font-bold text-[#111827] dark:text-white pt-1 pb-0.5">
          {trimmed.replace(/^###\s+/, '')}
        </h4>
      );
    }

    // Heading 2 (## Heading)
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-xs font-bold text-[#111827] dark:text-white pt-1 pb-0.5">
          {trimmed.replace(/^##\s+/, '')}
        </h3>
      );
    }

    // Bullet point (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.replace(/^[-*]\s+/, '');
      const parts = content.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={idx} className="flex items-start gap-2 text-xs text-[#4b5563] dark:text-[#d4d4d8] leading-relaxed pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] dark:bg-[#71717a] shrink-0 mt-1.5" />
          <div className="flex-1">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-semibold text-[#111827] dark:text-white">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        </div>
      );
    }

    // Normal paragraph with possible bold markdown
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={idx} className="text-xs text-[#4b5563] dark:text-[#d4d4d8] leading-relaxed">
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-[#111827] dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </p>
    );
  });
}

export const UpdateModal: React.FC = () => {
  const {
    status,
    currentVersion,
    availableVersion,
    releaseDate,
    releaseNotes,
    downloadProgress,
    error,
    isModalOpen,
    setModalOpen,
    startDownloadAndInstall,
    restartAndApply,
  } = useUpdaterStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && status !== 'downloading') {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, status, setModalOpen]);

  if (!isModalOpen) return null;

  const isDownloading = status === 'downloading';
  const isDownloaded = status === 'downloaded';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDownloading) {
          setModalOpen(false);
        }
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-modal overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="px-5 pt-5 pb-4 border-b border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e33] flex items-center justify-center text-[#4b5563] dark:text-[#d4d4d8] shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                  Update Available
                </h3>
                <span className="px-1.5 py-0.5 rounded-[4px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] font-mono text-[10px] font-semibold border border-[#e5e7eb] dark:border-[#3f3f46]">
                  v{availableVersion || 'latest'}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                {releaseDate ? `Released on ${releaseDate}` : 'A new version of Leeflet is ready'}
              </p>
            </div>
          </div>

          {!isDownloading && (
            <button
              onClick={() => setModalOpen(false)}
              className="p-1 rounded-[6px] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Version Transition Banner */}
        <div className="px-5 py-2.5 bg-[#f9fafb] dark:bg-[#141416] border-b border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#6b7280] dark:text-[#a1a1aa]">
            <span className="font-mono bg-white dark:bg-[#202024] px-2 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a]">
              v{currentVersion}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span className="font-mono bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-white font-bold px-2 py-0.5 rounded border border-[#e5e7eb] dark:border-[#3f3f46]">
              v{availableVersion || 'latest'}
            </span>
          </div>
          <span className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
            Automatic Installer
          </span>
        </div>

        {/* Release Notes Body */}
        <div className="p-5 flex-1 max-h-60 overflow-y-auto custom-scrollbar space-y-2 text-xs leading-relaxed text-[#374151] dark:text-[#d4d4d8]">
          <div className="font-semibold text-[#111827] dark:text-white text-xs mb-1">
            Release Highlights:
          </div>
          
          <div className="bg-[#f9fafb] dark:bg-[#141416] p-3.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] space-y-2 select-text">
            {releaseNotes
              ? renderFormattedReleaseNotes(releaseNotes)
              : 'Various performance enhancements, bug fixes, and user experience updates.'}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-[6px] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Download Progress Bar */}
          {isDownloading && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-[#6b7280] dark:text-[#a1a1aa]">
                <span className="flex items-center gap-1.5 font-medium text-[#111827] dark:text-white">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6b7280] dark:text-[#a1a1aa]" />
                  Downloading update package...
                </span>
                <span className="font-mono font-bold text-[#111827] dark:text-white">
                  {downloadProgress.percent}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#e5e7eb] dark:bg-[#27272a] overflow-hidden">
                <div
                  className="h-full bg-[#111827] dark:bg-white transition-all duration-200 ease-out rounded-full"
                  style={{ width: `${Math.max(downloadProgress.percent, 5)}%` }}
                />
              </div>
            </div>
          )}

          {isDownloaded && (
            <div className="flex items-center gap-2 p-2.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e33] text-[#111827] dark:text-white text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span>Update downloaded successfully! Restart to apply changes.</span>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="px-5 py-3 bg-[#fafafa] dark:bg-[#141416] border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            disabled={isDownloading}
            className="px-3 py-1.5 text-xs text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            Remind Me Later
          </button>

          <div className="flex items-center gap-2">
            {isDownloaded ? (
              <button
                type="button"
                onClick={restartAndApply}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[6px] text-xs font-bold transition-all shadow-subtle cursor-pointer active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restart & Apply</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startDownloadAndInstall}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-50 text-white dark:text-[#111827] rounded-[6px] text-xs font-bold transition-all shadow-subtle cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? 'Downloading...' : 'Download & Install'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
