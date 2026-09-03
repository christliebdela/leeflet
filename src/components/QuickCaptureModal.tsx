import React, { useState, useEffect, useRef } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { useComponentStore } from '../store/useComponentStore';
import { ItemType, Priority, Project, ChecklistItem, TeamMember, ProjectComponent } from '../types';
import {
  Folder,
  Check,
  CheckSquare,
  Bug,
  Lightbulb,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  ChevronDown,
  X,
  Plus,
  Calendar as CalendarIcon,
  User,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../utils/format';
import { getActiveTeamMembers, matchesAssignee, normalizeAssigneeId } from '../utils/team';
import { resolveAvatarUrl } from '../utils/avatars';
import { Calendar } from './ui/calendar';
import { getUserPermissions } from '../utils/permissions';

const TYPE_ICONS: Record<ItemType, React.FC<{ className?: string }>> = {
  task: CheckSquare,
  bug: Bug,
  idea: Lightbulb,
  improvement: Sparkles,
  research: BookOpen,
  question: HelpCircle,
  note: FileText,
};

export const deriveTitleFromContent = (content: string, maxWords: number = 7): string => {
  if (!content.trim()) return 'Untitled';
  const firstLine = content.trim().split('\n')[0].trim();
  const clean = firstLine.replace(/^[#\-*\d.]+\s*/, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return clean;
  }
  return words.slice(0, maxWords).join(' ') + '...';
};

export const formatDueDateLabel = (dateStr: string | null): string => {
  if (!dateStr) return 'Due Date';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 7) {
      return target.toLocaleDateString(undefined, { weekday: 'short' });
    }
    return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getPresetDate = (preset: 'today' | 'tomorrow' | 'weekend' | 'next_week'): string => {
  const d = new Date();
  if (preset === 'today') {
    return d.toISOString().slice(0, 10);
  }
  if (preset === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (preset === 'weekend') {
    const day = d.getDay(); // 0 is Sun, 6 is Sat
    const diff = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  if (preset === 'next_week') {
    const day = d.getDay();
    const diff = (1 - day + 7) % 7 || 7; // next Monday
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
};

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setQuickCaptureOpen,
    projects,
    workspace,
    createItem,
    createProject,
    viewMode,
    selectedProjectId,
  } = useLeafStore();

  const permissions = getUserPermissions(workspace?.id);

  const isInProjectView = viewMode.type === 'project';
  const activeProject = isInProjectView ? projects.find((p: Project) => p.id === viewMode.projectId) : null;

  // Title & Description fields
  const [title, setTitle] = useState(() => {
    try {
      return localStorage.getItem('leaf_capture_draft_title') || '';
    } catch {
      return '';
    }
  });

  const [description, setDescription] = useState(() => {
    try {
      return localStorage.getItem('leaf_capture_draft_description') || '';
    } catch {
      return '';
    }
  });

  const [projectId, setProjectId] = useState(
    isInProjectView && activeProject
      ? activeProject.id
      : (localStorage.getItem('leaf_pref_default_project') || selectedProjectId || (projects[0]?.id || ''))
  );
  const [type, setType] = useState<ItemType>(() => (localStorage.getItem('leaf_pref_default_type') as ItemType) || 'task');
  const [priority, setPriority] = useState<Priority>(() => (localStorage.getItem('leaf_pref_default_priority') as Priority) || 'none');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);

  const [checklist, setChecklist] = useState<{ id: string; title: string; isCompleted: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('leaf_capture_draft_checklist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showChecklist, setShowChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('leaf_capture_draft_checklist');
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch {
      return false;
    }
  });
  const [newChecklistText, setNewChecklistText] = useState('');

  // Dropdown States
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [isComponentMenuOpen, setIsComponentMenuOpen] = useState(false);
  const [isDueDateMenuOpen, setIsDueDateMenuOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const checklistInputRef = useRef<HTMLTextAreaElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const newProjectInputRef = useRef<HTMLInputElement>(null);

  const projectRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const dueDateRef = useRef<HTMLDivElement>(null);

  // Load components when project changes
  const { getComponentsForProject, loadComponents, selectedComponentId: activeStoreComponentId } = useComponentStore();
  const currentCaptureProjectId = isInProjectView && activeProject ? activeProject.id : projectId;
  const projectComponents = getComponentsForProject(currentCaptureProjectId);
  const selectedComponent = projectComponents.find((c) => c.id === componentId) ?? null;

  useEffect(() => {
    if (isQuickCaptureOpen && currentCaptureProjectId) {
      loadComponents(currentCaptureProjectId);
    }
  }, [isQuickCaptureOpen, currentCaptureProjectId, loadComponents]);

  // Auto-assignment: when component changes, resolve lead or sole member
  const resolveComponentAssignee = (comp: ProjectComponent | null): string | null => {
    if (!comp) return null;
    if (comp.leadId) return comp.leadId;
    if (comp.memberIds.length === 1) return comp.memberIds[0];
    return null;
  };

  // Load team members on open (only active members who accepted)
  useEffect(() => {
    if (isQuickCaptureOpen) {
      const activeMembers = getActiveTeamMembers(workspace?.id);
      setTeamMembers(activeMembers);
    }
  }, [isQuickCaptureOpen, workspace?.id]);

  // Persist draft changes
  useEffect(() => {
    try {
      if (title) {
        localStorage.setItem('leaf_capture_draft_title', title);
      } else {
        localStorage.removeItem('leaf_capture_draft_title');
      }
    } catch {}
  }, [title]);

  useEffect(() => {
    try {
      if (description) {
        localStorage.setItem('leaf_capture_draft_description', description);
      } else {
        localStorage.removeItem('leaf_capture_draft_description');
      }
    } catch {}

    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      const scrollHeight = descriptionRef.current.scrollHeight;
      const targetHeight = Math.min(Math.max(scrollHeight, 44), 220);
      descriptionRef.current.style.height = `${targetHeight}px`;
    }
  }, [description, isQuickCaptureOpen]);

  useEffect(() => {
    try {
      if (checklist.length > 0) {
        localStorage.setItem('leaf_capture_draft_checklist', JSON.stringify(checklist));
      } else {
        localStorage.removeItem('leaf_capture_draft_checklist');
      }
    } catch {}
  }, [checklist]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (projectRef.current && !projectRef.current.contains(target)) {
        setIsProjectMenuOpen(false);
        setIsCreatingProject(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(target)) {
        setIsPriorityMenuOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(target)) {
        setIsTypeMenuOpen(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(target)) {
        setIsAssigneeMenuOpen(false);
      }
      if (componentRef.current && !componentRef.current.contains(target)) {
        setIsComponentMenuOpen(false);
      }
      if (dueDateRef.current && !dueDateRef.current.contains(target)) {
        setIsDueDateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync contextual view mode defaults on open
  useEffect(() => {
    if (isQuickCaptureOpen) {
      if (isInProjectView && activeProject) {
        setProjectId(activeProject.id);
        if (activeStoreComponentId && activeStoreComponentId !== 'unassigned') {
          setComponentId(activeStoreComponentId);
          const currentComps = getComponentsForProject(activeProject.id);
          const activeComp = currentComps.find((c) => c.id === activeStoreComponentId);
          const autoAssignee = resolveComponentAssignee(activeComp ?? null);
          if (autoAssignee) {
            setAssigneeId(autoAssignee);
          }
        } else {
          setComponentId(null);
        }
      } else {
        setComponentId(null);
        const savedDefault = localStorage.getItem('leaf_pref_default_project');
        if (savedDefault) {
          setProjectId(savedDefault);
        } else if (selectedProjectId) {
          setProjectId(selectedProjectId);
        } else if (projects.length > 0 && !projectId) {
          setProjectId(projects[0].id);
        }
      }

      if (!title && !description) {
        const defType = (localStorage.getItem('leaf_pref_default_type') as ItemType) || 'task';
        const defPriority = (localStorage.getItem('leaf_pref_default_priority') as Priority) || 'none';

        if (viewMode.type === 'type_filter') {
          setType(viewMode.itemType);
        } else {
          setType(defType);
        }

        if (viewMode.type === 'priority_filter') {
          setPriority(viewMode.priority);
        } else {
          setPriority(defPriority);
        }
      }

      setTimeout(() => titleInputRef.current?.focus(), 60);
    }
  }, [isQuickCaptureOpen, viewMode, activeProject, selectedProjectId, projects, activeStoreComponentId]);

  if (!isQuickCaptureOpen) return null;

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const newProj = await createProject({
        name: newProjectName.trim(),
        description: '',
      });
      setProjectId(newProj.id);
      setNewProjectName('');
      setIsCreatingProject(false);
      setIsProjectMenuOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddChecklistStep = () => {
    const text = newChecklistText.trim();
    if (!text) return;
    setChecklist((prev) => [...prev, { id: crypto.randomUUID(), title: text, isCompleted: false }]);
    setNewChecklistText('');
    setTimeout(() => {
      if (bodyScrollRef.current) {
        bodyScrollRef.current.scrollTop = bodyScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const toggleChecklist = () => {
    setShowChecklist((prev) => !prev);
    setTimeout(() => {
      checklistInputRef.current?.focus();
    }, 50);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle && !trimmedDesc) return;

    const finalTitle = trimmedTitle || deriveTitleFromContent(trimmedDesc, 7);
    const finalContent = trimmedDesc;

    const targetProjectId = isInProjectView && activeProject
      ? activeProject.id
      : (projectId || (projects[0]?.id || ''));

    const checklistItems: ChecklistItem[] = checklist.map((c, idx) => ({
      id: c.id || crypto.randomUUID(),
      itemId: '',
      title: c.title.trim(),
      isCompleted: false,
      position: idx,
    }));

    await createItem({
      projectId: targetProjectId,
      componentId: componentId || null,
      title: finalTitle,
      content: finalContent,
      type,
      priority,
      status: 'inbox',
      checklist: checklistItems,
      assigneeId: assigneeId || null,
      dueAt: dueDate || null,
    });

    setTitle('');
    setDescription('');
    setChecklist([]);
    setShowChecklist(false);
    setNewChecklistText('');
    setAssigneeId(null);
    setComponentId(null);
    setDueDate(null);
    try {
      localStorage.removeItem('leaf_capture_draft_title');
      localStorage.removeItem('leaf_capture_draft_description');
      localStorage.removeItem('leaf_capture_draft_checklist');
    } catch {}
    setQuickCaptureOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuickCaptureOpen(false);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedMember = teamMembers.find((m) => matchesAssignee(m.id, assigneeId));
  const TypeIcon = TYPE_ICONS[type] || CheckSquare;
  const typeConfig = ITEM_TYPE_CONFIG[type] || ITEM_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;
  const hasContent = Boolean(title.trim() || description.trim());

  if (!isQuickCaptureOpen || !permissions.canCreateItems) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setQuickCaptureOpen(false);
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-[500px] bg-white dark:bg-[#18181b] rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal relative animate-in fade-in zoom-in-95 duration-100 flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Top Breadcrumb Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-[#f3f4f6] dark:border-[#27272a] rounded-t-[12px] shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <img src="/leaf_logo.png" alt="leeflet" className="w-4 h-4 object-contain shrink-0 invert dark:invert-0" />
            <span className="font-brand text-[15px] italic text-[#111827] dark:text-[#f4f4f5] tracking-tight leading-none select-none">
              leeflet
            </span>
            <span className="text-[#9ca3af] dark:text-[#52525b]">›</span>
            <span className="text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa] capitalize">
              New {typeConfig.label.toLowerCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleChecklist}
              className={`flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded transition-colors ${
                showChecklist || checklist.length > 0
                  ? 'text-[#111827] dark:text-white bg-[#f3f4f6] dark:bg-[#27272a]'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>Checklist{checklist.length > 0 ? ` (${checklist.length})` : ''}</span>
            </button>

            <button
              onClick={() => setQuickCaptureOpen(false)}
              className="text-[10px] font-semibold bg-[#f3f4f6] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-[5px] border border-[#e5e7eb] dark:border-[#3f3f46] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors"
            >
              Esc
            </button>
          </div>
        </div>

        {/* Editor Body: Title, Description, Checklist */}
        <div ref={bodyScrollRef} className="px-4 pt-3.5 pb-2 overflow-y-auto custom-scrollbar flex-1 flex flex-col space-y-2.5 max-h-[460px] transition-all duration-200 ease-out">
          {/* Prominent Title Line */}
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                descriptionRef.current?.focus();
              }
            }}
            placeholder="Task title"
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#52525b] outline-none focus:outline-none border-none p-0 leading-tight"
            autoFocus
          />

          {/* Description Area */}
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              e.target.style.height = 'auto';
              const targetHeight = Math.min(Math.max(e.target.scrollHeight, 44), 220);
              e.target.style.height = `${targetHeight}px`;
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Add description or notes... (Ctrl+Enter to save)"
            className="w-full bg-transparent text-xs text-[#374151] dark:text-[#d4d4d8] placeholder-[#9ca3af] dark:placeholder-[#52525b] outline-none focus:outline-none border-none p-0 resize-none leading-relaxed min-h-[44px] max-h-[220px] overflow-y-auto custom-scrollbar transition-[height] duration-75"
          />

          {/* Checklist Area */}
          {(showChecklist || checklist.length > 0) && (
            <div className="space-y-1.5 pt-1.5 border-t border-[#f3f4f6] dark:border-[#27272a]">
              {checklist.length > 0 && (
                <div className="space-y-1.5">
                  {checklist.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="group flex items-start justify-between gap-2 px-2.5 py-1 bg-[#f9fafb] dark:bg-[#1c1c1f] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] text-xs w-full"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1 w-full">
                        <span className="w-3 h-3 mt-0.5 rounded border border-[#d1d5db] dark:border-[#52525b] flex items-center justify-center shrink-0" />
                        <span className="text-xs text-[#374151] dark:text-[#d4d4d8] break-words break-all [overflow-wrap:anywhere] whitespace-normal flex-1 leading-snug">
                          {item.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChecklist(checklist.filter((_, i) => i !== index))}
                        className="opacity-60 hover:opacity-100 p-0.5 text-[#6b7280] dark:text-[#a1a1aa] hover:text-rose-500 transition-colors shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add checklist input */}
              <div className="flex items-center gap-1.5">
                <textarea
                  ref={checklistInputRef}
                  rows={1}
                  value={newChecklistText}
                  onChange={(e) => {
                    setNewChecklistText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 60) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddChecklistStep();
                    }
                  }}
                  placeholder="Add step/subtask (Press Enter)..."
                  className="flex-1 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1 text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] outline-none focus:border-[#9ca3af] resize-none leading-relaxed min-h-[28px] max-h-[60px] overflow-hidden"
                />
                {newChecklistText.trim() && (
                  <button
                    type="button"
                    onClick={handleAddChecklistStep}
                    className="px-2 py-1 bg-[#f3f4f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] text-xs font-semibold rounded-[5px] text-[#374151] dark:text-[#d4d4d8] shrink-0 self-end"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Pills Row (Positioned outside scroll context, dropdowns drop DOWN cleanly) */}
        <div className="px-4 py-2 relative overflow-visible shrink-0 z-30">
          <div id="capture-pills-row" className="grid grid-cols-3 gap-2 w-full">
            {/* Row 1, Col 1: Project Pill */}
            {isInProjectView && activeProject ? (
              <div
                title="Capturing inside current project"
                className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-[#f3f4f6] dark:bg-[#202024] rounded-[6px] text-xs font-medium text-[#374151] dark:text-[#d4d4d8] border border-[#e5e7eb] dark:border-[#27272a] min-w-0 select-none"
              >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                  <span className="truncate">{activeProject.name}</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full min-w-0" ref={projectRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProjectMenuOpen(!isProjectMenuOpen);
                    setIsPriorityMenuOpen(false);
                    setIsComponentMenuOpen(false);
                    setIsAssigneeMenuOpen(false);
                    setIsDueDateMenuOpen(false);
                    setIsTypeMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors text-xs font-medium text-[#374151] dark:text-[#f4f4f5] cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-1.5 truncate min-w-0">
                    <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                    <span className="truncate">{selectedProject?.name || 'No Project'}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-1" />
                </button>

                {isProjectMenuOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xl p-1 z-50 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-100">
                    <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-0.5">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setProjectId(p.id);
                            setIsProjectMenuOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs truncate flex items-center justify-between transition-colors ${
                            projectId === p.id
                              ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                              : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Folder className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate">{p.name}</span>
                          </div>
                          {projectId === p.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>

                    {/* Inline New Project Creator */}
                    <div className="pt-1 mt-1 border-t border-[#f3f4f6] dark:border-[#27272a]">
                      {isCreatingProject ? (
                        <div className="p-1">
                          <div className="flex items-center gap-1">
                            <input
                              ref={newProjectInputRef}
                              type="text"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateProject();
                                } else if (e.key === 'Escape') {
                                  setIsCreatingProject(false);
                                }
                              }}
                              placeholder="New project..."
                              className="w-full bg-[#f9fafb] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] rounded px-1.5 py-0.5 text-xs text-[#111827] dark:text-[#f4f4f5] outline-none"
                              autoFocus
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingProject(true);
                            setTimeout(() => newProjectInputRef.current?.focus(), 50);
                          }}
                          className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-[#f4f4f5] rounded hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New Project</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 1, Col 2: Priority Pill */}
            <div className="relative w-full min-w-0" ref={priorityRef}>
              <button
                type="button"
                onClick={() => {
                  setIsPriorityMenuOpen(!isPriorityMenuOpen);
                  setIsProjectMenuOpen(false);
                  setIsComponentMenuOpen(false);
                  setIsAssigneeMenuOpen(false);
                  setIsDueDateMenuOpen(false);
                  setIsTypeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors text-xs font-medium text-[#374151] dark:text-[#f4f4f5] cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.dotColor}`} />
                  <span className="capitalize truncate">{priorityConfig.label}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-1" />
              </button>

              {isPriorityMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-32 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xl p-1 z-50 space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-100">
                  {(['none', 'low', 'medium', 'high', 'critical'] as Priority[]).map((p) => {
                    const pCfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPriority(p);
                          setIsPriorityMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs capitalize flex items-center justify-between transition-colors ${
                          priority === p
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${pCfg.dotColor}`} />
                          <span>{pCfg.label}</span>
                        </div>
                        {priority === p && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 1, Col 3: Component Pill */}
            <div className="relative w-full min-w-0" ref={componentRef}>
              <button
                type="button"
                onClick={() => {
                  setIsComponentMenuOpen(!isComponentMenuOpen);
                  setIsProjectMenuOpen(false);
                  setIsPriorityMenuOpen(false);
                  setIsAssigneeMenuOpen(false);
                  setIsDueDateMenuOpen(false);
                  setIsTypeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors text-xs font-medium text-[#374151] dark:text-[#f4f4f5] cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  {selectedComponent ? (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: selectedComponent.color || '#3b82f6' }}
                    />
                  ) : (
                    <Layers className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  )}
                  <span className="truncate">
                    {selectedComponent?.name || 'Module'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-1" />
              </button>

              {isComponentMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xl p-1 z-50 space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setComponentId(null);
                      setAssigneeId(null);
                      setIsComponentMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                      !componentId
                        ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                        : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 opacity-60" />
                      <span>No Module</span>
                    </div>
                    {!componentId && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  {projectComponents.length === 0 ? (
                    <div className="px-2 py-2 text-[11px] text-[#9ca3af] dark:text-[#71717a] text-center border-t border-[#f3f4f6] dark:border-[#27272a] mt-1">
                      No modules in project
                    </div>
                  ) : (
                    projectComponents.map((comp) => {
                      const isSelected = comp.id === componentId;
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => {
                            setComponentId(comp.id);
                            const resolvedAssignee = resolveComponentAssignee(comp);
                            if (resolvedAssignee) setAssigneeId(resolvedAssignee);
                            setIsComponentMenuOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                              : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: comp.color || '#3b82f6' }}
                            />
                            <span className="truncate">{comp.name}</span>
                            {comp.memberIds.length > 0 && (
                              <span className="text-[10px] text-[#6b7280] dark:text-[#71717a] shrink-0">
                                {comp.memberIds.length} member{comp.memberIds.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Row 2, Col 1: Assignee Pill */}
            <div className="relative w-full min-w-0" ref={assigneeRef}>
              <button
                type="button"
                onClick={() => {
                  setIsAssigneeMenuOpen(!isAssigneeMenuOpen);
                  setIsProjectMenuOpen(false);
                  setIsPriorityMenuOpen(false);
                  setIsComponentMenuOpen(false);
                  setIsDueDateMenuOpen(false);
                  setIsTypeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors text-xs font-medium text-[#374151] dark:text-[#f4f4f5] cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  {selectedMember ? (
                    <span className="w-4 h-4 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden">
                      <img
                        src={resolveAvatarUrl(selectedMember.avatarMascot || selectedMember.avatarUrl || selectedMember.avatarColor, selectedMember.name || selectedMember.id)}
                        alt={selectedMember.name}
                        className="w-full h-full object-cover"
                      />
                    </span>
                  ) : (
                    <User className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0 opacity-80" />
                  )}
                  <span className="truncate">{selectedMember?.name || 'Assignee'}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-1" />
              </button>

              {isAssigneeMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xl p-1 z-50 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setAssigneeId(null);
                      setIsAssigneeMenuOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                      !assigneeId
                        ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                        : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 opacity-60" />
                      <span>Unassigned</span>
                    </div>
                    {!assigneeId && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  {teamMembers.map((member) => {
                    const isSelected = matchesAssignee(member.id, assigneeId);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          const normalizedId = normalizeAssigneeId(member.id);
                          setAssigneeId(normalizedId);
                          setIsAssigneeMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-4 h-4 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden">
                            <img
                              src={resolveAvatarUrl(member.avatarMascot || member.avatarUrl || member.avatarColor, member.name || member.id)}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </span>
                          <span className="truncate">{member.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Row 2, Col 2: Due Date Pill */}
            <div className="relative w-full min-w-0" ref={dueDateRef}>
              <button
                type="button"
                onClick={() => {
                  setIsDueDateMenuOpen(!isDueDateMenuOpen);
                  setIsProjectMenuOpen(false);
                  setIsPriorityMenuOpen(false);
                  setIsComponentMenuOpen(false);
                  setIsAssigneeMenuOpen(false);
                  setIsTypeMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors text-xs font-medium text-[#374151] dark:text-[#f4f4f5] cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <CalendarIcon className="w-3.5 h-3.5 opacity-70 shrink-0 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span className="truncate">{formatDueDateLabel(dueDate)}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-1" />
              </button>

              {isDueDateMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                  <div className="grid grid-cols-3 gap-0.5 pb-1 mb-0.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <button
                      type="button"
                      onClick={() => {
                        setDueDate(getPresetDate('today'));
                        setIsDueDateMenuOpen(false);
                      }}
                      className="py-0.5 px-0.5 rounded-[4px] text-[10px] font-medium text-center text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDueDate(getPresetDate('tomorrow'));
                        setIsDueDateMenuOpen(false);
                      }}
                      className="py-0.5 px-0.5 rounded-[4px] text-[10px] font-medium text-center text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      Tomorrow
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDueDate(getPresetDate('next_week'));
                        setIsDueDateMenuOpen(false);
                      }}
                      className="py-0.5 px-0.5 rounded-[4px] text-[10px] font-medium text-center text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      Next Mon
                    </button>
                  </div>

                  {/* Shadcn Calendar Component */}
                  <Calendar
                    mode="single"
                    selected={dueDate ? new Date(dueDate + 'T00:00:00') : null}
                    onSelect={(d) => {
                      if (d) {
                        setDueDate(format(d, 'yyyy-MM-dd'));
                      } else {
                        setDueDate(null);
                      }
                      setIsDueDateMenuOpen(false);
                    }}
                    className="p-0 border-0"
                  />

                  {dueDate && (
                    <div className="pt-1 mt-0.5 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between">
                      <span className="text-[9.5px] text-[#6b7280] dark:text-[#a1a1aa] font-mono">
                        {dueDate}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDueDate(null);
                          setIsDueDateMenuOpen(false);
                        }}
                        className="px-1.5 py-0.5 rounded-[3px] text-[9.5px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 2, Col 3: Type Pill */}
            <div className="relative w-full min-w-0" ref={typeRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTypeMenuOpen(!isTypeMenuOpen);
                  setIsProjectMenuOpen(false);
                  setIsPriorityMenuOpen(false);
                  setIsComponentMenuOpen(false);
                  setIsAssigneeMenuOpen(false);
                  setIsDueDateMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors text-xs font-medium text-[#374151] dark:text-[#f4f4f5] cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <TypeIcon className="w-3.5 h-3.5 shrink-0 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span className="capitalize truncate">{typeConfig.label}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-1" />
              </button>

              {isTypeMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xl p-1 z-50 space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-100">
                  {(['task', 'bug', 'idea', 'improvement', 'research', 'question', 'note'] as ItemType[]).map((t) => {
                    const ItemIcon = TYPE_ICONS[t];
                    const cfg = ITEM_TYPE_CONFIG[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setIsTypeMenuOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs capitalize flex items-center justify-between transition-colors ${
                          type === t
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          <span>{cfg.label}</span>
                        </div>
                        {type === t && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="px-4 py-2 bg-[#fafafa] dark:bg-[#141416] border-t border-[#f3f4f6] dark:border-[#27272a] rounded-b-[12px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af] dark:text-[#71717a]">
            <span className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] font-mono text-[10px]">
              Ctrl
            </span>
            <span>+</span>
            <span className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] font-mono text-[10px]">
              Enter
            </span>
            <span className="ml-0.5 hidden sm:inline">to save</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasContent}
            className="px-3.5 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-40 text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold transition-all shadow-subtle active:scale-[0.98] shrink-0"
          >
            Create task
          </button>
        </div>
      </div>
    </div>
  );
};
