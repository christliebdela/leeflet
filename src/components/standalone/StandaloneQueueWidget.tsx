import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/db';
import { Item } from '../../types';
import { X, Circle } from 'lucide-react';
import { broadcastSync, subscribeToSync } from '../../utils/sync';

export const StandaloneQueueWidget: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

  const closeWindow = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.close();
    } catch {
      window.close();
    }
  };

  const loadData = async () => {
    const it = await dbService.getItems();
    setItems(it);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('leaf_theme') as 'light' | 'dark' | null;
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    loadData();

    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'item_updated') {
        setItems((prev) => prev.map((i) => (i.id === msg.item.id ? msg.item : i)));
      } else if (msg.type === 'item_created') {
        setItems((prev) => {
          if (prev.some((i) => i.id === msg.item.id)) return prev;
          return [msg.item, ...prev];
        });
      } else if (msg.type === 'item_deleted') {
        setItems((prev) => prev.filter((i) => i.id !== msg.itemId));
      } else {
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleDone = async (item: Item) => {
    const nextStatus = item.status === 'done' ? 'in_progress' : 'done';
    const updated: Item = { ...item, status: nextStatus };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    broadcastSync({ type: 'item_updated', item: updated });
    await dbService.updateItem(updated);
  };

  const activeItems = items.filter((i) => i.status !== 'archived' && i.status !== 'done');
  const criticalItems = activeItems.filter((i) => i.priority === 'critical');
  const highItems = activeItems.filter((i) => i.priority === 'high');
  const ideasItems = activeItems.filter((i) => i.type === 'idea' && i.priority !== 'critical' && i.priority !== 'high');

  const renderSection = (title: string, list: Item[], dotColor: string) => {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#111827] dark:text-[#f4f4f5]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span>{title}</span>
          </div>
          <span className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] px-1.5 py-0 leading-[14px] rounded-full">
            {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="text-[10px] text-[#9ca3af] dark:text-[#71717a] py-1 italic">
            No active items
          </div>
        ) : (
          <div className="space-y-1">
            {list.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleDone(item)}
                className="group flex items-center justify-between p-1.5 bg-white dark:bg-[#202024] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] border border-[#e5e7eb] dark:border-[#27272a] rounded-[5px] text-xs cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5">
                  <div className="text-[#9ca3af] group-hover:text-emerald-500 transition-colors shrink-0">
                    <Circle className="w-3 h-3" />
                  </div>
                  <span className="truncate text-xs font-medium text-[#374151] dark:text-[#e4e4e7]">
                    {item.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-screen h-screen bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] p-3.5 flex flex-col justify-between select-none overflow-hidden font-sans text-[#111827] dark:text-[#f4f4f5]">
      {/* Header with Drag Region */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between pb-2 border-b border-[#f3f4f6] dark:border-[#27272a] cursor-move"
      >
        <div className="flex items-center gap-2" data-tauri-drag-region>
          <img
            src="/leaf_logo.png"
            alt="leaf"
            className="w-4 h-4 object-contain brightness-0 dark:brightness-0 dark:invert"
            data-tauri-drag-region
          />
          <span
            className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight"
            data-tauri-drag-region
          >
            My Queue
          </span>
          <span
            className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] px-1.5 py-0 leading-[14px] rounded-full"
            data-tauri-drag-region
          >
            {activeItems.length}
          </span>
        </div>

        <button
          onClick={closeWindow}
          className="p-1 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors"
          title="Close Widget"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Queue Lists */}
      <div className="py-2.5 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {renderSection('Critical', criticalItems, 'bg-rose-600')}
        {renderSection('High Priority', highItems, 'bg-orange-500')}
        {renderSection('Ideas Queue', ideasItems, 'bg-amber-500')}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between text-[10px] text-[#9ca3af] dark:text-[#71717a]">
        <span>Always on top</span>
        <span>Click item to complete</span>
      </div>
    </div>
  );
};
