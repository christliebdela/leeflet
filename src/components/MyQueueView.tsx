import React, { useState, useRef } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { Item, Project, Priority, ItemType } from '../types';
import { ListTodo, Plus, Circle, CheckCircle2, X } from 'lucide-react';

type SectionKey = 'critical' | 'high' | 'medium' | 'low' | 'ideas';

export const MyQueueView: React.FC = () => {
  const { items, projects, selectedItemId, setSelectedItemId, filterOptions, setQuickCaptureOpen, updateItem, createItem, isWorkspaceModalOpen } = useLeafStore();
  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const queueItems = items.filter((i: Item) => {
    if (i.status === 'archived') return false;
    if (filterOptions.searchQuery) {
      const q = filterOptions.searchQuery.toLowerCase();
      const matchTitle = i.title.toLowerCase().includes(q);
      const matchContent = i.content?.toLowerCase().includes(q);
      const matchTags = i.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    return true;
  });

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

    const defaultProjectId = projects[0]?.id || '';

    await createItem({
      projectId: defaultProjectId,
      title,
      type,
      priority,
      status: 'inbox',
    });

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

  const criticalItems = sortQueueList(queueItems.filter((i: Item) => i.priority === 'critical'));
  const highItems = sortQueueList(queueItems.filter((i: Item) => i.priority === 'high'));
  const mediumItems = sortQueueList(queueItems.filter((i: Item) => i.priority === 'medium'));
  const lowItems = sortQueueList(queueItems.filter((i: Item) => i.priority === 'low'));
  const ideasItems = sortQueueList(
    queueItems.filter((i: Item) => i.type === 'idea' && i.priority !== 'critical' && i.priority !== 'high')
  );

  const getProjectName = (projectId: string) => {
    return projects.find((p: Project) => p.id === projectId)?.name || '';
  };

  const handleToggleStatus = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    updateItem({
      ...item,
      status: item.status === 'done' ? 'inbox' : 'done',
    });
  };

  const renderSection = (title: string, sectionKey: SectionKey, list: Item[], dotColor: string) => {
    const activeCount = list.filter((i) => i.status !== 'done').length;
    const isAdding = addingSection === sectionKey;

    return (
      <div className="bg-white dark:bg-[#18181b] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] shadow-card p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-[#f3f4f6] dark:border-[#27272a]">
          <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
            {title}
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] px-1.5 py-0 leading-[14px] rounded-full">
              {activeCount > 0 ? `${activeCount} / ${list.length}` : list.length}
            </span>
            <button
              onClick={() => handleStartAdding(sectionKey)}
              className="p-1 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors"
              title={`Add item to ${title}`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Inline Add Input */}
        {isAdding && (
          <div className="flex items-center gap-2 p-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[5px]">
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
              placeholder={`Add item to ${title}...`}
              className="flex-1 bg-transparent px-2 py-1 text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] outline-none"
            />
            <button
              type="button"
              onClick={() => handleAddItem(sectionKey)}
              className="px-2 py-1 bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] rounded text-xs font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingSection(null);
                setNewTitle('');
              }}
              className="p-1 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {list.length === 0 && !isAdding ? (
          <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a] py-2 italic">
            No items in this queue
          </div>
        ) : (
          <div className="space-y-1">
            {list.map((item: Item) => {
              const isDone = item.status === 'done';

              return (
                <div
                  key={item.id}
                  data-item-card="true"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`group flex items-center justify-between p-2 rounded-[4px] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] border border-transparent hover:border-[#e5e7eb] dark:hover:border-[#3f3f46] cursor-pointer transition-colors ${
                    isDone ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(e, item)}
                      className="p-0.5 text-[#9ca3af] hover:text-emerald-500 transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 hover:text-emerald-500" />
                      )}
                    </button>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                    <span
                      className={`text-xs font-medium truncate flex-1 ${
                        isDone
                          ? 'line-through text-[#9ca3af] dark:text-[#71717a]'
                          : 'text-[#111827] dark:text-[#f4f4f5]'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  {item.projectId && (
                    <span className="text-[10px] text-[#9ca3af] dark:text-[#71717a] shrink-0 ml-2">
                      {getProjectName(item.projectId)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const isPaneOpen = Boolean(selectedItemId) || isWorkspaceModalOpen;

  if (queueItems.length === 0 && !addingSection) {
    return (
      <div className={`flex-1 h-full overflow-y-auto ${isPaneOpen ? 'pl-3 pr-2 py-3' : 'p-3'} flex flex-col custom-scrollbar`}>
        <div className="flex-1 min-h-[360px] w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#e5e7eb] dark:border-[#27272a] rounded-[6px]">
          <div className="w-10 h-10 rounded-full bg-[#f3f4f6] dark:bg-[#27272a] flex items-center justify-center mb-2.5">
            <ListTodo className="w-5 h-5 text-[#9ca3af] dark:text-[#71717a]" />
          </div>
          <h3 className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
            Queue is clear
          </h3>
          <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] max-w-xs mt-1">
            No active priority items in your queue.
          </p>
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-medium hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture item</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto ${isPaneOpen ? 'pl-3 pr-2 py-3' : 'p-3'} space-y-3 select-none custom-scrollbar`}>
      {/* Single-Column Stack of Queues (One on a row) */}
      <div className="flex flex-col gap-3">
        {renderSection('Critical', 'critical', criticalItems, 'bg-rose-500')}
        {renderSection('High', 'high', highItems, 'bg-orange-500')}
        {renderSection('Medium', 'medium', mediumItems, 'bg-amber-500')}
        {renderSection('Low', 'low', lowItems, 'bg-blue-500')}
        {renderSection('Ideas', 'ideas', ideasItems, 'bg-violet-500')}
      </div>
    </div>
  );
};
