import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/db';
import { Project, ItemType, Priority } from '../../types';
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

  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const closeWindow = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      setTitle('');
      await win.hide();
    } catch {
      window.close();
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
          const physicalW = Math.round(390 * scaleFactor);
          const physicalH = Math.round(245 * scaleFactor);
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
      // Auto-close if nothing is typed in
      if (!titleRef.current.trim()) {
        closeWindow();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWindow();
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
          if (!focused && !titleRef.current.trim()) {
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
    if (!title.trim()) return;

    const newItem = await dbService.createItem({
      projectId,
      title: title.trim(),
      type,
      priority,
      status: 'inbox',
      tags: [],
      checklist: [],
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
      className="w-screen h-screen bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-2xl flex flex-col justify-between select-none font-sans overflow-hidden animate-capture-bounce"
    >
      {/* Top Header */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#f3f4f6] dark:border-[#27272a] rounded-t-[12px]"
      >
        <div className="flex items-center gap-2">
          <img
            src="/leaf_logo.png"
            alt="leaf"
            className="w-4 h-4 object-contain brightness-0 dark:brightness-0 dark:invert transition-all"
          />
          <span
            className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight"
          >
            New Item
          </span>
        </div>

        <button
          onClick={closeWindow}
          className="text-[10px] font-semibold bg-[#f3f4f6] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#3f3f46] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors"
        >
          Esc
        </button>
      </div>

      {/* Main Textarea Input */}
      <div className="px-4 py-2 flex-1 flex flex-col justify-center">
        <div className="text-[11px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] mb-1.5">
          What are you working on?
        </div>
        <textarea
          ref={textareaRef}
          rows={4}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Add a task, idea, bug, note, or research..."
          className="w-full bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] rounded-[8px] p-2.5 text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] outline-none focus:outline-none focus:ring-0 resize-none leading-relaxed min-h-[96px]"
        />
      </div>

      {/* Bottom Metadata Toolbar & Action Button */}
      <div className="px-4 py-2.5 bg-[#fafafa] dark:bg-[#141416] border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between gap-2 flex-nowrap">
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
              <span className="truncate max-w-[80px]">{selectedProject?.name || 'No Project'}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {isProjectMenuOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-44 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
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

          {/* Type Selector Pill */}
          <div className="relative" ref={typeRef}>
            <button
              type="button"
              onClick={() => {
                setIsTypeMenuOpen(!isTypeMenuOpen);
                setIsProjectMenuOpen(false);
                setIsPriorityMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium border transition-colors shrink-0 bg-white dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]`}
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0"
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
          className="px-4 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-40 text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold shadow-subtle transition-all active:scale-[0.98] shrink-0"
        >
          Save
        </button>
      </div>
    </div>
  );
};
