import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none select-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border border-[#e5e7eb] dark:border-[#27272a] shadow-modal text-xs font-medium text-[#111827] dark:text-[#f4f4f5] animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          {t.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          {t.type === 'info' && (
            <Info className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
          )}

          <span className="leading-snug max-w-sm">{t.message}</span>

          <button
            onClick={() => removeToast(t.id)}
            className="p-0.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/5 text-[#9ca3af] dark:text-[#71717a] hover:text-[#111827] dark:hover:text-white transition-colors ml-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
