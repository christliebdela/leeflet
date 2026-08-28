import React from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { Item, Project } from '../types';
import { ListTodo, Plus } from 'lucide-react';

export const MyQueueView: React.FC = () => {
  const { items, projects, setSelectedItemId, filterOptions, setQuickCaptureOpen } = useLeafStore();

  const activeItems = items.filter((i: Item) => {
    if (i.status === 'done' || i.status === 'archived') return false;
    if (filterOptions.searchQuery) {
      const q = filterOptions.searchQuery.toLowerCase();
      const matchTitle = i.title.toLowerCase().includes(q);
      const matchContent = i.content?.toLowerCase().includes(q);
      const matchTags = i.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    return true;
  });

  const criticalItems = activeItems.filter((i: Item) => i.priority === 'critical');
  const highItems = activeItems.filter((i: Item) => i.priority === 'high');
  const mediumItems = activeItems.filter((i: Item) => i.priority === 'medium');
  const ideasItems = activeItems.filter(
    (i: Item) => i.type === 'idea' && i.priority !== 'critical' && i.priority !== 'high'
  );

  const getProjectName = (projectId: string) => {
    return projects.find((p: Project) => p.id === projectId)?.name || '';
  };

  const renderSection = (title: string, list: Item[], dotColor: string) => {
    return (
      <div className="bg-white dark:bg-[#18181b] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] shadow-card p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-[#f3f4f6] dark:border-[#27272a]">
          <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
            {title}
          </h2>
          <span className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] px-1.5 py-0 leading-[14px] rounded-full">
            {list.length}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a] py-2 italic">
            No items in this queue
          </div>
        ) : (
          <div className="space-y-1">
            {list.map((item: Item) => (
              <div
                key={item.id}
                data-item-card="true"
                onClick={() => setSelectedItemId(item.id)}
                className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] border border-transparent hover:border-[#e5e7eb] dark:hover:border-[#3f3f46] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                  <span className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5] truncate">
                    {item.title}
                  </span>
                </div>
                {item.projectId && (
                  <span className="text-[10px] text-[#9ca3af] dark:text-[#71717a] shrink-0 ml-2">
                    {getProjectName(item.projectId)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (activeItems.length === 0) {
    return (
      <div className="flex-1 h-full overflow-y-auto px-6 py-2 pb-6 flex flex-col custom-scrollbar">
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
    <div className="flex-1 overflow-y-auto px-6 py-2 pb-6 space-y-4 select-none custom-scrollbar">
      {/* Single-Column Stack of Queues (One on a row) */}
      <div className="flex flex-col gap-4">
        {renderSection('Critical', criticalItems, 'bg-rose-500')}
        {renderSection('High', highItems, 'bg-orange-500')}
        {renderSection('Medium', mediumItems, 'bg-amber-500')}
        {renderSection('Ideas', ideasItems, 'bg-blue-500')}
      </div>
    </div>
  );
};
