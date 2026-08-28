import React, { useState, useEffect, useRef } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { ItemType, Priority, Project, ChecklistItem } from '../types';
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
} from 'lucide-react';
import { ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../utils/format';

const TYPE_ICONS: Record<ItemType, React.FC<{ className?: string }>> = {
  task: CheckSquare,
  bug: Bug,
  idea: Lightbulb,
  improvement: Sparkles,
  research: BookOpen,
  question: HelpCircle,
  note: FileText,
};

export const QuickCaptureModal: React.FC = () => {
  const {
    isQuickCaptureOpen,
    setQuickCaptureOpen,
    projects,
    createItem,
    viewMode,
    selectedProjectId,
  } = useLeafStore();

  const isInProjectView = viewMode.type === 'project';
  const activeProject = isInProjectView ? projects.find((p: Project) => p.id === viewMode.projectId) : null;

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(
    isInProjectView && activeProject ? activeProject.id : (selectedProjectId || (projects[0]?.id || ''))
  );
  const [type, setType] = useState<ItemType>('task');
  const [priority, setPriority] = useState<Priority>('none');
  const [checklist, setChecklist] = useState<{ id: string; title: string; isCompleted: boolean }[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');

  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const checklistInputRef = useRef<HTMLTextAreaElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

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

  // Global window Escape listener
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickCaptureOpen) {
        setQuickCaptureOpen(false);
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

    window.addEventListener('keydown', handleWindowKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQuickCaptureOpen, setQuickCaptureOpen]);

  useEffect(() => {
    if (isQuickCaptureOpen) {
      if (isInProjectView && activeProject) {
        setProjectId(activeProject.id);
      } else if (selectedProjectId) {
        setProjectId(selectedProjectId);
      } else if (projects.length > 0 && !projectId) {
        setProjectId(projects[0].id);
      }
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setTitle('');
      setChecklist([]);
      setShowChecklist(false);
      setNewChecklistText('');
    }
  }, [isQuickCaptureOpen, isInProjectView, activeProject, selectedProjectId, projects, projectId]);

  if (!isQuickCaptureOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) return;

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
      title: title.trim(),
      type,
      priority,
      status: 'inbox',
      checklist: checklistItems,
    });

    setTitle('');
    setChecklist([]);
    setShowChecklist(false);
    setNewChecklistText('');
    setQuickCaptureOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const TypeIcon = TYPE_ICONS[type] || CheckSquare;
  const typeConfig = ITEM_TYPE_CONFIG[type] || ITEM_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setQuickCaptureOpen(false);
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-[390px] max-h-[340px] bg-white dark:bg-[#18181b] rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal relative animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#f3f4f6] dark:border-[#27272a] rounded-t-[12px]">
          <div className="flex items-center gap-2">
            <img
              src="/leaf_logo.png"
              alt="leaf"
              className="w-4 h-4 object-contain brightness-0 dark:brightness-0 dark:invert transition-all"
            />
            <span className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">New Item</span>
          </div>

          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="text-[10px] font-semibold bg-[#f3f4f6] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#3f3f46] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46]"
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
            placeholder="Add a task, idea, bug, note, or research..."
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

        {/* Horizontal Metadata Chips & Single-Row Footer */}
        <div className="px-3.5 py-2.5 bg-[#fafafa] dark:bg-[#141416] border-t border-[#f3f4f6] dark:border-[#27272a] rounded-b-[12px] flex items-center justify-between gap-3 text-xs flex-nowrap">
          <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
            {/* Project Chip */}
            {isInProjectView && activeProject ? (
              <div
                title="Capturing inside current project"
                className="flex items-center gap-1.5 px-2 py-1 bg-[#f3f4f6] dark:bg-[#27272a] rounded-[6px] text-xs font-medium text-[#374151] dark:text-[#d4d4d8] border border-[#e5e7eb] dark:border-[#3f3f46] shrink-0"
              >
                <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                <span className="truncate max-w-[76px]">{activeProject.name}</span>
              </div>
            ) : (
              <div className="relative" ref={projectRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProjectMenuOpen(!isProjectMenuOpen);
                    setIsTypeMenuOpen(false);
                    setIsPriorityMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2 py-1 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0 text-xs font-medium text-[#374151] dark:text-[#f4f4f5]"
                >
                  <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                  <span className="truncate max-w-[76px]">{selectedProject?.name || 'No Project'}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                </button>

                {isProjectMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-1.5 w-48 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
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
                )}
              </div>
            )}

            {/* Type Chip */}
            <div className="relative" ref={typeRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTypeMenuOpen(!isTypeMenuOpen);
                  setIsProjectMenuOpen(false);
                  setIsPriorityMenuOpen(false);
                }}
                className="flex items-center gap-1.5 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2 py-1 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0 text-xs font-medium text-[#374151] dark:text-[#f4f4f5]"
              >
                <TypeIcon className="w-3.5 h-3.5 shrink-0 text-[#6b7280] dark:text-[#a1a1aa]" />
                <span className="capitalize">{typeConfig.label}</span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {isTypeMenuOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-36 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5">
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

            {/* Priority Chip */}
            <div className="relative" ref={priorityRef}>
              <button
                type="button"
                onClick={() => {
                  setIsPriorityMenuOpen(!isPriorityMenuOpen);
                  setIsProjectMenuOpen(false);
                  setIsTypeMenuOpen(false);
                }}
                className="flex items-center gap-1.5 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2 py-1 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0 text-xs font-medium text-[#374151] dark:text-[#f4f4f5]"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.dotColor}`} />
                <span className="capitalize">{priorityConfig.label}</span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {isPriorityMenuOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-32 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5">
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

          {/* Right Action Button */}
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-3.5 py-1 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-50 text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold transition-all shadow-subtle active:scale-[0.98] shrink-0 ml-auto"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
