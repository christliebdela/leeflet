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
} from 'lucide-react';
import { ItemType, Priority, Project, Item } from '../types';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../utils/format';
import { WindowControls } from './WindowControls';
import { SearchInput } from './ui/SearchInput';

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
    items,
    projects,
    viewMode,
    filterOptions,
    setSearchQuery,
    setFilterOptions,
    setProjectModalOpen,
    setQuickCaptureOpen,
  } = useLeafStore();

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'type' | 'priority'>('type');

  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

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

  const activeTypesCount = filterOptions.types?.length || 0;
  const activePrioritiesCount = filterOptions.priorities?.length || 0;
  const activeFilterCount = activeTypesCount + activePrioritiesCount;

  const resetFilters = () => {
    setFilterOptions({ types: undefined, priorities: undefined, statuses: undefined });
  };

  return (
    <header
      data-tauri-drag-region
      className="h-12 px-3 bg-transparent flex items-center justify-between select-none shrink-0"
    >
      {/* Title & Count */}
      <div className="flex items-center gap-3 min-w-0" data-tauri-drag-region>
        <div className="flex items-center gap-1.5 min-w-0">
          <h1
            className="text-lg font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight truncate"
            data-tauri-drag-region
          >
            {headerInfo.title}
          </h1>
          {viewMode.type === 'project' && activeProj && (
            <button
              onClick={() => setProjectModalOpen(true, activeProj)}
              title="Edit project name & settings"
              className="p-1 rounded-[4px] hover:bg-[#ebecee] dark:hover:bg-[#27272a] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              <SquarePen className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {viewMode.type !== 'my_queue' && totalCount > 0 && (
          <span
            className="text-xs text-[#6b7280] dark:text-[#a1a1aa] font-normal shrink-0"
            data-tauri-drag-region
          >
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
            {openCount > 0 && ` • ${openCount} open`}
          </span>
        )}
      </div>

      {/* Action Controls & Top Window Controls */}
      <div className="flex items-center gap-1.5 shrink-0" data-tauri-drag-region="false">
        {/* Geist-style CmdK Search Input */}
        <SearchInput
          aria-label="Search items"
          cmdk
          value={filterOptions.searchQuery || ''}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search..."
          className="w-28 sm:w-36 md:w-48 transition-all"
        />

        {/* Filter Toggle */}
        <div className="relative shrink-0" ref={filterDropdownRef}>
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-xs font-medium shrink-0 whitespace-nowrap transition-colors ${
              isFilterDropdownOpen || activeFilterCount > 0
                ? 'bg-[#111827] text-white border-[#111827] dark:bg-white dark:text-[#111827] dark:border-white shadow-sm'
                : 'bg-[#f4f5f6] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#27272a]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span
                className={`px-1.5 py-0 text-[10px] rounded-full font-bold leading-tight ${
                  isFilterDropdownOpen || activeFilterCount > 0
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#111827]'
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
            </div>
          )}
        </div>

        {/* Sort Toggle */}
        <div className="relative shrink-0" ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f4f5f6] dark:bg-[#1c1c1f] text-xs font-medium text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#27272a] shrink-0 whitespace-nowrap transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
            <span>Sort</span>
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
            </div>
          )}
        </div>

        {/* + New Item Button */}
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="flex items-center gap-1 px-3 py-1 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold shadow-subtle shrink-0 whitespace-nowrap transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Item</span>
        </button>

        {/* Window Controls */}
        <div className="ml-0.5 pl-1 border-l border-[#e5e7eb] dark:border-[#27272a] shrink-0">
          <WindowControls />
        </div>
      </div>
    </header>
  );
};
