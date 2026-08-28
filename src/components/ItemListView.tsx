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
import { Item, ChecklistItem } from '../types';
import { formatDate, ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../utils/format';
import { MiddleTruncate } from './ui/MiddleTruncate';

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
  } = useLeafStore();

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

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
    }
    return 0;
  });

  // Dynamic context-aware empty state icon, title, and description matching sidebar
  const getEmptyState = () => {
    if (filterOptions.searchQuery.trim()) {
      return {
        Icon: Search,
        title: 'No matching items',
        description: `No items found matching "${filterOptions.searchQuery}". Try a different search term.`,
      };
    }

    switch (viewMode.type) {
      case 'inbox':
        return {
          Icon: Inbox,
          title: 'Your backlog is empty',
          description: 'Capture quick thoughts, ideas, and unassigned tasks into your backlog.',
        };
      case 'all':
        return {
          Icon: Layers,
          title: 'No items in workspace',
          description: 'Capture an idea, task, bug, or note to get started.',
        };
      case 'project': {
        const proj = projects.find((p) => p.id === viewMode.projectId);
        return {
          Icon: Folder,
          title: proj ? `${proj.name} is empty` : 'Project is empty',
          description: 'No items captured in this project yet.',
        };
      }
      case 'type_filter':
        switch (viewMode.itemType) {
          case 'bug':
            return {
              Icon: Bug,
              title: 'No bugs logged',
              description: 'Reported bugs and defects will appear here.',
            };
          case 'idea':
            return {
              Icon: Lightbulb,
              title: 'No ideas captured',
              description: 'Jot down ideas, features, and inspirations.',
            };
          case 'task':
            return {
              Icon: CheckSquare,
              title: 'No tasks scheduled',
              description: 'Action items and todos will appear here.',
            };
          case 'improvement':
            return {
              Icon: Sparkles,
              title: 'No improvements logged',
              description: 'Optimizations and enhancements will appear here.',
            };
          case 'research':
            return {
              Icon: BookOpen,
              title: 'No research notes',
              description: 'Readings, findings, and explorations will appear here.',
            };
          case 'question':
            return {
              Icon: HelpCircle,
              title: 'No open questions',
              description: 'Questions and investigations will appear here.',
            };
          case 'note':
            return {
              Icon: FileText,
              title: 'No quick notes',
              description: 'General notes and snippets will appear here.',
            };
          default:
            return {
              Icon: Layers,
              title: 'No items found',
              description: 'Capture an item to get started.',
            };
        }
      case 'priority_filter':
        return {
          Icon: AlertCircle,
          title: 'No high priority items',
          description: 'Items marked with high or critical priority will appear here.',
        };
      case 'completed':
        return {
          Icon: CheckCircle2,
          title: 'No completed items',
          description: 'Completed tasks and resolved bugs will be archived here.',
        };
      case 'archived':
        return {
          Icon: Archive,
          title: 'Archive is empty',
          description: 'Items you archive will be kept here safely.',
        };
      default:
        return {
          Icon: Layers,
          title: 'No items found',
          description: 'Capture an idea, task, bug, or note to get started.',
        };
    }
  };

  const emptyState = getEmptyState();
  const EmptyIcon = emptyState.Icon;

  const isPaneOpen = Boolean(selectedItemId);

  return (
    <div className={`flex-1 h-full overflow-y-auto overflow-x-hidden ${isPaneOpen ? 'pl-3 pr-2 py-3' : 'p-3'} flex flex-col custom-scrollbar`}>
      {displayItems.length === 0 ? (
        <div className="flex-1 min-h-[360px] w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#e5e7eb] dark:border-[#27272a] rounded-[6px]">
          <div className="w-10 h-10 rounded-full bg-[#f3f4f6] dark:bg-[#27272a] flex items-center justify-center mb-2.5">
            <EmptyIcon className="w-5 h-5 text-[#9ca3af] dark:text-[#71717a]" />
          </div>
          <h3 className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
            {emptyState.title}
          </h3>
          <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] max-w-xs mt-1">
            {emptyState.description}
          </p>
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-medium hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2 min-w-0">
          {displayItems.map((item: Item) => {
            const isSelected = selectedItemId === item.id;
            const isDragged = draggedItemId === item.id;
            const isDragOver = dragOverItemId === item.id;
            const typeConfig = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.task;
            const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.none;

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
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverItemId !== item.id) {
                    setDragOverItemId(item.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverItemId === item.id) {
                    setDragOverItemId(null);
                  }
                }}
                onDragEnd={() => {
                  setDraggedItemId(null);
                  setDragOverItemId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceId = e.dataTransfer.getData('text/plain') || draggedItemId;
                  if (sourceId && sourceId !== item.id) {
                    reorderItems(sourceId, item.id);
                  }
                  setDraggedItemId(null);
                  setDragOverItemId(null);
                }}
                onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-[6px] border transition-all cursor-pointer select-none min-w-0 overflow-hidden ${
                  isSelected
                    ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f9fafb] dark:bg-[#1f1f23] shadow-sm'
                    : 'border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]'
                } ${isDragged ? 'opacity-40' : ''} ${
                  isDragOver ? 'border-t-2 border-t-[#111827] dark:border-t-white' : ''
                }`}
              >
                {/* Left Section: Drag handle, Title with MiddleTruncate, Checklist count */}
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden">
                  <div
                    className="cursor-grab active:cursor-grabbing text-[#d1d5db] dark:text-[#52525b] group-hover:text-[#9ca3af] dark:group-hover:text-[#a1a1aa] transition-colors shrink-0"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
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
                    {item.checklist && item.checklist.length > 0 && (
                      <span className="text-[10px] text-[#9ca3af] dark:text-[#71717a] font-mono shrink-0 bg-[#f3f4f6] dark:bg-[#27272a] px-1 py-0.5 rounded leading-none">
                        {item.checklist.filter((c: ChecklistItem) => c.isCompleted).length}/
                        {item.checklist.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Columns: Type, Priority, Date */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Type Column (compact icon badge or label) */}
                  {isPaneOpen ? (
                    <span
                      title={`Type: ${typeConfig.label}`}
                      className={`inline-flex items-center px-1.5 py-0 text-[9px] font-medium leading-[13px] rounded-full border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border} shrink-0`}
                    >
                      {typeConfig.label}
                    </span>
                  ) : (
                    <div className="w-14 sm:w-16 flex items-center justify-start shrink-0">
                      <span
                        className={`inline-flex items-center px-1.5 py-0 text-[9.5px] font-medium leading-[14px] rounded-full border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}
                      >
                        {typeConfig.label}
                      </span>
                    </div>
                  )}

                  {/* Priority Column */}
                  {item.priority !== 'none' ? (
                    isPaneOpen ? (
                      <span
                        title={`Priority: ${priorityConfig.label}`}
                        className="inline-flex items-center shrink-0"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dotColor} shrink-0`} />
                      </span>
                    ) : (
                      <div className="w-16 sm:w-18 flex items-center justify-start shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6b7280] dark:text-[#a1a1aa] truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dotColor} shrink-0`} />
                          <span className="truncate">{priorityConfig.label}</span>
                        </span>
                      </div>
                    )
                  ) : !isPaneOpen ? (
                    <div className="w-16 sm:w-18 flex items-center justify-start shrink-0">
                      <span className="text-[11px] text-[#9ca3af] dark:text-[#52525b]">—</span>
                    </div>
                  ) : null}

                  {/* Date Column (Full view only) */}
                  {!isPaneOpen && (
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a] w-12 sm:w-14 text-right shrink-0 hidden md:block">
                      {formatDate(item.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
