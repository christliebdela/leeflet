import React, { useState, useRef, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import {
  Filter,
  ArrowUpDown,
  Plus,
  SquarePen,
  Check,
  RotateCcw,
  CheckSquare,
  Bug,
  Lightbulb,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Cloud,
  CloudOff,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  List,
  Kanban,
  LayoutGrid,
} from 'lucide-react';
import { ItemType, Priority, Project, Item } from '../types';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../utils/format';
import { WindowControls } from './WindowControls';
import { SearchInput } from './ui/SearchInput';
import { getUserPermissions } from '../utils/permissions';
import { toast } from '../store/useToastStore';
import { isWorkspaceCloudSync } from '../services/cloudSync';

const TYPE_ICONS: Record<ItemType, React.FC<{ className?: string }>> = {
  task: CheckSquare,
  bug: Bug,
  idea: Lightbulb,
  improvement: Sparkles,
  research: BookOpen,
  question: HelpCircle,
  note: FileText,
};

export const HeaderBar: React.FC = () => {
  const {
    workspace,
    items,
    projects,
    viewMode,
    filterOptions,
    loadItems,
    loadProjects,
    syncCloudData,
    startRealtime,
    stopRealtime,
    isSidebarCollapsed,
    toggleSidebar,
    setSearchQuery,
    setFilterOptions,
    setProjectModalOpen,
    setQuickCaptureOpen,
    itemViewLayout,
    setItemViewLayout,
  } = useLeafStore();

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'type' | 'priority' | 'project'>('type');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const layoutDropdownRef = useRef<HTMLDivElement>(null);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);

  const permissions = getUserPermissions(workspace?.id);
  const isCurrentUserAdmin = permissions.isAdmin;

  const isCloudSync = workspace ? isWorkspaceCloudSync(workspace.id) : false;

  const handleRefresh = async (silent = false) => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setSyncState('syncing');
    try {
      if (isCloudSync && workspace) {
        await syncCloudData(silent);
      } else {
        await Promise.all([loadItems(), loadProjects()]);
        if (!silent) toast.success('Workspace refreshed');
      }
      setSyncState('synced');
      // Reset synced indicator after 4s
      setTimeout(() => setSyncState('idle'), 4000);
    } catch {
      setSyncState('error');
      if (!silent) toast.error('Failed to sync data');
      setTimeout(() => setSyncState('idle'), 3000);
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  // Online/offline detection
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Manage Realtime WebSocket subscription
  // - When cloud-connected & online: open subscription (zero egress when idle)
  // - When offline or disconnected: tear down subscription
  // - On workspace change: re-subscribe to the new workspace channel
  useEffect(() => {
    if (isCloudSync && isOnline && workspace?.id) {
      // Do an initial full sync to catch anything we missed, then open Realtime
      syncCloudData(true).catch(() => {}).finally(() => startRealtime());
    } else {
      stopRealtime();
    }
    return () => { stopRealtime(); };
  }, [isCloudSync, isOnline, workspace?.id]);

  // Keyboard shortcut: Ctrl+R / F5 → silent refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
        e.preventDefault();
        handleRefresh(false);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspace, isCloudSync, isRefreshing]);

  // Click outside to auto-close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
      if (
        layoutDropdownRef.current &&
        !layoutDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLayoutDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute view header title & stats
  const getHeaderInfo = () => {
    if (viewMode.type === 'inbox') {
      return { title: 'Backlog' };
    }
    if (viewMode.type === 'my_queue') {
      return { title: 'My Queue' };
    }
    if (viewMode.type === 'team') {
      return { title: 'Team Collaboration' };
    }
    if (viewMode.type === 'profile') {
      return { title: 'Account & Profile' };
    }
    if (viewMode.type === 'settings') {
      return { title: 'Settings' };
    }
    if (viewMode.type === 'all') {
      return { title: 'All Items' };
    }
    if (viewMode.type === 'completed') {
      return { title: 'Completed' };
    }
    if (viewMode.type === 'archived') {
      return { title: 'Archived' };
    }
    if (viewMode.type === 'project') {
      const proj = projects.find((p: Project) => p.id === viewMode.projectId);
      return { title: proj ? proj.name : 'Project' };
    }
    if (viewMode.type === 'type_filter') {
      const cfg = ITEM_TYPE_CONFIG[viewMode.itemType as ItemType] || ITEM_TYPE_CONFIG.task;
      return { title: `${cfg.label}s` };
    }
    if (viewMode.type === 'priority_filter') {
      const cfg = PRIORITY_CONFIG[viewMode.priority as Priority] || PRIORITY_CONFIG.none;
      return { title: `${cfg.label} Priority` };
    }
    return { title: 'Items' };
  };

  const headerInfo = getHeaderInfo();

  // Item counts for current view
  const displayItems = items.filter((item: Item) => {
    if (viewMode.type === 'inbox') return item.status === 'inbox';
    if (viewMode.type === 'all') return item.status !== 'archived';
    if (viewMode.type === 'completed') return item.status === 'done';
    if (viewMode.type === 'archived') return item.status === 'archived';
    if (viewMode.type === 'project') return item.projectId === viewMode.projectId && item.status !== 'archived';
    if (viewMode.type === 'type_filter') return item.type === viewMode.itemType && item.status !== 'archived';
    if (viewMode.type === 'priority_filter') return item.priority === viewMode.priority && item.status !== 'archived';
    return true;
  });

  const totalCount = displayItems.length;
  const openCount = displayItems.filter((i: Item) => i.status !== 'done').length;
  const activeProj = viewMode.type === 'project' ? projects.find((p: Project) => p.id === viewMode.projectId) : null;

  const activeProjectsCount = filterOptions.projectIds?.length || 0;
  const activeTypesCount = filterOptions.types?.length || 0;
  const activePrioritiesCount = filterOptions.priorities?.length || 0;
  const activeFilterCount = activeTypesCount + activePrioritiesCount + activeProjectsCount;

  const resetFilters = () => {
    setFilterOptions({ types: undefined, priorities: undefined, projectIds: undefined, statuses: undefined });
  };

  const isSearchExpanded = isSearchFocused || Boolean(filterOptions.searchQuery && filterOptions.searchQuery.trim().length > 0);

  return (
    <header
      data-tauri-drag-region
      className="h-12 px-3 bg-transparent flex items-center justify-between select-none shrink-0"
    >
      {/* Title & Count */}
      <div className="flex items-center gap-1.5 min-w-0 mr-1.5 overflow-hidden" data-tauri-drag-region>
        {/* Sidebar Toggle Button — shown inline with page heading */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1 rounded-[5px] hover:bg-[#e5e7eb] dark:hover:bg-[#27272a] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-center gap-1 min-w-0 shrink-0">
          <h1
            className="text-sm sm:text-base font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-[320px]"
            data-tauri-drag-region
          >
            {headerInfo.title}
          </h1>
          {viewMode.type === 'project' && activeProj && isCurrentUserAdmin && (
            <button
              onClick={() => setProjectModalOpen(true, activeProj)}
              className="p-1 rounded-[4px] hover:bg-[#ebecee] dark:hover:bg-[#27272a] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors shrink-0"
            >
              <SquarePen className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {viewMode.type === 'project' && activeProj && totalCount > 0 ? (() => {
          const completedCount = totalCount - openCount;
          const pct = Math.round((completedCount / totalCount) * 100);

          // Color-code ring stroke only based on completion rate
          let strokeColor = activeProj.color || '#71717a';
          if (pct === 100) {
            strokeColor = '#10b981'; // vibrant green when 100% complete
          } else if (pct >= 66) {
            strokeColor = activeProj.color && activeProj.color !== '#71717a' ? activeProj.color : '#3b82f6';
          } else if (pct >= 33) {
            strokeColor = activeProj.color && activeProj.color !== '#71717a' ? activeProj.color : '#f59e0b';
          }

          return (
            <div
              className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#f4f5f6] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] text-xs font-medium text-[#4b5563] dark:text-[#a1a1aa] shrink-0 shadow-2xs select-none"
              data-tauri-drag-region
            >
              {/* Mini circular progress ring */}
              <div className="relative w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 -rotate-90 transform" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    className="text-[#e5e7eb] dark:text-[#3f3f46]"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    style={{ stroke: strokeColor }}
                    strokeWidth="4"
                    strokeDasharray={88}
                    strokeDashoffset={88 - Math.round((completedCount / totalCount) * 88)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
              </div>

              <span className="font-bold text-[#111827] dark:text-white text-[11px] shrink-0">
                {pct}%
              </span>

              <span
                className={`text-[11px] text-[#6b7280] dark:text-[#a1a1aa] whitespace-nowrap overflow-hidden transition-all duration-200 ease-out inline-flex items-center ${
                  isSearchExpanded
                    ? 'max-w-0 opacity-0 xl:max-w-[200px] xl:opacity-100'
                    : 'max-w-0 opacity-0 md:max-w-[200px] md:opacity-100'
                }`}
              >
                {openCount} active · {completedCount} done
              </span>
            </div>
          );
        })() : (
          viewMode.type !== 'my_queue' && viewMode.type !== 'team' && viewMode.type !== 'profile' && viewMode.type !== 'settings' && totalCount > 0 && (
            <span
              className={`text-xs text-[#6b7280] dark:text-[#a1a1aa] font-normal whitespace-nowrap overflow-hidden transition-all duration-200 ease-out inline-flex items-center ${
                isSearchExpanded
                  ? 'max-w-0 opacity-0 xl:max-w-[200px] xl:opacity-100'
                  : 'max-w-0 opacity-0 md:max-w-[200px] md:opacity-100'
              }`}
              data-tauri-drag-region
            >
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
              {openCount > 0 && ` • ${openCount} open`}
            </span>
          )
        )}
      </div>

      {/* Action Controls & Top Window Controls */}
      <div className="flex items-center gap-1 xl:gap-1.5 shrink-0" data-tauri-drag-region="false">
        {/* Search, Filter, and Sort Controls (Only in list and item views) */}
        {viewMode.type !== 'team' && viewMode.type !== 'profile' && viewMode.type !== 'settings' && (
          <>
            {/* Expandable CmdK Search Input */}
            <SearchInput
              aria-label="Search items"
              cmdk
              value={filterOptions.searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              onFocusStateChange={setIsSearchFocused}
              placeholder="Search..."
            />

        {/* Filter Toggle */}
        <div className="relative shrink-0" ref={filterDropdownRef}>
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`w-7 h-7 xl:w-auto xl:px-2.5 xl:gap-1.5 flex items-center justify-center rounded-[6px] border text-xs font-medium shrink-0 transition-colors relative cursor-pointer ${
              isFilterDropdownOpen || activeFilterCount > 0
                ? 'bg-[#111827] text-white border-[#111827] dark:bg-white dark:text-[#111827] dark:border-white shadow-sm'
                : 'bg-[#f4f5f6] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#27272a]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span
                className={`min-w-3.5 h-3.5 px-0.5 xl:px-1.5 flex items-center justify-center text-[9px] xl:text-[9.5px] rounded-full font-bold shadow-xs leading-none absolute -top-1 -right-1 xl:static xl:top-auto xl:right-auto xl:ml-0.5 ${
                  isFilterDropdownOpen || activeFilterCount > 0
                    ? 'bg-rose-500 text-white'
                    : 'bg-[#111827] text-white dark:bg-white dark:text-[#111827]'
                }`}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          {isFilterDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-modal z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#f3f4f6] dark:border-[#27272a] bg-[#fafafa] dark:bg-[#141416]">
                <span className="font-bold text-[11px] text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                  Filters
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 text-[10.5px] font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Segmented Filter Tabs */}
              <div className="flex border-b border-[#f3f4f6] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#18181b] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('type')}
                  className={`flex-1 py-1 px-1.5 rounded-[5px] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                    activeFilterTab === 'type'
                      ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs'
                      : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <span>Type</span>
                  {activeTypesCount > 0 && (
                    <span className="px-1 py-0 text-[9px] rounded-full bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-bold leading-none">
                      {activeTypesCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('priority')}
                  className={`flex-1 py-1 px-1.5 rounded-[5px] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                    activeFilterTab === 'priority'
                      ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs'
                      : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <span>Priority</span>
                  {activePrioritiesCount > 0 && (
                    <span className="px-1 py-0 text-[9px] rounded-full bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-bold leading-none">
                      {activePrioritiesCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab('project')}
                  className={`flex-1 py-1 px-1.5 rounded-[5px] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                    activeFilterTab === 'project'
                      ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs'
                      : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <span>Project</span>
                  {activeProjectsCount > 0 && (
                    <span className="px-1 py-0 text-[9px] rounded-full bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-bold leading-none">
                      {activeProjectsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content: Item Types */}
              {activeFilterTab === 'type' && (
                <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {(['task', 'bug', 'idea', 'improvement', 'research', 'question', 'note'] as ItemType[]).map((t) => {
                    const ItemIcon = TYPE_ICONS[t];
                    const cfg = ITEM_TYPE_CONFIG[t];
                    const isSelected = filterOptions.types?.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const cur = filterOptions.types || [];
                          const next = isSelected ? cur.filter((x) => x !== t) : [...cur, t];
                          setFilterOptions({ types: next.length > 0 ? next : undefined });
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[5px] text-[11px] transition-colors ${
                          isSelected
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                            : 'text-[#4b5563] dark:text-[#d4d4d8] hover:bg-[#f9fafb] dark:hover:bg-[#222226]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ItemIcon className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                          <span className="truncate">{cfg.label}</span>
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-[#111827] dark:text-white shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab Content: Priority */}
              {activeFilterTab === 'priority' && (
                <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {(['critical', 'high', 'medium', 'low', 'none'] as Priority[]).map((p) => {
                    const pCfg = PRIORITY_CONFIG[p];
                    const isSelected = filterOptions.priorities?.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          const cur = filterOptions.priorities || [];
                          const next = isSelected ? cur.filter((x) => x !== p) : [...cur, p];
                          setFilterOptions({ priorities: next.length > 0 ? next : undefined });
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[5px] text-[11px] transition-colors ${
                          isSelected
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                            : 'text-[#4b5563] dark:text-[#d4d4d8] hover:bg-[#f9fafb] dark:hover:bg-[#222226]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pCfg.dotColor}`} />
                          <span className="truncate">{pCfg.label}</span>
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-[#111827] dark:text-white shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab Content: Project */}
              {activeFilterTab === 'project' && (
                <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {projects.length === 0 ? (
                    <div className="p-2 text-center text-[10.5px] text-[#9ca3af] dark:text-[#71717a] italic">
                      No projects available
                    </div>
                  ) : (
                    projects.map((p) => {
                      const isSelected = filterOptions.projectIds?.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const cur = filterOptions.projectIds || [];
                            const next = isSelected ? cur.filter((x) => x !== p.id) : [...cur, p.id];
                            setFilterOptions({ projectIds: next.length > 0 ? next : undefined });
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[5px] text-[11px] transition-colors ${
                            isSelected
                              ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                              : 'text-[#4b5563] dark:text-[#d4d4d8] hover:bg-[#f9fafb] dark:hover:bg-[#222226]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: p.color || '#9ca3af' }}
                            />
                            <span className="truncate">{p.name}</span>
                          </div>
                          {isSelected && <Check className="w-3 h-3 text-[#111827] dark:text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sort Toggle */}
        <div className="relative shrink-0" ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="w-7 h-7 xl:w-auto xl:px-2.5 xl:gap-1.5 flex items-center justify-center rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f4f5f6] dark:bg-[#1c1c1f] text-xs font-medium text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#27272a] shrink-0 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
            <span className="hidden xl:inline">Sort</span>
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-modal py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => { setFilterOptions({ sortBy: 'manual' }); setIsSortDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${(!filterOptions.sortBy || filterOptions.sortBy === 'manual') ? 'font-semibold text-[#111827] dark:text-white' : 'text-[#4b5563] dark:text-[#a1a1aa]'}`}
              >
                <span>Custom / Drag Order</span>
                {(!filterOptions.sortBy || filterOptions.sortBy === 'manual') && (
                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                )}
              </button>
              <div className="my-1 border-t border-[#f3f4f6] dark:border-[#27272a]" />
              <button
                onClick={() => { setFilterOptions({ sortBy: 'updated_desc' }); setIsSortDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${filterOptions.sortBy === 'updated_desc' ? 'font-semibold text-[#111827] dark:text-white' : 'text-[#4b5563] dark:text-[#a1a1aa]'}`}
              >
                <span>Recently Updated</span>
                {filterOptions.sortBy === 'updated_desc' && (
                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                )}
              </button>
              <button
                onClick={() => { setFilterOptions({ sortBy: 'created_desc' }); setIsSortDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${filterOptions.sortBy === 'created_desc' ? 'font-semibold text-[#111827] dark:text-white' : 'text-[#4b5563] dark:text-[#a1a1aa]'}`}
              >
                <span>Recently Created</span>
                {filterOptions.sortBy === 'created_desc' && (
                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                )}
              </button>
              <button
                onClick={() => { setFilterOptions({ sortBy: 'priority_desc' }); setIsSortDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${filterOptions.sortBy === 'priority_desc' ? 'font-semibold text-[#111827] dark:text-white' : 'text-[#4b5563] dark:text-[#a1a1aa]'}`}
              >
                <span>Priority (High to Low)</span>
                {filterOptions.sortBy === 'priority_desc' && (
                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                )}
              </button>
              <button
                onClick={() => { setFilterOptions({ sortBy: 'title_asc' }); setIsSortDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${filterOptions.sortBy === 'title_asc' ? 'font-semibold text-[#111827] dark:text-white' : 'text-[#4b5563] dark:text-[#a1a1aa]'}`}
              >
                <span>Title (A-Z)</span>
                {filterOptions.sortBy === 'title_asc' && (
                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                )}
              </button>
              <button
                onClick={() => { setFilterOptions({ sortBy: 'project_asc' }); setIsSortDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${filterOptions.sortBy === 'project_asc' ? 'font-semibold text-[#111827] dark:text-white' : 'text-[#4b5563] dark:text-[#a1a1aa]'}`}
              >
                <span>Project (A-Z)</span>
                {filterOptions.sortBy === 'project_asc' && (
                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* View Layout Switcher Dropdown — hidden on Queue page */}
        {viewMode.type !== 'my_queue' && (
          <div className="relative shrink-0" ref={layoutDropdownRef}>
            <button
              onClick={() => setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
              className="w-7 h-7 xl:w-auto xl:px-2.5 xl:gap-1.5 flex items-center justify-center rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f4f5f6] dark:bg-[#1c1c1f] text-xs font-medium text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#27272a] shrink-0 transition-colors cursor-pointer"
            >
              {itemViewLayout === 'board' ? (
                <Kanban className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              ) : itemViewLayout === 'cards' ? (
                <LayoutGrid className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              ) : (
                <List className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              )}
              <span className="hidden xl:inline capitalize">
                {itemViewLayout === 'board' ? 'Board' : itemViewLayout === 'cards' ? 'Cards' : 'List'}
              </span>
            </button>

            {isLayoutDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-modal py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setItemViewLayout('list');
                    setIsLayoutDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${
                    itemViewLayout === 'list'
                      ? 'font-semibold text-[#111827] dark:text-white'
                      : 'text-[#4b5563] dark:text-[#a1a1aa]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <List className="w-3.5 h-3.5 opacity-70" />
                    <span>List View</span>
                  </div>
                  {itemViewLayout === 'list' && (
                    <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setItemViewLayout('board');
                    setIsLayoutDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${
                    itemViewLayout === 'board'
                      ? 'font-semibold text-[#111827] dark:text-white'
                      : 'text-[#4b5563] dark:text-[#a1a1aa]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Kanban className="w-3.5 h-3.5 opacity-70" />
                    <span>Board View</span>
                  </div>
                  {itemViewLayout === 'board' && (
                    <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setItemViewLayout('cards');
                    setIsLayoutDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center justify-between ${
                    itemViewLayout === 'cards'
                      ? 'font-semibold text-[#111827] dark:text-white'
                      : 'text-[#4b5563] dark:text-[#a1a1aa]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
                    <span>Cards View</span>
                  </div>
                  {itemViewLayout === 'cards' && (
                    <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </>
    )}

        {/* Cloud Sync / Offline button */}
        {isCloudSync && (
          <button
            type="button"
            onClick={() => handleRefresh(false)}
            className={`w-7 h-7 xl:w-auto xl:px-2.5 xl:gap-1.5 flex items-center justify-center rounded-[6px] border text-xs font-medium shrink-0 transition-colors cursor-pointer select-none ${
              !isOnline
                ? 'bg-[#f4f5f6] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] text-[#9ca3af] dark:text-[#52525b]'
                : 'bg-[#f4f5f6] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#27272a]'
            }`}
          >
            {!isOnline ? (
              <CloudOff className="w-3.5 h-3.5" />
            ) : syncState === 'syncing' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            <span className="hidden xl:inline">
              {!isOnline ? 'Offline' : syncState === 'syncing' ? 'Syncing...' : 'Synced'}
            </span>
          </button>
        )}

        {/* + New Button or View Only Badge */}
        {permissions.canCreateItems ? (
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="w-7 h-7 xl:w-auto xl:px-3 xl:gap-1 flex items-center justify-center bg-[#111827] dark:bg-[#f4f4f5] hover:bg-[#1f2937] dark:hover:bg-white text-white dark:text-[#18181b] rounded-[6px] text-xs font-semibold shadow-subtle shrink-0 transition-all active:scale-[0.96] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">New</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-[6px] text-[11px] font-semibold shrink-0 select-none">
            <span>View Only</span>
          </span>
        )}

        {/* Window Controls */}
        <div className="ml-0.5 pl-1 border-l border-[#e5e7eb] dark:border-[#27272a] shrink-0">
          <WindowControls />
        </div>
      </div>
    </header>
  );
};
