import React, { useEffect, useRef, useState } from 'react';
import { useToastStore, ToastItem } from '../../store/useToastStore';
import { X } from 'lucide-react';

const SPRING   = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // enter spring
const EXIT_CB  = 'cubic-bezier(0.4, 0, 1, 1)';         // snappy exit
const EXIT_MS  = 200;
const ENTER_MS = 440;

type Phase = 'enter' | 'rest' | 'exit';

interface DisplayItem {
  key: string; // unique per instance so React always creates a fresh node
  toast: ToastItem;
  phase: Phase;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
const Card: React.FC<{ item: DisplayItem; onClose: (id: string) => void }> = ({
  item,
  onClose,
}) => {
  const { toast, phase } = item;

  const isRest  = phase === 'rest';
  const isExit  = phase === 'exit';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '100%',
        // enter: start below + small, animate to rest with spring
        // exit:  animate below + small, quick ease-in
        transform: isRest
          ? 'translateY(0px) scale(1)'
          : 'translateY(28px) scale(0.94)',
        opacity: isRest ? 1 : 0,
        transition: isExit
          ? `transform ${EXIT_MS}ms ${EXIT_CB}, opacity ${EXIT_MS}ms ease`
          : `transform ${ENTER_MS}ms ${SPRING}, opacity 180ms ease`,
        willChange: 'transform, opacity',
        pointerEvents: isExit ? 'none' : 'auto',
        zIndex: isExit ? 0 : 1,
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5 rounded-[10px] bg-[#18181b] border border-white/10 px-3.5 py-3 shadow-2xl">
        <div className="flex-1 grid gap-0.5 min-w-0">
          {toast.title && (
            <p className="text-[12.5px] font-semibold text-white leading-snug">
              {toast.title}
            </p>
          )}
          {toast.description && (
            <p className="text-[11.5px] text-[#a1a1aa] leading-snug">
              {toast.description}
            </p>
          )}
        </div>

        {toast.actionProps && (
          <button
            type="button"
            onClick={toast.actionProps.onClick}
            className="shrink-0 self-center rounded-[5px] border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10 transition-colors"
          >
            {toast.actionProps.children}
          </button>
        )}

        <button
          type="button"
          aria-label="Close"
          onClick={() => onClose(toast.id)}
          className="shrink-0 self-start mt-0.5 text-[#71717a] hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Container ────────────────────────────────────────────────────────────────
export const ToastContainer: React.FC = () => {
  const { toasts, close } = useToastStore();
  const [items, setItems] = useState<DisplayItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const incoming = toasts[0] ?? null;

    setItems((prev) => {
      const incomingKey = incoming ? incoming.id : null;

      // Check if we already have this toast in rest phase — nothing to do
      const existing = prev.find((i) => i.key === incomingKey && i.phase !== 'exit');
      if (existing) return prev;

      // Mark all current non-exit items as exiting
      const updated: DisplayItem[] = prev.map((i) =>
        i.phase !== 'exit' ? { ...i, phase: 'exit' as Phase } : i
      );

      // Schedule DOM removal for each exiting item
      updated.forEach((i) => {
        if (i.phase === 'exit' && !timers.current.has(i.key)) {
          const t = setTimeout(() => {
            setItems((s) => s.filter((x) => x.key !== i.key));
            timers.current.delete(i.key);
          }, EXIT_MS + 50);
          timers.current.set(i.key, t);
        }
      });

      // Add incoming in enter phase (if any)
      if (incoming) {
        updated.push({ key: incoming.id, toast: incoming, phase: 'enter' });
      }

      return updated;
    });

    // On next two frames, flip new item to 'rest' so animation fires
    if (incoming) {
      const raf1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setItems((s) =>
            s.map((i) =>
              i.key === incoming.id && i.phase === 'enter'
                ? { ...i, phase: 'rest' }
                : i
            )
          );
        });
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [toasts[0]?.id, toasts.length === 0]);

  // Cleanup timers on unmount
  useEffect(() => () => {
    timers.current.forEach((t) => clearTimeout(t));
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-3.5 right-3.5 z-[200] pointer-events-none"
      style={{ width: 260, height: 120 }}
    >
      {items.map((item) => (
        <Card key={item.key} item={item} onClose={close} />
      ))}
    </div>
  );
};
