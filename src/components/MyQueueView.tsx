import React, { useState, useRef } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { Item, Project, Priority, ItemType } from '../types';
import { Plus, Circle, CheckCircle2, X, Sparkles } from 'lucide-react';

type SectionKey = 'critical' | 'high' | 'medium' | 'low' | 'ideas' | 'inbox';

const SECTION_EMPTY_MESSAGES: Record<SectionKey, string> = {
  critical: 'No critical items pending',
  high: 'No high priority items pending',
  medium: 'Medium queue is clear',
  low: 'Low queue is clear',
  ideas: 'No active ideas in queue',
  inbox: 'Inbox queue is clear',
};

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

  const criticalItems = queueItems.filter((i: Item) => i.priority === 'critical');
  const highItems = queueItems.filter((i: Item) => i.priority === 'high');
  const mediumItems = queueItems.filter((i: Item) => i.priority === 'medium');
  const lowItems = queueItems.filter((i: Item) => i.priority === 'low');
  const ideasItems = queueItems.filter((i: Item) => i.type === 'idea' && i.priority !== 'critical' && i.priority !== 'high');
  const inboxItems = queueItems.filter((i: Item) => i.priority === 'none' && i.type !== 'idea');

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '';
    const proj = projects.find((p: Project) => p.id === projectId);
    return proj ? proj.name : '';
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
    if (sectionKey === 'high') priority = 'high';
    if (sectionKey === 'medium') priority = 'medium';
    if (sectionKey === 'low') priority = 'low';
    if (sectionKey === 'ideas') {
      type = 'idea';
      priority = 'none';
    }

    const defaultProj = projects[0]?.id || '';
    await createItem({
      projectId: defaultProj,
      title,
      type,
      priority,
      status: 'inbox',
    });

    setNewTitle('');
    inlineInputRef.current?.focus();
  };

  const handleToggleStatus = async (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    const nextStatus = item.status === 'done' ? 'inbox' : 'done';
    await updateItem({ ...item, status: nextStatus });
  };

  const renderSection = (title: string, sectionKey: SectionKey, list: Item[], dotColor: string) => {
    const activeCount = list.filter((i: Item) => i.status !== 'done').length;
    const isAdding = addingSection === sectionKey;

    return (
      <div className="space-y-1">
        {/* Section Header */}
        <div className="flex items-center justify-between py-1 px-1 border-b border-[#f3f4f6] dark:border-[#27272a]">
          <h2 className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
            {title}
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] px-1.5 py-0 leading-[14px] rounded-full">
              {activeCount > 0 ? `${activeCount} / ${list.length}` : list.length}
            </span>
            <button
              onClick={() => handleStartAdding(sectionKey)}
              className="p-1 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors"
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
              placeholder={`Add to ${title}...`}
              className="flex-1 bg-transparent text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] outline-none"
            />
            <button
              type="button"
              onClick={() => handleAddItem(sectionKey)}
              className="px-2.5 py-1 bg-[#f3f4f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] border border-[#e5e7eb] dark:border-[#3f3f46] rounded text-xs font-semibold transition-colors"
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
          <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a] py-2 italic px-1">
            {SECTION_EMPTY_MESSAGES[sectionKey]}
          </div>
        ) : (
          <div className="space-y-0.5">
            {list.map((item: Item) => {
              const isDone = item.status === 'done';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`group flex items-center justify-between p-2 rounded-[4px] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] cursor-pointer ${
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
        <div className="flex-1 min-h-[360px] w-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] bg-gradient-to-b from-transparent to-[#fafafa]/60 dark:to-[#18181b]/30">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] shadow-xs flex items-center justify-center mb-3 transition-transform hover:scale-105">
            <Sparkles className="w-6 h-6 text-[#6b7280] dark:text-[#a1a1aa]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
            Queue Zero — all caught up
          </h3>
          <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] max-w-sm mt-1.5 leading-relaxed">
            Your active queue is completely clear. Capture or queue up your next task whenever ready.
          </p>
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Queue</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto ${isPaneOpen ? 'pl-3 pr-2 py-3' : 'p-3'} space-y-3 select-none custom-scrollbar`}>
      <div className="flex flex-col gap-3">
        {renderSection('Critical', 'critical', criticalItems, 'bg-rose-500')}
        {renderSection('High', 'high', highItems, 'bg-orange-500')}
        {renderSection('Medium', 'medium', mediumItems, 'bg-amber-500')}
        {renderSection('Low', 'low', lowItems, 'bg-blue-500')}
        {renderSection('Ideas', 'ideas', ideasItems, 'bg-violet-500')}
        {renderSection('Inbox / Tasks', 'inbox', inboxItems, 'bg-zinc-400')}
      </div>
    </div>
  );
};
