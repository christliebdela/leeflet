import React, { useState } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import {
  GripVertical,
  Layers,
  Plus,
  Inbox,
  Folder,
  Bug,
  Lightbulb,
  CheckSquare,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  Archive,
  Search,
} from 'lucide-react';
import { Item, ChecklistItem, Project } from '../types';
import { formatDate, ITEM_TYPE_CONFIG } from '../utils/format';
import { MiddleTruncate } from './ui/MiddleTruncate';

const LinearPriorityIcon: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'critical':
      return (
        <span title="Urgent / Critical" className="w-4 h-4 flex items-center justify-center text-rose-500 shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
        </span>
      );
    case 'high':
      return (
        <span title="High Priority" className="w-4 h-4 flex items-end justify-center gap-[1.5px] pb-0.5 shrink-0">
          <span className="w-[2px] h-[4px] bg-amber-500 rounded-full" />
          <span className="w-[2px] h-[7px] bg-amber-500 rounded-full" />
          <span className="w-[2px] h-[10px] bg-amber-500 rounded-full" />
        </span>
      );
    case 'medium':
      return (
        <span title="Medium Priority" className="w-4 h-4 flex items-end justify-center gap-[1.5px] pb-0.5 shrink-0">
          <span className="w-[2px] h-[4px] bg-amber-500/80 rounded-full" />
          <span className="w-[2px] h-[7px] bg-amber-500/80 rounded-full" />
          <span className="w-[2px] h-[10px] bg-[#e5e7eb] dark:bg-[#3f3f46] rounded-full" />
        </span>
      );
    case 'low':
      return (
        <span title="Low Priority" className="w-4 h-4 flex items-end justify-center gap-[1.5px] pb-0.5 shrink-0">
          <span className="w-[2px] h-[4px] bg-blue-400 rounded-full" />
          <span className="w-[2px] h-[7px] bg-[#e5e7eb] dark:bg-[#3f3f46] rounded-full" />
          <span className="w-[2px] h-[10px] bg-[#e5e7eb] dark:bg-[#3f3f46] rounded-full" />
        </span>
      );
    default:
      return (
        <span title="No Priority" className="w-4 h-4 flex items-center justify-center text-[#9ca3af] dark:text-[#52525b] text-[11px] shrink-0 font-mono select-none">
          —
        </span>
      );
  }
};

export const ItemListView: React.FC = () => {
  const {
    items,
    projects,
    viewMode,
    selectedItemId,
    setSelectedItemId,
    setQuickCaptureOpen,
    reorderItems,
    filterOptions,
    setFilterOptions,
  } = useLeafStore();

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  // Filter items based on active view mode and filter options
  const displayItems = items.filter((item: Item) => {
    // Basic view mode filtering
    switch (viewMode.type) {
      case 'inbox':
        if (item.status !== 'inbox') return false;
        break;
      case 'project':
        if (item.projectId !== viewMode.projectId || item.status === 'archived') return false;
        break;
      case 'type_filter':
        if (item.type !== viewMode.itemType || item.status === 'archived') return false;
        break;
      case 'priority_filter':
        if (
          (item.priority !== 'high' && item.priority !== 'critical') ||
          item.status === 'archived'
        )
          return false;
        break;
      case 'completed':
        if (item.status !== 'done') return false;
        break;
      case 'archived':
        if (item.status !== 'archived') return false;
        break;
      case 'all':
      default:
        if (item.status === 'archived') return false;
        break;
    }

    // Search query filtering
    if (filterOptions.searchQuery.trim()) {
      const q = filterOptions.searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content?.toLowerCase().includes(q);
      const matchTags = item.tags.some((t: string) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }

    // Advanced filters
    if (
      filterOptions.projectIds &&
      filterOptions.projectIds.length > 0 &&
      !filterOptions.projectIds.includes(item.projectId)
    )
      return false;
    if (
      filterOptions.types &&
      filterOptions.types.length > 0 &&
      !filterOptions.types.includes(item.type)
    )
      return false;
    if (
      filterOptions.priorities &&
      filterOptions.priorities.length > 0 &&
      !filterOptions.priorities.includes(item.priority)
    )
      return false;
    if (
      filterOptions.statuses &&
      filterOptions.statuses.length > 0 &&
      !filterOptions.statuses.includes(item.status)
    )
      return false;

    return true;
  });

  // Sorting: Move completed (done) items to the bottom of the list (unless exclusively viewing Completed view)
  const isDone = (item: Item) => item.status === 'done';

  displayItems.sort((a: Item, b: Item) => {
    // 1. If not on the dedicated completed view, sink completed items to the bottom
    if (viewMode.type !== 'completed') {
      const aDone = isDone(a);
      const bDone = isDone(b);
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
    }

    // 2. Apply active sort rule
    if (filterOptions.sortBy === 'created_desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (filterOptions.sortBy === 'priority_desc') {
      const pWeights: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
      return (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
    } else if (filterOptions.sortBy === 'title_asc') {
      return a.title.localeCompare(b.title);
    } else if (filterOptions.sortBy === 'updated_desc') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (filterOptions.sortBy === 'project_asc') {
      const projA = projects.find((p) => p.id === a.projectId)?.name || '';
      const projB = projects.find((p) => p.id === b.projectId)?.name || '';
      const cmp = projA.localeCompare(projB);
      if (cmp !== 0) return cmp;
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Dynamic context-aware empty state icon, title, and action
  const getEmptyState = () => {
    if (filterOptions.searchQuery.trim()) {
      return {
        Icon: Search,
        title: 'Zero results found',
        description: `No items match "${filterOptions.searchQuery}". Try adjusting your keywords or filters.`,
        actionLabel: 'Clear Search',
        onAction: () => setFilterOptions({ searchQuery: '' }),
      };
    }

    switch (viewMode.type) {
      case 'inbox':
        return {
          Icon: Inbox,
          title: 'Inbox Zero — clear desk, clear focus',
          description: 'Your backlog is clear. Capture your next thought or task whenever ready.',
          actionLabel: 'Capture Thought',
          onAction: () => setQuickCaptureOpen(true),
        };
      case 'all':
        return {
          Icon: Layers,
          title: 'A fresh canvas',
          description: 'Nothing captured in this workspace yet. Dump your thoughts, track bugs, or organize tasks.',
          actionLabel: 'Create First Item',
          onAction: () => setQuickCaptureOpen(true),
        };
      case 'project': {
        const proj = projects.find((p) => p.id === viewMode.projectId);
        const name = proj?.name || 'This project';
        return {
          Icon: Folder,
          title: `${name} is ready for action`,
          description: `No tasks or notes inside this project yet. Start tracking items to get organized.`,
          actionLabel: `Add to ${name}`,
          onAction: () => setQuickCaptureOpen(true),
        };
      }
      case 'type_filter':
        switch (viewMode.itemType) {
          case 'bug':
            return {
              Icon: Bug,
              title: 'Zero bugs reported',
              description: 'No issues or defects on the log. Everything is running smoothly.',
              actionLabel: 'Report a Bug',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'idea':
            return {
              Icon: Lightbulb,
              title: 'No ideas captured yet',
              description: 'Have a feature concept or workflow thought? Jot it down before it slips away.',
              actionLabel: 'Jot an Idea',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'task':
            return {
              Icon: CheckSquare,
              title: 'No pending tasks',
              description: 'Your to-do list is clear. Add an action item or take a quick breather.',
              actionLabel: 'New Task',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'improvement':
            return {
              Icon: Sparkles,
              title: 'No improvements logged',
              description: 'Spot something to refine or level up? Capture enhancements right here.',
              actionLabel: 'Log Improvement',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'research':
            return {
              Icon: BookOpen,
              title: 'No research notes',
              description: 'Keep track of articles, bookmarks, and deep dives here.',
              actionLabel: 'Add Research Note',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'question':
            return {
              Icon: HelpCircle,
              title: 'No open questions',
              description: 'Open questions, investigations, and follow-ups will appear here.',
              actionLabel: 'Ask a Question',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'note':
            return {
              Icon: FileText,
              title: 'Blank notepad',
              description: 'Meeting notes, code snippets, and scratchpad thoughts live here.',
              actionLabel: 'Quick Note',
              onAction: () => setQuickCaptureOpen(true),
            };
          default:
            return {
              Icon: Layers,
              title: 'All caught up',
              description: 'No items matching this view. Ready to add something new?',
              actionLabel: 'New Item',
              onAction: () => setQuickCaptureOpen(true),
            };
        }
      case 'priority_filter':
        return {
          Icon: AlertCircle,
          title: 'No urgent priorities',
          description: 'Nothing critical currently flagged. Enjoy the calm focus.',
          actionLabel: 'Add Priority Task',
          onAction: () => setQuickCaptureOpen(true),
        };
      case 'completed':
        return {
          Icon: CheckCircle2,
          title: 'No completed items yet',
          description: 'Checked-off tasks and resolved bugs will stack up here.',
          actionLabel: 'Go to Queue',
          onAction: () => useLeafStore.getState().setViewMode({ type: 'my_queue' }),
        };
      case 'archived':
        return {
          Icon: Archive,
          title: 'Archive is empty',
          description: 'Archived tasks and retired projects will be preserved here.',
          actionLabel: 'Back to Backlog',
          onAction: () => useLeafStore.getState().setViewMode({ type: 'inbox' }),
        };
      default:
        return {
          Icon: Layers,
          title: 'No items in this view',
          description: 'Capture an idea, task, bug, or note to get things rolling.',
          actionLabel: 'New Item',
          onAction: () => setQuickCaptureOpen(true),
        };
    }
  };

  const emptyState = getEmptyState();
  const EmptyIcon = emptyState.Icon;

  const isPaneOpen = Boolean(selectedItemId);

  return (
    <div className={`flex-1 h-full overflow-y-auto overflow-x-hidden ${isPaneOpen ? 'pl-3 pr-2 py-3' : 'p-3'} flex flex-col custom-scrollbar`}>
      {displayItems.length === 0 ? (
        <div className="flex-1 min-h-[360px] w-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] bg-gradient-to-b from-transparent to-[#fafafa]/60 dark:to-[#18181b]/30">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] shadow-xs flex items-center justify-center mb-3 transition-transform hover:scale-105">
            <EmptyIcon className="w-6 h-6 text-[#6b7280] dark:text-[#a1a1aa]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
            {emptyState.title}
          </h3>
          <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] max-w-sm mt-1.5 leading-relaxed">
            {emptyState.description}
          </p>
          <button
            onClick={emptyState.onAction}
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle shrink-0 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{emptyState.actionLabel}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2 min-w-0">
          {displayItems.map((item: Item) => {
            const isSelected = selectedItemId === item.id;
            const isDragged = draggedItemId === item.id;
            const isDragOverBefore = dragOverInfo?.id === item.id && dragOverInfo.position === 'before';
            const isDragOverAfter = dragOverInfo?.id === item.id && dragOverInfo.position === 'after';
            const typeConfig = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.task;
            const project = projects.find((p: Project) => p.id === item.projectId);

            return (
              <div
                key={item.id}
                data-item-card="true"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedItemId(item.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  const rect = e.currentTarget.getBoundingClientRect();
                  const isTopHalf = (e.clientY - rect.top) < (rect.height / 2);
                  const position = isTopHalf ? 'before' : 'after';
                  if (!dragOverInfo || dragOverInfo.id !== item.id || dragOverInfo.position !== position) {
                    setDragOverInfo({ id: item.id, position });
                  }
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    if (dragOverInfo?.id === item.id) {
                      setDragOverInfo(null);
                    }
                  }
                }}
                onDragEnd={() => {
                  setDraggedItemId(null);
                  setDragOverInfo(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const sourceId = e.dataTransfer.getData('text/plain') || draggedItemId;
                  const position = dragOverInfo?.id === item.id ? dragOverInfo.position : 'before';
                  if (sourceId && sourceId !== item.id) {
                    reorderItems(sourceId, item.id, position);
                  }
                  setDraggedItemId(null);
                  setDragOverInfo(null);
                }}
                onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-[6px] border transition-all cursor-pointer select-none min-w-0 ${
                  isSelected
                    ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f9fafb] dark:bg-[#1f1f23] shadow-sm'
                    : 'border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]'
                } ${isDragged ? 'opacity-30 scale-[0.99]' : ''}`}
              >
                {/* Floating Insertion Indicator Line (positioned in-between cards) */}
                {isDragOverBefore && (
                  <div className="absolute -top-1.5 left-1 right-1 h-0.5 bg-[#111827] dark:bg-white rounded-full z-20 pointer-events-none flex items-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#111827] dark:bg-white -ml-0.5 shadow-sm" />
                  </div>
                )}
                {isDragOverAfter && (
                  <div className="absolute -bottom-1.5 left-1 right-1 h-0.5 bg-[#111827] dark:bg-white rounded-full z-20 pointer-events-none flex items-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#111827] dark:bg-white -ml-0.5 shadow-sm" />
                  </div>
                )}
                {/* Left Section: Drag handle + Priority Icon + Optional Type Icon + Title & Checklist */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3 overflow-hidden">
                  <div
                    className="cursor-grab active:cursor-grabbing text-[#d1d5db] dark:text-[#52525b] group-hover:text-[#9ca3af] dark:group-hover:text-[#a1a1aa] transition-colors shrink-0"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Priority Icon (Linear-style) */}
                  <LinearPriorityIcon priority={item.priority} />

                  {/* Non-task item type indicator (subtle icon only for bug/idea/improvement) */}
                  {item.type !== 'task' && (
                    <span title={`Type: ${typeConfig.label}`} className="shrink-0 flex items-center">
                      {item.type === 'bug' && <Bug className="w-3.5 h-3.5 text-rose-500" />}
                      {item.type === 'idea' && <Lightbulb className="w-3.5 h-3.5 text-amber-500" />}
                      {item.type === 'improvement' && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                      {item.type === 'research' && <BookOpen className="w-3.5 h-3.5 text-teal-500" />}
                      {item.type === 'question' && <HelpCircle className="w-3.5 h-3.5 text-sky-500" />}
                      {item.type === 'note' && <FileText className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                  )}

                  {/* Title with MiddleTruncate */}
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <MiddleTruncate
                      value={item.title}
                      className={`text-xs font-semibold ${
                        item.status === 'done'
                          ? 'line-through text-[#6b7280] dark:text-[#a1a1aa]'
                          : 'text-[#111827] dark:text-[#f4f4f5]'
                      }`}
                    />
                  </div>

                  {/* Checklist count badge */}
                  {item.checklist && item.checklist.length > 0 && (
                    <span className="text-[10px] text-[#9ca3af] dark:text-[#71717a] font-mono shrink-0 bg-[#f3f4f6] dark:bg-[#27272a] px-1 py-0.5 rounded leading-none">
                      {item.checklist.filter((c: ChecklistItem) => c.isCompleted).length}/
                      {item.checklist.length}
                    </span>
                  )}
                </div>

                {/* Right Columns: Project & Date */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Project Column */}
                  {viewMode.type !== 'project' && (
                    <div className={isPaneOpen ? 'max-w-[90px] shrink-0' : 'w-[110px] sm:w-[130px] flex items-center justify-start shrink-0'}>
                      <span
                        title={project?.name || 'No Project'}
                        className="inline-flex items-center gap-1.5 text-[11px] text-[#6b7280] dark:text-[#a1a1aa] font-medium truncate"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: project?.color || '#9ca3af' }}
                        />
                        <span className="truncate">{project?.name || 'No Project'}</span>
                      </span>
                    </div>
                  )}

                  {/* Date Column */}
                  <div className="w-14 text-right text-[11px] text-[#9ca3af] dark:text-[#71717a] font-normal shrink-0">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
