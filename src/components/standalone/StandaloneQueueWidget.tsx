import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/db';
import { Item, Priority, ItemType } from '../../types';
import { X, Circle, CheckCircle2, Plus } from 'lucide-react';
import { broadcastSync, subscribeToSync } from '../../utils/sync';

type SectionKey = 'critical' | 'high' | 'medium' | 'low' | 'ideas';

export const StandaloneQueueWidget: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

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
    const nextStatus = item.status === 'done' ? 'inbox' : 'done';
    const updated: Item = { ...item, status: nextStatus };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    broadcastSync({ type: 'item_updated', item: updated });
    await dbService.updateItem(updated);
  };

  const handleStartAdding = (sectionKey: SectionKey) => {
    setAddingSection(sectionKey);
    setNewTitle('');
    setTimeout(() => inlineInputRef.current?.focus(), 50);
  };

  const handleAddItem = async (sectionKey: SectionKey) => {
    const title = newTitle.trim();
    if (!title) return;

    let priority: Priority = 'none';
    let type: ItemType = 'task';

    if (sectionKey === 'critical') priority = 'critical';
    else if (sectionKey === 'high') priority = 'high';
    else if (sectionKey === 'medium') priority = 'medium';
    else if (sectionKey === 'low') priority = 'low';
    else if (sectionKey === 'ideas') {
      priority = 'none';
      type = 'idea';
    }

    const projects = await dbService.getProjects();
    const defaultProjectId = projects[0]?.id || '';

    const newItem = await dbService.createItem({
      projectId: defaultProjectId,
      title,
      type,
      priority,
      status: 'inbox',
      tags: [],
      checklist: [],
      attachments: [],
    });

    setItems((prev) => [newItem, ...prev]);
    broadcastSync({ type: 'item_created', item: newItem });
    setNewTitle('');
    inlineInputRef.current?.focus();
  };

  const sortQueueList = (list: Item[]) => {
    return [...list].sort((a, b) => {
      const aDone = a.status === 'done';
      const bDone = b.status === 'done';
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const queueItems = items.filter((i) => i.status !== 'archived');
  const criticalItems = sortQueueList(queueItems.filter((i) => i.priority === 'critical'));
  const highItems = sortQueueList(queueItems.filter((i) => i.priority === 'high'));
  const mediumItems = sortQueueList(queueItems.filter((i) => i.priority === 'medium'));
  const lowItems = sortQueueList(queueItems.filter((i) => i.priority === 'low'));
  const ideasItems = sortQueueList(
    queueItems.filter((i) => i.type === 'idea' && i.priority !== 'critical' && i.priority !== 'high')
  );

  const activeCount = queueItems.filter((i) => i.status !== 'done').length;

  const renderSection = (title: string, sectionKey: SectionKey, list: Item[], dotColor: string) => {
    const sectionActiveCount = list.filter((i) => i.status !== 'done').length;
    const isAdding = addingSection === sectionKey;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#111827] dark:text-[#f4f4f5]">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] px-1.5 py-0 leading-[14px] rounded-full">
              {sectionActiveCount > 0 ? `${sectionActiveCount} / ${list.length}` : list.length}
            </span>
            <button
              onClick={() => handleStartAdding(sectionKey)}
              className="p-0.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors"
              title={`Add ${title} item`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Inline Add Input */}
        {isAdding && (
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[5px]">
            <input
              ref={inlineInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem(sectionKey);
                if (e.key === 'Escape') {
                  setAddingSection(null);
                  setNewTitle('');
                }
              }}
              placeholder={`Add to ${title}...`}
              className="flex-1 bg-transparent px-1.5 py-0.5 text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] outline-none"
            />
            <button
              type="button"
              onClick={() => handleAddItem(sectionKey)}
              className="px-1.5 py-0.5 bg-[#f3f4f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] rounded text-[10px] font-semibold text-[#111827] dark:text-[#f4f4f5]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingSection(null);
                setNewTitle('');
              }}
              className="p-0.5 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {list.length === 0 && !isAdding ? (
          <div className="text-[10px] text-[#9ca3af] dark:text-[#71717a] py-1 italic">
            No items in this queue
          </div>
        ) : (
          <div className="space-y-1">
            {list.map((item) => {
              const isDone = item.status === 'done';

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleDone(item)}
                  className={`group flex items-center justify-between p-1.5 bg-white dark:bg-[#202024] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] border border-[#e5e7eb] dark:border-[#27272a] rounded-[5px] text-xs cursor-pointer transition-colors ${
                    isDone ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5">
                    <div className={`shrink-0 transition-colors ${isDone ? 'text-emerald-500' : 'text-[#9ca3af] group-hover:text-emerald-500'}`}>
                      {isDone ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Circle className="w-3 h-3" />}
                    </div>
                    <span
                      className={`truncate text-xs font-medium ${
                        isDone
                          ? 'line-through text-[#9ca3af] dark:text-[#71717a]'
                          : 'text-[#374151] dark:text-[#e4e4e7]'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                </div>
              );
            })}
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
            {activeCount}
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

      {/* Scrollable Queue Lists (Hidden scrollbar) */}
      <div className="py-2.5 flex-1 overflow-y-auto space-y-3 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {renderSection('Critical', 'critical', criticalItems, 'bg-rose-500')}
        {renderSection('High', 'high', highItems, 'bg-orange-500')}
        {renderSection('Medium', 'medium', mediumItems, 'bg-amber-500')}
        {renderSection('Low', 'low', lowItems, 'bg-blue-500')}
        {renderSection('Ideas', 'ideas', ideasItems, 'bg-violet-500')}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between text-[10px] text-[#9ca3af] dark:text-[#71717a]">
        <span>Always on top</span>
        <span>Click item to complete</span>
      </div>
    </div>
  );
};
