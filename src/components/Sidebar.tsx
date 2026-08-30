import React, { useState, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import {
  Inbox,
  ListTodo,
  Layers,
  Folder,
  Plus,
  ChevronRight,
  ChevronDown,
  Bug,
  Lightbulb,
  CheckSquare,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Archive,
  Settings,
  Trash2,
  SquarePen,
  X,
  Sun,
  Moon,
  Minimize2,
  Coffee,
} from 'lucide-react';
import { ViewMode, ItemType, Priority, Project, Item } from '../types';
import { enterMiniMode } from '../utils/window';

export const Sidebar: React.FC = () => {
  const {
    projects,
    items,
    viewMode,
    setViewMode,
    setProjectModalOpen,
    isWorkspaceModalOpen,
    setWorkspaceModalOpen,
    deleteProject,
    theme,
    toggleTheme,
  } = useLeafStore();

  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Global escape key to close project delete modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && projectToDelete) {
        setProjectToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectToDelete]);

  // Compute counts
  const inboxCount = items.filter((i: Item) => i.status === 'inbox').length;
  const queueCount = items.filter(
    (i: Item) => (i.priority === 'critical' || i.priority === 'high' || i.priority === 'medium' || i.priority === 'low' || i.type === 'idea') && i.status !== 'done' && i.status !== 'archived'
  ).length;
  const allCount = items.filter((i: Item) => i.status !== 'archived').length;

  const bugsCount = items.filter((i: Item) => i.type === 'bug' && i.status !== 'archived').length;
  const ideasCount = items.filter((i: Item) => i.type === 'idea' && i.status !== 'archived').length;
  const tasksCount = items.filter((i: Item) => i.type === 'task' && i.status !== 'archived').length;
  const researchCount = items.filter((i: Item) => i.type === 'research' && i.status !== 'archived').length;
  const highPriorityCount = items.filter((i: Item) => (i.priority === 'high' || i.priority === 'critical') && i.status !== 'archived').length;
  const completedCount = items.filter((i: Item) => i.status === 'done').length;
  const archivedCount = items.filter((i: Item) => i.status === 'archived').length;

  const isViewActive = (mode: ViewMode) => {
    if (mode.type !== viewMode.type) return false;
    if (mode.type === 'project' && viewMode.type === 'project') {
      return mode.projectId === viewMode.projectId;
    }
    if (mode.type === 'type_filter' && viewMode.type === 'type_filter') {
      return mode.itemType === viewMode.itemType;
    }
    if (mode.type === 'priority_filter' && viewMode.type === 'priority_filter') {
      return mode.priority === viewMode.priority;
    }
    return true;
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    await deleteProject(projectToDelete.id);
    if (viewMode.type === 'project' && viewMode.projectId === projectToDelete.id) {
      setViewMode({ type: 'inbox' });
    }
    setProjectToDelete(null);
  };

  return (
    <>
      <aside className="w-52 h-full bg-[#f4f5f6] dark:bg-[#121214] border-r border-[#e5e7eb] dark:border-[#27272a] flex flex-col justify-between select-none text-xs text-[#374151] dark:text-[#d4d4d8] shrink-0 transition-colors">
        {/* Brand logo & name aligned with top HeaderBar */}
        <div
          className="h-12 px-3 flex items-center gap-2 select-none shrink-0"
          data-tauri-drag-region
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <img
              src="/leaf_logo.png"
              alt="leaf"
              className="w-5 h-5 object-contain transition-all"
            />
          </div>
          <span className="font-brand text-xl tracking-tight text-[#111827] dark:text-[#f4f4f5] select-none" data-tauri-drag-region>
            leeflet
          </span>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
          {/* Primary Views */}
          <div className="space-y-0.5">
            <button
              onClick={() => setViewMode({ type: 'inbox' })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors font-medium text-xs ${
                isViewActive({ type: 'inbox' })
                  ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white'
                  : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                <span>Backlog</span>
              </div>
              {inboxCount > 0 && (
                <span className="text-[11px] text-[#6b7280] dark:text-[#71717a] font-normal">
                  {inboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode({ type: 'my_queue' })}
              className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors font-medium text-xs ${
                isViewActive({ type: 'my_queue' })
                  ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white'
                  : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                <span>My Queue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    enterMiniMode();
                  }}
                  className="hidden group-hover:flex items-center justify-center p-0.5 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white rounded transition-colors"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
                {queueCount > 0 && (
                  <span className="text-[11px] text-[#6b7280] dark:text-[#71717a] font-normal">
                    {queueCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setViewMode({ type: 'all' })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors font-medium text-xs ${
                isViewActive({ type: 'all' })
                  ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white'
                  : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                <span>All Items</span>
              </div>
              {allCount > 0 && (
                <span className="text-[11px] text-[#6b7280] dark:text-[#71717a] font-normal">
                  {allCount}
                </span>
              )}
            </button>
          </div>

          {/* PROJECTS SECTION */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a]">
              <div
                className="flex items-center gap-1 cursor-pointer hover:text-[#111827] dark:hover:text-white"
                onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
              >
                {isProjectsCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                )}
                <span>Projects</span>
              </div>
              <button
                onClick={() => setProjectModalOpen(true)}
                className="hover:text-[#111827] dark:hover:text-white p-0.5 rounded-[4px] hover:bg-[#ebecee] dark:hover:bg-[#27272a]"
              >
                <Plus className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
              </button>
            </div>

            {!isProjectsCollapsed && (
              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  <div className="px-2.5 py-1 text-[11px] text-[#9ca3af] dark:text-[#71717a] italic">
                    No projects yet
                  </div>
                ) : (
                  projects.map((project: Project) => {
                    const count = items.filter(
                      (i: Item) => i.projectId === project.id && i.status !== 'archived'
                    ).length;
                    const active = isViewActive({ type: 'project', projectId: project.id });

                    return (
                      <div
                        key={project.id}
                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                          active
                            ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                            : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                        }`}
                      >
                        <button
                          onClick={() => setViewMode({ type: 'project', projectId: project.id })}
                          className="flex items-center gap-2 truncate flex-1 text-left"
                        >
                          <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {count > 0 && (
                            <span className="text-[11px] text-[#6b7280] dark:text-[#71717a] font-normal group-hover:hidden">
                              {count}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectModalOpen(true, project);
                            }}
                            className="hidden group-hover:flex items-center justify-center p-0.5 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white rounded transition-colors"
                          >
                            <SquarePen className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                            }}
                            className="hidden group-hover:flex items-center justify-center p-0.5 text-[#9ca3af] hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* VIEWS SECTION (All Icons Monochrome) */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a]">
              Views
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => setViewMode({ type: 'type_filter', itemType: 'bug' as ItemType })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                  isViewActive({ type: 'type_filter', itemType: 'bug' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                    : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bug className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Bugs</span>
                </div>
                {bugsCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{bugsCount}</span>}
              </button>

              <button
                onClick={() => setViewMode({ type: 'type_filter', itemType: 'idea' as ItemType })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                  isViewActive({ type: 'type_filter', itemType: 'idea' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                    : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Ideas</span>
                </div>
                {ideasCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{ideasCount}</span>}
              </button>

              <button
                onClick={() => setViewMode({ type: 'type_filter', itemType: 'task' as ItemType })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                  isViewActive({ type: 'type_filter', itemType: 'task' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                    : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Tasks</span>
                </div>
                {tasksCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{tasksCount}</span>}
              </button>

              <button
                onClick={() => setViewMode({ type: 'type_filter', itemType: 'research' as ItemType })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                  isViewActive({ type: 'type_filter', itemType: 'research' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                    : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Research</span>
                </div>
                {researchCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{researchCount}</span>}
              </button>

              <button
                onClick={() => setViewMode({ type: 'priority_filter', priority: 'high' as Priority })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                  isViewActive({ type: 'priority_filter', priority: 'high' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                    : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>High Priority</span>
                </div>
                {highPriorityCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{highPriorityCount}</span>}
              </button>

              <button
                onClick={() => setViewMode({ type: 'completed' })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                  isViewActive({ type: 'completed' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                    : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Completed</span>
                </div>
                {completedCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{completedCount}</span>}
              </button>

              <button
                onClick={() => setViewMode({ type: 'archived' })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                  isViewActive({ type: 'archived' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                    : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Archived</span>
                </div>
                {archivedCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{archivedCount}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer Controls */}
        <div className="p-3 border-t border-[#e5e7eb] dark:border-[#27272a] space-y-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white transition-colors text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10.5px] text-[#9ca3af] dark:text-[#71717a] font-normal capitalize">
              {theme}
            </span>
          </button>

          {/* Mini Mode */}
          <button
            onClick={enterMiniMode}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white transition-colors text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <Minimize2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span>Mini Mode</span>
            </div>
            <kbd className="w-4 h-4 flex items-center justify-center rounded-[3px] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] shrink-0 leading-none">
              M
            </kbd>
          </button>

          {/* Coffee Break / Mask */}
          <button
            onClick={() => useLeafStore.getState().setStandby(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs font-medium text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span>Coffee Break</span>
            </div>
            <kbd className="w-4 h-4 flex items-center justify-center rounded-[3px] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] shrink-0 leading-none">
              Z
            </kbd>
          </button>

          {/* Settings */}
          <button
            onClick={() => setWorkspaceModalOpen(!isWorkspaceModalOpen)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs font-medium ${
              isWorkspaceModalOpen
                ? 'bg-[#ebecee] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span>Settings</span>
            </div>
            <kbd className="w-4 h-4 flex items-center justify-center rounded-[3px] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] shrink-0 leading-none">
              S
            </kbd>
          </button>
        </div>
      </aside>

      {/* Project Delete Confirmation Modal */}
      {projectToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setProjectToDelete(null);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-4 h-4" />
                <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  Delete Project
                </h2>
              </div>
              <button
                onClick={() => setProjectToDelete(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-[#111827] dark:text-white">"{projectToDelete.name}"</span> and all items associated with it? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] text-xs font-medium shadow-subtle transition-all"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
