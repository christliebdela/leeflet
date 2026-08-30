import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/db';
import { Project, ItemType, Priority, ChecklistItem } from '../../types';
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
  AlertTriangle,
} from 'lucide-react';
import { broadcastSync } from '../../utils/sync';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../../utils/format';

const TYPE_ICONS: Record<ItemType, React.FC<{ className?: string }>> = {
  task: CheckSquare,
  bug: Bug,
  idea: Lightbulb,
  improvement: Sparkles,
  research: BookOpen,
  question: HelpCircle,
  note: FileText,
};

export const StandaloneQuickCapture: React.FC = () => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [type, setType] = useState<ItemType>('task');
  const [priority, setPriority] = useState<Priority>('none');
  const [projects, setProjects] = useState<Project[]>([]);
  const [checklist, setChecklist] = useState<{ id: string; title: string; isCompleted: boolean }[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');

  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  const titleRef = useRef('');
  const newProjectNameRef = useRef('');
  const checklistRef = useRef(checklist);
  const newChecklistTextRef = useRef(newChecklistText);
  const showDiscardPromptRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checklistInputRef = useRef<HTMLTextAreaElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const newProjectInputRef = useRef<HTMLInputElement>(null);

  const handleCreateProject = async () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    try {
      const created = await dbService.createProject({ name: trimmed });
      const updated = await dbService.getProjects();
      setProjects(updated);
      setProjectId(created.id);
      setNewProjectName('');
      newProjectNameRef.current = '';
      setIsCreatingProject(false);
      setIsProjectMenuOpen(false);
      broadcastSync({ type: 'projects_reload' });
      setTimeout(() => textareaRef.current?.focus(), 50);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const toggleChecklist = () => {
    const next = !showChecklist;
    setShowChecklist(next);
    if (next) {
      setTimeout(() => {
        checklistInputRef.current?.focus();
        if (bodyScrollRef.current) {
          bodyScrollRef.current.scrollTop = bodyScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  const handleAddChecklistStep = () => {
    if (newChecklistText.trim()) {
      setChecklist((prev) => [
        ...prev,
        { id: crypto.randomUUID(), title: newChecklistText.trim(), isCompleted: false },
      ]);
      setNewChecklistText('');
      if (checklistInputRef.current) {
        checklistInputRef.current.style.height = 'auto';
        checklistInputRef.current.focus();
      }
      setTimeout(() => {
        if (bodyScrollRef.current) {
          bodyScrollRef.current.scrollTop = bodyScrollRef.current.scrollHeight;
        }
      }, 30);
    }
  };

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    newProjectNameRef.current = newProjectName;
  }, [newProjectName]);

  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

  useEffect(() => {
    newChecklistTextRef.current = newChecklistText;
  }, [newChecklistText]);

  useEffect(() => {
    showDiscardPromptRef.current = showDiscardPrompt;
  }, [showDiscardPrompt]);

  const hasUnsavedContent = () => Boolean(
    titleRef.current.trim() ||
    newProjectNameRef.current.trim() ||
    checklistRef.current.length > 0 ||
    newChecklistTextRef.current.trim()
  );

  const closeWindow = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      setShowDiscardPrompt(false);
      setTitle('');
      setChecklist([]);
      setShowChecklist(false);
      setNewChecklistText('');
      await win.hide();
    } catch {
      window.close();
    }
  };

  const handleRequestClose = () => {
    if (showDiscardPromptRef.current) {
      setShowDiscardPrompt(false);
      return;
    }
    if (hasUnsavedContent()) {
      setShowDiscardPrompt(true);
    } else {
      closeWindow();
    }
  };

  const applyCurrentTheme = () => {
    const savedTheme = localStorage.getItem('leaf_theme') as 'light' | 'dark' | null;
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyCurrentTheme();

    const enforceSizeAndBottomCenter = async () => {
      try {
        const { getCurrentWindow, currentMonitor } = await import('@tauri-apps/api/window');
        const { PhysicalSize, PhysicalPosition } = await import('@tauri-apps/api/dpi');
        const win = getCurrentWindow();
        const monitor = await currentMonitor();
        if (monitor) {
          const scaleFactor = monitor.scaleFactor || 1;
          const physicalW = Math.round(430 * scaleFactor);
          const physicalH = Math.round(250 * scaleFactor);
          const marginY = Math.round(65 * scaleFactor);
          const physicalX = monitor.position.x + Math.round((monitor.size.width - physicalW) / 2);
          const physicalY = monitor.position.y + monitor.size.height - physicalH - marginY;

          await win.setSize(new PhysicalSize(physicalW, physicalH));
          await win.setPosition(new PhysicalPosition(physicalX, physicalY));
        }
      } catch (err) {
        // ignore
      }
    };
    enforceSizeAndBottomCenter();

    // Load projects
    const loadProjects = async () => {
      const projs = await dbService.getProjects();
      setProjects(projs);
      if (projs.length > 0 && !projectId) {
        setProjectId(projs[0].id);
      }
    };
    loadProjects();

    // Auto-focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    const handleFocus = () => {
      applyCurrentTheme();
      loadProjects();
      textareaRef.current?.focus();
    };

    const handleBlur = () => {
      // Auto-close if nothing is typed in and not creating project
      if (!titleRef.current.trim() && !newProjectNameRef.current.trim()) {
        closeWindow();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDiscardPromptRef.current) {
          setShowDiscardPrompt(false);
          setTimeout(() => textareaRef.current?.focus(), 50);
          return;
        }
        if (isProjectMenuOpen || isTypeMenuOpen || isPriorityMenuOpen) {
          setIsProjectMenuOpen(false);
          setIsTypeMenuOpen(false);
          setIsPriorityMenuOpen(false);
          return;
        }
        handleRequestClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setIsTypeMenuOpen(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setIsPriorityMenuOpen(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    let unlistenFocus: (() => void) | undefined;
    (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        unlistenFocus = await win.onFocusChanged(({ payload: focused }) => {
          if (!focused && !titleRef.current.trim() && !newProjectNameRef.current.trim()) {
            closeWindow();
          }
        });
      } catch {
        // Handled by window blur event
      }
    })();

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (unlistenFocus) unlistenFocus();
    };
  }, [projectId]);

  const handleSave = async () => {
    const raw = title.trim();
    if (!raw) return;

    const checklistItems: ChecklistItem[] = checklist.map((c, idx) => ({
      id: c.id || crypto.randomUUID(),
      itemId: '',
      title: c.title.trim(),
      isCompleted: false,
      position: idx,
    }));

    // First line is heading/title, subsequent lines are details/body
    const lines = title.split('\n');
    const firstLine = lines[0].trim();
    const bodyContent = lines.slice(1).join('\n').trim();

    const newItem = await dbService.createItem({
      projectId,
      title: firstLine || raw,
      content: bodyContent || '',
      type,
      priority,
      status: 'inbox',
      tags: [],
      checklist: checklistItems,
      attachments: [],
    });

    broadcastSync({ type: 'item_created', item: newItem });
    closeWindow();
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const TypeIcon = TYPE_ICONS[type] || CheckSquare;
  const typeConfig = ITEM_TYPE_CONFIG[type] || ITEM_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;

  return (
    <div
      className="w-screen h-screen bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-modal relative flex flex-col select-none font-sans overflow-hidden animate-capture-bounce"
    >
      {/* Unsaved Changes Confirmation Prompt Overlay */}
      {showDiscardPrompt && (
        <div className="absolute inset-0 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xs rounded-[12px] z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#111827] dark:text-white mb-1.5">
            Save unsaved item?
          </h3>
          <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] mb-5 max-w-[280px] leading-relaxed">
            You have typed content in this item. Would you like to save it or proceed without saving?
          </p>
          <div className="flex flex-col gap-2 w-full max-w-[280px]">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-2 px-3 bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[7px] text-xs font-semibold shadow-subtle transition-all active:scale-[0.98]"
            >
              Save & Close
            </button>
            <button
              type="button"
              onClick={closeWindow}
              className="w-full py-2 px-3 bg-[#f3f4f6] dark:bg-[#27272a] text-[#dc2626] dark:text-[#f87171] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-[7px] text-xs font-semibold border border-[#e5e7eb] dark:border-[#3f3f46] transition-all"
            >
              Proceed Without Saving
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDiscardPrompt(false);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className="w-full py-1.5 px-3 text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white rounded-[7px] text-xs font-medium transition-all"
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#f3f4f6] dark:border-[#27272a] rounded-t-[12px]"
      >
        <div className="flex items-center gap-2">
          <img
            src="/leaf_logo.png"
            alt="leaf"
            className="w-4 h-4 object-contain transition-all"
          />
          <span className="font-brand text-base tracking-tight text-[#111827] dark:text-[#f4f4f5]">
            leeflet
          </span>
          <span className="text-[11px] font-medium text-[#6b7280] dark:text-[#a1a1aa] -ml-0.5">
            capture
          </span>
        </div>

        <button
          onClick={handleRequestClose}
          className="text-[10px] font-semibold bg-[#f3f4f6] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#3f3f46] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors"
        >
          Esc
        </button>
      </div>

      {/* Input prompt & textarea */}
      <div ref={bodyScrollRef} className="px-4 py-2.5 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#a1a1aa]">
            What are you working on?
          </span>
          <button
            type="button"
            onClick={toggleChecklist}
            className={`flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
              showChecklist || checklist.length > 0
                ? 'text-[#111827] dark:text-white bg-[#f3f4f6] dark:bg-[#27272a]'
                : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>Checklist{checklist.length > 0 ? ` (${checklist.length})` : ''}</span>
          </button>
        </div>
        <textarea
          ref={textareaRef}
          rows={showChecklist || checklist.length > 0 ? 2 : 4}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (showDiscardPrompt) {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
              return;
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Add a title or task... (Shift+Enter for details/body)"
          className="w-full bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] rounded-[8px] p-2.5 text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] outline-none focus:outline-none focus:ring-0 resize-none leading-relaxed min-h-[64px] shrink-0"
        />

        {/* Checklist Area */}
        {(showChecklist || checklist.length > 0) && (
          <div className="space-y-1.5 mt-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
            {checklist.length > 0 && (
              <div className="space-y-1.5">
                {checklist.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="group flex items-start justify-between gap-2 px-2.5 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] text-xs w-full"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1 w-full">
                      <span className="w-3.5 h-3.5 mt-0.5 rounded border border-[#d1d5db] dark:border-[#52525b] flex items-center justify-center shrink-0" />
                      <span className="text-xs text-[#374151] dark:text-[#d4d4d8] break-words break-all [overflow-wrap:anywhere] whitespace-normal flex-1 leading-snug">
                        {item.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChecklist(checklist.filter((_, i) => i !== index))}
                      className="opacity-60 hover:opacity-100 p-0.5 text-[#6b7280] dark:text-[#a1a1aa] hover:text-rose-500 transition-colors shrink-0 mt-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
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
                  e.target.style.height = Math.min(e.target.scrollHeight, 72) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddChecklistStep();
                  }
                }}
                placeholder="Add step/subtask (Press Enter)..."
                className="flex-1 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2.5 py-1.5 text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] outline-none focus:border-[#9ca3af] resize-none leading-relaxed min-h-[32px] max-h-[72px] overflow-hidden"
              />
              {newChecklistText.trim() && (
                <button
                  type="button"
                  onClick={handleAddChecklistStep}
                  className="px-2.5 py-1.5 bg-[#f3f4f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] text-xs font-semibold rounded-[6px] text-[#374151] dark:text-[#d4d4d8] shrink-0 self-end"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Metadata Toolbar & Action Button */}
      <div className="px-3.5 py-2.5 bg-[#fafafa] dark:bg-[#141416] border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between gap-2 flex-nowrap">
        <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
          {/* Project Selector Pill */}
          <div className="relative" ref={projectRef}>
            <button
              type="button"
              onClick={() => {
                setIsProjectMenuOpen(!isProjectMenuOpen);
                setIsTypeMenuOpen(false);
                setIsPriorityMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0"
            >
              <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span className="truncate max-w-[76px]">{selectedProject?.name || 'No Project'}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {isProjectMenuOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-52 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-0.5">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setProjectId(p.id);
                        setIsProjectMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs truncate flex items-center justify-between transition-colors ${
                        projectId === p.id
                          ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
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
                          onChange={(e) => {
                            setNewProjectName(e.target.value);
                            newProjectNameRef.current = e.target.value;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCreateProject();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsCreatingProject(false);
                              setNewProjectName('');
                              newProjectNameRef.current = '';
                            }
                          }}
                          placeholder="Project name..."
                          className="w-full bg-[#f9fafb] dark:bg-[#141416] border border-[#e5e7eb] dark:border-[#27272a] rounded-[4px] px-2 py-1 text-xs text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleCreateProject}
                          disabled={!newProjectName.trim()}
                          className="px-2 py-1 bg-[#111827] text-white dark:bg-white dark:text-[#111827] rounded-[4px] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingProject(true);
                        setTimeout(() => newProjectInputRef.current?.focus(), 50);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center gap-2 text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Project</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Type Selector Pill */}
          <div className="relative" ref={typeRef}>
            <button
              type="button"
              onClick={() => {
                setIsTypeMenuOpen(!isTypeMenuOpen);
                setIsProjectMenuOpen(false);
                setIsPriorityMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium border transition-colors shrink-0 bg-white dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]`}
            >
              <TypeIcon className="w-3.5 h-3.5 shrink-0 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span className="capitalize">{typeConfig.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {isTypeMenuOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-36 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                {(['task', 'bug', 'idea', 'improvement', 'research', 'question', 'note'] as ItemType[]).map((t) => {
                  const ItemIcon = TYPE_ICONS[t];
                  const cfg = ITEM_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setType(t);
                        setIsTypeMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs capitalize flex items-center justify-between transition-colors ${
                        type === t
                          ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
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

          {/* Priority Selector Pill */}
          <div className="relative" ref={priorityRef}>
            <button
              type="button"
              onClick={() => {
                setIsPriorityMenuOpen(!isPriorityMenuOpen);
                setIsProjectMenuOpen(false);
                setIsTypeMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.dotColor}`} />
              <span className="capitalize">{priorityConfig.label}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {isPriorityMenuOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-32 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                {(['none', 'low', 'medium', 'high', 'critical'] as Priority[]).map((p) => {
                  const pCfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setPriority(p);
                        setIsPriorityMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs capitalize flex items-center justify-between transition-colors ${
                        priority === p
                          ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
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
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim()}
          className="px-3.5 py-1 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-40 text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold shadow-subtle transition-all active:scale-[0.98] shrink-0 ml-auto"
        >
          Save
        </button>
      </div>
    </div>
  );
};
