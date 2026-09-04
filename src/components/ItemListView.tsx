import React, { useState, useRef } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import {
  GripVertical,
  Layers,
  Plus,
  Inbox,
  Folder,
  FolderOpen,
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
  Info,
} from 'lucide-react';
import { Item, ChecklistItem, Project } from '../types';
import { useComponentStore } from '../store/useComponentStore';
import { ComponentModal } from './ComponentModal';
import { formatDate, formatDueDateLabel } from '../utils/format';
import { resolveAssignee } from '../utils/team';
import { getUserPermissions } from '../utils/permissions';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { ItemBoardView } from './ItemBoardView';
import { ItemCardGridView } from './ItemCardGridView';
import { openUrl } from '@tauri-apps/plugin-opener';

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
    itemViewLayout,
  } = useLeafStore();

  const permissions = getUserPermissions(workspace?.id);

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' } | null>(null);
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false);

  // Component store
  const {
    getComponentsForProject,
    selectedComponentId,
    setSelectedComponentId,
    loadComponents,
    isComponentModalOpen,
    editingComponent,
    openComponentModal,
    closeComponentModal,
  } = useComponentStore();
  const activeProjectId = viewMode.type === 'project' ? viewMode.projectId : null;
  const projectComponents = activeProjectId ? getComponentsForProject(activeProjectId) : [];

  // Persistent right-click hint state (stored in localStorage)
  const [hasDismissedComponentHint, setHasDismissedComponentHint] = useState(() => {
    try {
      return localStorage.getItem('leeflet_component_right_click_hint_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterComp = (id: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (!hasDismissedComponentHint) {
      setHoveredComponentId(id);
    }
  };

  const handleMouseLeaveComp = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setHoveredComponentId(null);
    }, 250);
  };

  const handleDismissComponentHint = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    try {
      localStorage.setItem('leeflet_component_right_click_hint_dismissed', 'true');
    } catch {}
    setHasDismissedComponentHint(true);
    setHoveredComponentId(null);
  };

  // Load components when project changes
  React.useEffect(() => {
    if (activeProjectId) {
      loadComponents(activeProjectId);
    } else {
      setSelectedComponentId(null);
    }
  }, [activeProjectId, loadComponents, setSelectedComponentId]);

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

  // Dynamic context-aware playful empty states with short, punchy subtexts
  const getEmptyState = () => {
    if (filterOptions.searchQuery.trim()) {
      return {
        Icon: Search,
        emoji: '',
        badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
        glowColor: 'from-zinc-500/10 to-stone-500/10',
        title: 'No clues found',
        description: 'Try different keywords or check spelling.',
        actionLabel: 'Clear Search',
        onAction: () => setFilterOptions({ searchQuery: '' }),
      };
    }

    switch (viewMode.type) {
      case 'inbox':
        return {
          Icon: Inbox,
          emoji: '',
          badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
          glowColor: 'from-zinc-500/10 to-stone-500/10',
          title: 'Inbox zero. Time for coffee?',
          description: 'Your backlog is clear. Enjoy the focus.',
          actionLabel: 'Capture Thought',
          onAction: () => setQuickCaptureOpen(true),
        };
      case 'all':
        return {
          Icon: Layers,
          emoji: '',
          badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
          glowColor: 'from-zinc-500/10 to-stone-500/10',
          title: 'A fresh canvas',
          description: 'Ready whenever inspiration strikes.',
          actionLabel: 'Create First Item',
          onAction: () => setQuickCaptureOpen(true),
        };
      case 'project': {
        const project = projects.find((p) => p.id === viewMode.projectId);
        const name = project?.name || 'Project';
        const activeComp = selectedComponentId && selectedComponentId !== 'unassigned'
          ? projectComponents.find((c) => c.id === selectedComponentId)
          : null;
        if (activeComp) {
          return {
            Icon: Layers,
            emoji: '',
            badgeBg: 'bg-white dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
            glowColor: 'from-zinc-500/10 to-stone-500/10',
            title: `${activeComp.name} is a blank slate`,
            description: 'Add the first piece of this module.',
            actionLabel: `Add to ${activeComp.name}`,
            onAction: () => setQuickCaptureOpen(true),
          };
        }
        if (selectedComponentId === 'unassigned') {
          return {
            Icon: Layers,
            emoji: '',
            badgeBg: 'bg-white dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
            glowColor: 'from-zinc-500/10 to-stone-500/10',
            title: 'All squared away',
            description: 'Every task is neatly sorted in a module.',
            actionLabel: 'Add Task',
            onAction: () => setQuickCaptureOpen(true),
          };
        }
        return {
          Icon: Folder,
          HoverIcon: FolderOpen,
          emoji: '',
          badgeBg: 'bg-white dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]',
          glowColor: 'from-zinc-500/10 to-stone-500/10',
          title: `${name} is ready for action`,
          description: 'Every great project starts with step one.',
          actionLabel: `Add First Task`,
          onAction: () => setQuickCaptureOpen(true),
        };
      }
      case 'type_filter':
        switch (viewMode.itemType) {
          case 'bug':
            return {
              Icon: Bug,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'Bug-free paradise',
              description: 'Zero defects reported. Smooth sailing!',
              actionLabel: 'Report a Bug',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'idea':
            return {
              Icon: Lightbulb,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'Waiting for the spark',
              description: 'Jot it down before inspiration fades.',
              actionLabel: 'Jot an Idea',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'task':
            return {
              Icon: CheckSquare,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'All caught up!',
              description: 'Nothing pending on your plate right now.',
              actionLabel: 'New Task',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'improvement':
            return {
              Icon: Sparkles,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'Polished to a shine',
              description: 'Spot something to level up next?',
              actionLabel: 'Log Improvement',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'research':
            return {
              Icon: BookOpen,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'Down the rabbit hole',
              description: 'Save bookmarks, reads, and deep dives.',
              actionLabel: 'Add Research Note',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'question':
            return {
              Icon: HelpCircle,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'Zero mysteries today',
              description: 'No open questions on the radar.',
              actionLabel: 'Ask a Question',
              onAction: () => setQuickCaptureOpen(true),
            };
          case 'note':
            return {
              Icon: FileText,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'Fresh notepad',
              description: 'Snippets, notes, and quick thoughts.',
              actionLabel: 'Take a Note',
              onAction: () => setQuickCaptureOpen(true),
            };
          default:
            return {
              Icon: Layers,
              emoji: '',
              badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
              glowColor: 'from-zinc-500/10 to-stone-500/10',
              title: 'All caught up',
              description: 'Ready whenever inspiration strikes.',
              actionLabel: 'New Item',
              onAction: () => setQuickCaptureOpen(true),
            };
        }
      case 'priority_filter':
        return {
          Icon: AlertCircle,
          emoji: '',
          badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
          glowColor: 'from-zinc-500/10 to-stone-500/10',
          title: 'Smooth sailing',
          description: 'No urgent fires to put out right now.',
          actionLabel: 'Add Priority Task',
          onAction: () => setQuickCaptureOpen(true),
        };
      case 'completed':
        return {
          Icon: CheckCircle2,
          emoji: '',
          badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
          glowColor: 'from-zinc-500/10 to-stone-500/10',
          title: 'Trophies go here',
          description: 'Check off tasks to watch them stack up.',
          actionLabel: 'Go to Queue',
          onAction: () => useLeafStore.getState().setViewMode({ type: 'my_queue' }),
        };
      case 'archived':
        return {
          Icon: Archive,
          emoji: '',
          badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
          glowColor: 'from-zinc-500/10 to-stone-500/10',
          title: 'The vault is quiet',
          description: 'Retired items will rest safely here.',
          actionLabel: 'Back to Backlog',
          onAction: () => useLeafStore.getState().setViewMode({ type: 'inbox' }),
        };
      default:
        return {
          Icon: Layers,
          emoji: '',
          badgeBg: 'bg-[#f4f5f6] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] border-[#e5e7eb] dark:border-[#27272a]',
          glowColor: 'from-zinc-500/10 to-stone-500/10',
          title: 'No items in this view',
          description: 'Capture a task or note to get things rolling.',
          actionLabel: 'New Item',
          onAction: () => setQuickCaptureOpen(true),
        };
    }
  };

  const emptyState = getEmptyState();

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
  // When a component filter is active, scope items to just that component (or unassigned)
  const componentFilteredItems = viewMode.type === 'project' && selectedComponentId
    ? selectedComponentId === 'unassigned'
      ? displayItems.filter((i) => !i.componentId)
      : displayItems.filter((i) => i.componentId === selectedComponentId)
    : displayItems;

  const activeProjectDisplayItems = viewMode.type === 'project' ? componentFilteredItems.filter((i) => i.status !== 'done') : componentFilteredItems;
  const completedProjectDisplayItems = viewMode.type === 'project' ? componentFilteredItems.filter((i) => i.status === 'done') : [];

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

          {/* GitHub Issue Link Badge */}
          {item.githubIssueNumber && (
            <a
              href={item.githubIssueUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (item.githubIssueUrl) {
                  try {
                    openUrl(item.githubIssueUrl);
                  } catch {
                    window.open(item.githubIssueUrl, '_blank');
                  }
                }
              }}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white bg-[#f4f5f6] dark:bg-[#202024] hover:bg-[#e5e7eb] dark:hover:bg-[#27272a] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a] shrink-0 transition-colors cursor-pointer"
              title={`GitHub Issue #${item.githubIssueNumber}${item.githubIssueState ? ` (${item.githubIssueState})` : ''}`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-75 shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>#{item.githubIssueNumber}</span>
            </a>
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
            const assignee = resolveAssignee(item.assigneeId, workspace?.id);
            if (!assignee) return null;
            return (
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <span
                    className="w-4 h-4 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden shadow-2xs cursor-default flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={assignee.avatarUrl}
                      alt={assignee.name}
                      className="w-full h-full object-cover"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px] font-medium py-1 px-2">
                  <span>{assignee.name}</span>
                </TooltipContent>
              </Tooltip>
            );
          })()}
          {/* Component Badge in Project View */}
          {viewMode.type === 'project' && item.componentId && (() => {
            const comp = projectComponents.find((c) => c.id === item.componentId);
            if (!comp) return null;
            const compColor = comp.color?.trim();
            return (
              <span
                className={`hidden sm:inline-flex items-center text-[11px] font-medium shrink-0 ${!compColor ? 'text-[#6b7280] dark:text-[#a1a1aa]' : ''}`}
                style={compColor ? { color: compColor } : undefined}
              >
                <span className="truncate max-w-[100px]">{comp.name}</span>
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

  const renderEmptyStateCard = () => {
    const IconComp = emptyState.Icon;
    const HoverIconComp = (emptyState as any).HoverIcon;

    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] bg-gradient-to-b from-transparent to-[#fafafa]/60 dark:to-[#18181b]/30 my-auto min-h-[340px]">
        {/* Playful animated icon badge with hover opening folder */}
        <div
          onClick={emptyState.onAction}
          className="relative mb-3.5 group cursor-pointer select-none"
        >
          <div
            className={`absolute -inset-2 bg-gradient-to-br ${emptyState.glowColor} rounded-3xl blur-md opacity-35 group-hover:opacity-75 group-hover:scale-105 transition-all duration-300`}
          />
          <div
            className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-sm ${emptyState.badgeBg}`}
          >
            {HoverIconComp ? (
              <div className="relative w-5 h-5 flex items-center justify-center">
                <IconComp className="w-5 h-5 transition-all duration-300 ease-out group-hover:opacity-0 group-hover:scale-75 group-hover:-rotate-6" />
                <HoverIconComp className="absolute inset-0 w-5 h-5 transition-all duration-300 ease-out opacity-0 scale-75 rotate-6 group-hover:opacity-100 group-hover:scale-100 group-hover:rotate-0 text-[#111827] dark:text-white" />
              </div>
            ) : (
              <IconComp className="w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-105" />
            )}
          </div>
          {emptyState.emoji && (
            <span className="absolute -bottom-1 -right-1 text-sm select-none drop-shadow-xs transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110">
              {emptyState.emoji}
            </span>
          )}
        </div>

        <h3 className="text-sm sm:text-[15px] font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
          {emptyState.title}
        </h3>
        <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] max-w-xs mt-1.5 leading-relaxed">
          {emptyState.description}
        </p>
        <div className="flex items-center justify-center mt-4">
          <button
            onClick={emptyState.onAction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f3f4f6] dark:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-semibold hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-all border border-[#e5e7eb] dark:border-[#3f3f46] shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{emptyState.actionLabel}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex-1 h-full ${itemViewLayout === 'board' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden custom-scrollbar'} ${isPaneOpen ? 'pl-3 pr-2 py-3' : 'p-3'} flex flex-col`}>

      {/* 2. BACKLOG METRICS: SLEEK METRIC STRIP & PROGRESS PILL */}
      {viewMode.type === 'inbox' && inboxItems.length > 0 && (
        <div className="mb-3 pb-2.5 px-0.5 border-b border-[#e5e7eb]/70 dark:border-[#27272a]/70 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Left: 3 Interactive Metric Filter Pills */}
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {/* 1. All Backlog Pill */}
            <button
              type="button"
              onClick={clearPriorityFilters}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-xs font-medium transition-all cursor-pointer select-none active:scale-[0.98] ${
                !isUrgentFilterActive
                  ? 'bg-[#e4e5e7] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border-[#d1d5db] dark:border-[#3f3f46] font-semibold shadow-2xs'
                  : 'bg-[#f4f5f6] dark:bg-[#18181b] border-[#e5e7eb] dark:border-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#222226]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold">{inboxItems.length}</span>
              <span className="opacity-75 text-[11px]">Total</span>
            </button>

            {/* 2. Urgent Triage Pill */}
            <button
              type="button"
              onClick={toggleUrgentFilter}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-xs font-medium transition-all cursor-pointer select-none active:scale-[0.98] ${
                isUrgentFilterActive
                  ? 'bg-[#e4e5e7] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border-[#d1d5db] dark:border-[#3f3f46] font-semibold shadow-2xs'
                  : 'bg-[#f4f5f6] dark:bg-[#18181b] border-[#e5e7eb] dark:border-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#222226]'
              }`}
            >
              <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${urgentInboxCount > 0 ? 'text-rose-500' : 'text-[#6b7280] dark:text-[#a1a1aa]'}`} />
              <span className="font-bold">{urgentInboxCount}</span>
              <span className="opacity-85 text-[11px]">Urgent</span>
              {isUrgentFilterActive && <X className="w-3 h-3 ml-0.5 opacity-80" />}
            </button>
          </div>

          {/* Right: Circular Triage Ring & Status */}
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-[6px] bg-[#f4f5f6]/80 dark:bg-[#1a1a1e]/80 border border-[#e5e7eb] dark:border-[#27272a] shrink-0 select-none">
            <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="text-[#e5e7eb] dark:text-[#27272a]"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  style={{ stroke: urgentInboxCount > 0 ? '#f43f5e' : '#6366f1' }}
                  strokeWidth="4"
                  strokeDasharray={88}
                  strokeDashoffset={
                    inboxItems.length > 0
                      ? 88 - Math.round(((inboxItems.length - urgentInboxCount) / inboxItems.length) * 88)
                      : 0
                  }
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-[#111827] dark:text-white text-[11.5px]">
                {inboxItems.length > 0
                  ? Math.round(((inboxItems.length - urgentInboxCount) / inboxItems.length) * 100)
                  : 100}%
              </span>
              <span className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] hidden sm:inline">
                triaged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. ITEMS LIST CONTENT */}
      {viewMode.type === 'project' ? (
        <div className={`flex-1 min-w-0 min-h-0 flex flex-col ${itemViewLayout === 'board' ? 'overflow-hidden' : ''}`}>
          {/* Component Filter Ribbon — ALWAYS rendered in project view */}
          <div className="shrink-0 mb-3 flex items-center gap-1.5 flex-wrap">
            {projectComponents.length > 0 ? (
              <>
                {/* All Tasks tab */}
                <button
                  onClick={() => setSelectedComponentId(null)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all whitespace-nowrap cursor-pointer active:scale-95 border ${
                    !selectedComponentId
                      ? 'bg-[#111827] dark:bg-[#27272a] text-white dark:text-[#f4f4f5] border-[#111827] dark:border-[#3f3f46] shadow-xs'
                      : 'bg-[#f3f4f6] dark:bg-[#18181b] border-transparent text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#e5e7eb] dark:hover:bg-[#222226] hover:text-[#111827] dark:hover:text-[#f4f4f5]'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>All Tasks</span>
                  <span className={`text-[11px] font-normal ${!selectedComponentId ? 'text-white/80 dark:text-[#a1a1aa]' : 'text-[#6b7280] dark:text-[#71717a]'}`}>
                    {displayItems.filter(i => i.status !== 'done').length}
                  </span>
                </button>

                {/* Per-component tabs styled with actual component color */}
                {projectComponents.map((comp) => {
                  const compActiveCount = displayItems.filter(i => i.componentId === comp.id && i.status !== 'done').length;
                  const isActive = selectedComponentId === comp.id;
                  const compColor = comp.color?.trim();
                  return (
                    <div
                      key={comp.id}
                      className="relative inline-flex items-center"
                      onMouseEnter={() => handleMouseEnterComp(comp.id)}
                      onMouseLeave={handleMouseLeaveComp}
                    >
                      <button
                        onClick={() => setSelectedComponentId(comp.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          openComponentModal(comp);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all whitespace-nowrap cursor-pointer active:scale-95 border ${
                          !compColor
                            ? isActive
                              ? 'bg-[#111827] dark:bg-[#27272a] text-white dark:text-[#f4f4f5] border-[#111827] dark:border-[#3f3f46] shadow-xs'
                              : 'bg-[#f3f4f6] dark:bg-[#18181b] border-[#e5e7eb] dark:border-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#e5e7eb] dark:hover:bg-[#222226] hover:text-[#111827] dark:hover:text-white'
                            : ''
                        }`}
                        style={
                          compColor
                            ? isActive
                              ? {
                                  backgroundColor: compColor,
                                  color: '#ffffff',
                                  boxShadow: `0 2px 8px ${compColor}40`,
                                  border: `1px solid ${compColor}`,
                                }
                              : {
                                  backgroundColor: `${compColor}1a`,
                                  color: compColor,
                                  border: `1px solid ${compColor}45`,
                                }
                            : undefined
                        }
                        title={hasDismissedComponentHint ? 'Click to filter · Right-click to edit or delete' : undefined}
                      >
                        <span className="truncate max-w-[120px]">{comp.name}</span>
                        <span className={`text-[11px] font-normal ${isActive ? (compColor ? 'text-white/85' : 'text-white/80 dark:text-[#a1a1aa]') : 'opacity-75'}`}>
                          {compActiveCount}
                        </span>
                      </button>

                      {/* Contextual Floating Tooltip on Hover with hit bridge */}
                      {!hasDismissedComponentHint && hoveredComponentId === comp.id && (
                        <div
                          onMouseEnter={() => {
                            if (leaveTimerRef.current) {
                              clearTimeout(leaveTimerRef.current);
                              leaveTimerRef.current = null;
                            }
                          }}
                          onMouseLeave={handleMouseLeaveComp}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 flex items-center gap-2 px-2.5 py-1 bg-[#18181b] dark:bg-[#202024] text-white text-[11px] rounded-[6px] border border-black/15 dark:border-white/10 shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 select-none pointer-events-auto before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-[#18181b] dark:border-b-[#202024]" />
                          <div className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
                            <span>Right-click to edit or delete</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissComponentHint();
                            }}
                            className="px-1.5 py-0.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded text-[10px] transition-colors cursor-pointer ml-0.5"
                          >
                            Got it
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned tab */}
                {(() => {
                  const unassignedCount = displayItems.filter(i => !i.componentId && i.status !== 'done').length;
                  if (unassignedCount === 0) return null;
                  const isActive = selectedComponentId === 'unassigned';
                  return (
                    <button
                      onClick={() => setSelectedComponentId('unassigned')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all whitespace-nowrap cursor-pointer active:scale-95 border ${
                        isActive
                          ? 'bg-[#111827] dark:bg-[#27272a] text-white dark:text-[#f4f4f5] border-[#111827] dark:border-[#3f3f46] shadow-xs'
                          : 'bg-[#f3f4f6] dark:bg-[#18181b] border-transparent text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#e5e7eb] dark:hover:bg-[#222226] hover:text-[#111827] dark:hover:text-[#f4f4f5]'
                      }`}
                    >
                      <span>Unassigned</span>
                      <span className={`text-[11px] font-normal ${isActive ? 'text-white/80 dark:text-[#111113]/80' : 'text-[#6b7280] dark:text-[#71717a]'}`}>
                        {unassignedCount}
                      </span>
                    </button>
                  );
                })()}

                {/* + Module button */}
                {permissions.canCreateItems && (
                  <button
                    onClick={() => openComponentModal()}
                    className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] border border-dashed border-[#d1d5db] dark:border-[#3f3f46] transition-all whitespace-nowrap cursor-pointer"
                    title="Create new module (Shortcut: M)"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="text-[11px]">Module</span>
                  </button>
                )}
              </>
            ) : (
              permissions.canCreateItems && (
                <div className="flex items-center justify-start pb-0.5">
                  <button
                    onClick={() => openComponentModal()}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[6px] border border-dashed border-[#e5e7eb] dark:border-[#27272a] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Module</span>
                  </button>
                </div>
              )
            )}
          </div>

          {/* If project has NO tasks at all, render project empty state with Add Task + Add Component */}
          {activeProjectDisplayItems.length === 0 && completedProjectDisplayItems.length === 0 ? (
            renderEmptyStateCard()
          ) : itemViewLayout === 'board' ? (
            <ItemBoardView
              items={componentFilteredItems}
              projectComponents={projectComponents}
              activeProjectId={activeProjectId ?? undefined}
            />
          ) : itemViewLayout === 'cards' ? (
            <ItemCardGridView
              items={displayItems}
              projectComponents={projectComponents}
              activeProjectId={activeProjectId ?? undefined}
            />
          ) : (
            <>
              {activeProjectDisplayItems.length === 0 ? (
                isUrgentFilterActive ? (
                  <div className="p-3 rounded-[8px] bg-[#f9fafb] dark:bg-[#18181b]/50 border border-[#e5e7eb] dark:border-[#27272a] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#374151] dark:text-[#ededef]">
                      <CheckCircle2 className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                      <span>No urgent tasks match the filter!</span>
                    </div>
                    <button
                      onClick={clearPriorityFilters}
                      className="px-2.5 py-1 bg-[#f3f4f6] dark:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] border border-[#e5e7eb] dark:border-[#3f3f46] rounded-[5px] text-xs font-medium hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors shrink-0 cursor-pointer"
                    >
                      Show All Tasks
                    </button>
                  </div>
                ) : null
              ) : (
                <div className="space-y-2 min-w-0">
                  {activeProjectDisplayItems.map(renderItemCard)}
                </div>
              )}

              {/* Collapsible Completed Tasks Section */}
              {completedProjectDisplayItems.length > 0 && (
                <div
                  ref={completedSectionRef}
                  className={`${activeProjectDisplayItems.length > 0 ? 'pt-3 border-t border-[#e5e7eb] dark:border-[#27272a]' : 'pt-1'} space-y-2 scroll-mt-6`}
                >
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
            </>
          )}
        </div>
      ) : displayItems.length === 0 ? (
        renderEmptyStateCard()
      ) : itemViewLayout === 'board' ? (
        <ItemBoardView
          items={items.filter((item: Item) => {
            // For board view: skip status-only restrictions so dragging between columns works.
            // Still enforce project/type/search/archived filters.
            if (item.status === 'archived') return false;
            if (viewMode.type === 'type_filter' && item.type !== viewMode.itemType) return false;
            if (viewMode.type === 'priority_filter' && item.priority !== 'high' && item.priority !== 'critical') return false;
            if (filterOptions.searchQuery.trim()) {
              const q = filterOptions.searchQuery.toLowerCase();
              if (!item.title.toLowerCase().includes(q) && !item.content?.toLowerCase().includes(q) && !item.tags.some((t: string) => t.toLowerCase().includes(q))) return false;
            }
            if (filterOptions.projectIds?.length && !filterOptions.projectIds.includes(item.projectId)) return false;
            if (filterOptions.types?.length && !filterOptions.types.includes(item.type)) return false;
            if (filterOptions.priorities?.length && !filterOptions.priorities.includes(item.priority)) return false;
            return true;
          })}
          projectComponents={projectComponents}
        />
      ) : itemViewLayout === 'cards' ? (
        <ItemCardGridView
          items={displayItems}
          projectComponents={projectComponents}
        />
      ) : (
        <div className="space-y-2 min-w-0">
          {displayItems.map(renderItemCard)}
        </div>
      )}

      {/* Component Modal */}
      {viewMode.type === 'project' && activeProjectId && (
        <ComponentModal
          isOpen={isComponentModalOpen}
          onClose={closeComponentModal}
          projectId={activeProjectId}
          workspaceId={workspace?.id || ''}
          editingComponent={editingComponent}
        />
      )}
    </div>
  );
};
