import React, { useState, useRef } from 'react';
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
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { Item, ChecklistItem, Project } from '../types';
import { formatDate, formatDueDateLabel } from '../utils/format';
import { getStoredTeamMembers, matchesAssignee } from '../utils/team';
import { resolveAvatarUrl } from '../utils/avatars';
import { getUserPermissions } from '../utils/permissions';

const LinearPriorityIcon: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'critical':
      return (
        <span className="w-4 h-4 flex items-center justify-center text-rose-500 shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
        </span>
      );
    case 'high':
      return (
        <span className="w-4 h-4 flex items-end justify-center gap-[1.5px] pb-0.5 shrink-0">
          <span className="w-[2px] h-[4px] bg-amber-500 rounded-full" />
          <span className="w-[2px] h-[7px] bg-amber-500 rounded-full" />
          <span className="w-[2px] h-[10px] bg-amber-500 rounded-full" />
        </span>
      );
    case 'medium':
      return (
        <span className="w-4 h-4 flex items-end justify-center gap-[1.5px] pb-0.5 shrink-0">
          <span className="w-[2px] h-[4px] bg-amber-500/80 rounded-full" />
          <span className="w-[2px] h-[7px] bg-amber-500/80 rounded-full" />
          <span className="w-[2px] h-[10px] bg-[#e5e7eb] dark:bg-[#3f3f46] rounded-full" />
        </span>
      );
    case 'low':
      return (
        <span className="w-4 h-4 flex items-end justify-center gap-[1.5px] pb-0.5 shrink-0">
          <span className="w-[2px] h-[4px] bg-blue-400 rounded-full" />
          <span className="w-[2px] h-[7px] bg-[#e5e7eb] dark:bg-[#3f3f46] rounded-full" />
          <span className="w-[2px] h-[10px] bg-[#e5e7eb] dark:bg-[#3f3f46] rounded-full" />
        </span>
      );
    default:
      return (
        <span className="w-4 h-4 flex items-center justify-center text-[#9ca3af] dark:text-[#52525b] text-[11px] shrink-0 font-mono select-none">
          —
        </span>
      );
  }
};

export const ItemListView: React.FC = () => {
  const {
    items,
    projects,
    workspace,
    viewMode,
    selectedItemId,
    setSelectedItemId,
    setQuickCaptureOpen,
    reorderItems,
    filterOptions,
    setFilterOptions,
  } = useLeafStore();

  const permissions = getUserPermissions(workspace?.id);

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' } | null>(null);
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false);

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

  const completedSectionRef = useRef<HTMLDivElement>(null);

  // Backlog metrics
  const inboxItems = viewMode.type === 'inbox' ? items.filter((i) => i.status === 'inbox') : [];
  const urgentInboxCount = viewMode.type === 'inbox' ? inboxItems.filter((i) => i.priority === 'high' || i.priority === 'critical').length : 0;

  // Interactive filtering states & handlers
  const isUrgentFilterActive = Boolean(
    filterOptions.priorities?.includes('critical') && filterOptions.priorities?.includes('high')
  );

  const toggleUrgentFilter = () => {
    if (isUrgentFilterActive) {
      setFilterOptions({ ...filterOptions, priorities: [] });
    } else {
      setFilterOptions({ ...filterOptions, priorities: ['critical', 'high'] });
    }
  };

  const clearPriorityFilters = () => {
    setFilterOptions({ ...filterOptions, priorities: [] });
  };

  // Split displayItems for project view (active vs completed)
  const activeProjectDisplayItems = viewMode.type === 'project' ? displayItems.filter((i) => i.status !== 'done') : displayItems;
  const completedProjectDisplayItems = viewMode.type === 'project' ? displayItems.filter((i) => i.status === 'done') : [];

  const renderItemCard = (item: Item) => {
    const isSelected = selectedItemId === item.id;
    const isDragged = draggedItemId === item.id;
    const isDragOverBefore = dragOverInfo?.id === item.id && dragOverInfo.position === 'before';
    const isDragOverAfter = dragOverInfo?.id === item.id && dragOverInfo.position === 'after';
    const project = projects.find((p: Project) => p.id === item.projectId);

    return (
      <div
        key={item.id}
        data-item-card="true"
        draggable={permissions.canMoveItemStatus(item)}
        onDragStart={(e) => {
          if (!permissions.canMoveItemStatus(item)) {
            e.preventDefault();
            return;
          }
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
            <span className="shrink-0 flex items-center">
              {item.type === 'bug' && <Bug className="w-3.5 h-3.5 text-rose-500" />}
              {item.type === 'idea' && <Lightbulb className="w-3.5 h-3.5 text-amber-500" />}
              {item.type === 'improvement' && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
              {item.type === 'research' && <BookOpen className="w-3.5 h-3.5 text-teal-500" />}
              {item.type === 'question' && <HelpCircle className="w-3.5 h-3.5 text-sky-500" />}
              {item.type === 'note' && <FileText className="w-3.5 h-3.5 text-slate-400" />}
            </span>
          )}

          {/* Title */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <span
              className={`text-xs font-semibold truncate block ${
                item.status === 'done'
                  ? 'line-through text-[#6b7280] dark:text-[#a1a1aa]'
                  : 'text-[#111827] dark:text-[#f4f4f5]'
              }`}
            >
              {item.title}
            </span>
          </div>

          {/* Checklist count badge */}
          {item.checklist && item.checklist.length > 0 && (
            <span className="text-[10px] text-[#9ca3af] dark:text-[#71717a] font-mono shrink-0 bg-[#f3f4f6] dark:bg-[#27272a] px-1 py-0.5 rounded leading-none">
              {item.checklist.filter((c: ChecklistItem) => c.isCompleted).length}/
              {item.checklist.length}
            </span>
          )}
        </div>

        {/* Right Columns: Due Date, Assignee, Project & Date */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Due Date Indicator */}
          {item.dueAt && (
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[10.5px] text-[#6b7280] dark:text-[#a1a1aa] font-medium bg-[#f4f5f6] dark:bg-[#202024] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a] shrink-0"
            >
              <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>{formatDueDateLabel(item.dueAt)}</span>
            </span>
          )}

          {/* Assignee Avatar Indicator */}
          {item.assigneeId && (() => {
            const assignedMember = getStoredTeamMembers(workspace?.id).find(m => matchesAssignee(m.id, item.assigneeId));
            return (
              <span
                className="w-4 h-4 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden shadow-2xs"
              >
                <img
                  src={resolveAvatarUrl(assignedMember?.avatarMascot || assignedMember?.avatarUrl || assignedMember?.avatarColor, assignedMember?.name || item.assigneeId)}
                  alt={assignedMember?.name || 'Assigned'}
                  className="w-full h-full object-cover"
                />
              </span>
            );
          })()}

          {/* Project Column */}
          {viewMode.type !== 'project' && (
            <div className={isPaneOpen ? 'max-w-[90px] shrink-0' : 'w-[100px] sm:w-[120px] flex items-center justify-start shrink-0'}>
              <span
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
  };

  return (
    <div className={`flex-1 h-full overflow-y-auto overflow-x-hidden ${isPaneOpen ? 'pl-3 pr-2 py-3' : 'p-3'} flex flex-col custom-scrollbar`}>

      {/* 2. BACKLOG METRICS: COMPACT 3 STAT CARDS + FAR-RIGHT PROGRESS RING */}
      {viewMode.type === 'inbox' && inboxItems.length > 0 && (
        <div className="mb-2.5 p-1.5 sm:p-2 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xs flex items-center justify-between gap-2">
          {/* Left: 3 Interactive Stat Cards */}
          <div className="grid grid-cols-3 gap-1.5 flex-1 min-w-0">
            {/* 1. All Backlog Card */}
            <button
              type="button"
              onClick={clearPriorityFilters}
              title="Show all backlog items"
              className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-[6px] border transition-all text-left cursor-pointer select-none active:scale-[0.98] ${
                !isUrgentFilterActive
                  ? 'bg-[#f4f5f6]/90 dark:bg-[#202024] border-[#d1d5db] dark:border-[#3f3f46] shadow-2xs'
                  : 'bg-[#fafafa] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]'
              }`}
            >
              <Layers className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <div className="text-xs font-bold text-[#111827] dark:text-white leading-none truncate">
                  {inboxItems.length}
                </div>
                <div className="text-[9px] font-medium text-[#6b7280] dark:text-[#a1a1aa] truncate mt-0.5 leading-none">
                  Total
                </div>
              </div>
            </button>

            {/* 2. Urgent Triage Card */}
            <button
              type="button"
              onClick={toggleUrgentFilter}
              title={isUrgentFilterActive ? 'Clear urgent filter' : 'Filter by urgent items needing triage (High & Critical)'}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-[6px] border transition-all text-left cursor-pointer select-none active:scale-[0.98] ${
                isUrgentFilterActive
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-2xs ring-1 ring-rose-500/30'
                  : urgentInboxCount > 0
                  ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border-rose-500/20 hover:border-rose-500/35'
                  : 'bg-[#fafafa] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]'
              }`}
            >
              <AlertCircle
                className={`w-3 h-3 shrink-0 ${
                  urgentInboxCount > 0 ? 'text-rose-500' : 'text-[#9ca3af] dark:text-[#71717a]'
                }`}
              />
              <div className="min-w-0 flex-1 truncate">
                <div
                  className={`text-xs font-bold leading-none truncate ${
                    urgentInboxCount > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[#111827] dark:text-white'
                  }`}
                >
                  {urgentInboxCount}
                </div>
                <div className="text-[9px] font-medium text-[#6b7280] dark:text-[#a1a1aa] truncate mt-0.5 flex items-center justify-between leading-none">
                  <span>Urgent</span>
                  {isUrgentFilterActive && <X className="w-2 h-2 ml-0.5 opacity-70" />}
                </div>
              </div>
            </button>

            {/* 3. Standard Queue Card */}
            <button
              type="button"
              onClick={clearPriorityFilters}
              title="Standard queue items"
              className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-[6px] bg-[#fafafa] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-all text-left cursor-pointer select-none active:scale-[0.98]"
            >
              <Inbox className="w-3 h-3 text-indigo-500 shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <div className="text-xs font-bold text-[#111827] dark:text-white leading-none truncate">
                  {inboxItems.length - urgentInboxCount}
                </div>
                <div className="text-[9px] font-medium text-[#6b7280] dark:text-[#a1a1aa] truncate mt-0.5 leading-none">
                  Standard
                </div>
              </div>
            </button>
          </div>

          {/* Right: Circular Triage Ring & Summary */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e5e7eb] dark:border-[#27272a] shrink-0">
            <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
              <svg className="w-7 h-7 -rotate-90 transform" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="text-[#e5e7eb] dark:text-[#27272a]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  style={{ stroke: urgentInboxCount > 0 ? '#f43f5e' : '#6366f1' }}
                  strokeWidth="3.5"
                  strokeDasharray={88}
                  strokeDashoffset={
                    inboxItems.length > 0
                      ? 88 - Math.round(((inboxItems.length - urgentInboxCount) / inboxItems.length) * 88)
                      : 0
                  }
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-[8px] font-bold text-[#111827] dark:text-white font-mono leading-none">
                {inboxItems.length > 0
                  ? Math.round(((inboxItems.length - urgentInboxCount) / inboxItems.length) * 100)
                  : 100}%
              </span>
            </div>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] font-bold text-[#111827] dark:text-white leading-tight">
                {inboxItems.length}
              </span>
              <span className="text-[9px] text-[#6b7280] dark:text-[#a1a1aa] leading-none">
                In Queue
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. ITEMS LIST CONTENT */}
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
      ) : viewMode.type === 'project' ? (
        <div className="space-y-3 min-w-0">
          {/* Active Tasks in Project */}
          {activeProjectDisplayItems.length === 0 ? (
            <div className="p-4 rounded-[8px] bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {isUrgentFilterActive
                    ? 'No urgent tasks match the filter!'
                    : 'All active tasks in this project are completed! 🎉'}
                </span>
              </div>
              {isUrgentFilterActive ? (
                <button
                  onClick={clearPriorityFilters}
                  className="px-2.5 py-1 bg-[#f3f4f6] dark:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[5px] text-xs font-medium hover:bg-[#e5e7eb] transition-colors shrink-0"
                >
                  Show All Tasks
                </button>
              ) : (
                permissions.canCreateItems && (
                  <button
                    onClick={() => setQuickCaptureOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 dark:bg-emerald-500 text-white rounded-[5px] text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
                  >
                    + Add Task
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="space-y-2 min-w-0">
              {activeProjectDisplayItems.map(renderItemCard)}
            </div>
          )}

          {/* Collapsible Completed Tasks Section */}
          {completedProjectDisplayItems.length > 0 && (
            <div ref={completedSectionRef} className="pt-3 border-t border-[#e5e7eb] dark:border-[#27272a] space-y-2 scroll-mt-6">
              <button
                type="button"
                onClick={() => setIsCompletedSectionOpen(!isCompletedSectionOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white transition-colors py-1 px-1 rounded select-none group"
              >
                {isCompletedSectionOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#111827] dark:group-hover:text-white transition-transform" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#111827] dark:group-hover:text-white transition-transform" />
                )}
                <span>Completed</span>
                <span className="text-[10.5px] font-medium bg-[#f3f4f6] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-full">
                  {completedProjectDisplayItems.length}
                </span>
              </button>

              {isCompletedSectionOpen && (
                <div className="space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                  {completedProjectDisplayItems.map(renderItemCard)}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 min-w-0">
          {displayItems.map(renderItemCard)}
        </div>
      )}
    </div>
  );
};
