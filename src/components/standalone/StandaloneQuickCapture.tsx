import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/db';
import { ChecklistItem } from '../../types';
import { CheckSquare, X, Plus } from 'lucide-react';
import { broadcastSync } from '../../utils/sync';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';

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

export const StandaloneQuickCapture: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<{ id: string; title: string; isCompleted: boolean }[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');

  const titleRef = useRef('');
  const descriptionRef = useRef('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const checklistInputRef = useRef<HTMLTextAreaElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  const closeWindow = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.hide();
    } catch {
      window.close();
    }
  };

  const applyCurrentTheme = () => {
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    const savedTheme = localStorage.getItem('leaf_theme') as 'light' | 'dark' | null;
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    const savedColorTheme = localStorage.getItem('leaf_color_theme') || 'default';
    document.documentElement.setAttribute('data-color-theme', savedColorTheme);
  };

  // Auto-resize description textarea on text change or wrap
  useEffect(() => {
    if (descTextareaRef.current) {
      descTextareaRef.current.style.height = 'auto';
      const scrollHeight = descTextareaRef.current.scrollHeight;
      const targetHeight = Math.min(Math.max(scrollHeight, 44), 180);
      descTextareaRef.current.style.height = `${targetHeight}px`;
    }
  }, [description]);

  // Adjust window dimensions dynamically to content
  useEffect(() => {
    const adjustWindowDimensions = async () => {
      try {
        const { getCurrentWindow, currentMonitor } = await import('@tauri-apps/api/window');
        const { PhysicalSize, PhysicalPosition } = await import('@tauri-apps/api/dpi');
        const win = getCurrentWindow();
        try {
          await win.setShadow(false);
        } catch {}
        const monitor = await currentMonitor();
        if (!monitor) return;

        const scaleFactor = monitor.scaleFactor || 1;
        const logicalW = 440;
        const physicalW = Math.round(logicalW * scaleFactor);

        const descHeight = descTextareaRef.current
          ? Math.min(Math.max(descTextareaRef.current.scrollHeight, 44), 180)
          : Math.min(Math.max((description || '').split('\n').length * 20, 44), 180);
          
        const checklistHeight = (showChecklist || checklist.length > 0)
          ? 36 + Math.min(checklist.length * 28, 120)
          : 0;

        const logicalH = 145 + descHeight + checklistHeight;
        const clampedH = Math.min(Math.max(logicalH, 220), 480);
        const physicalH = Math.round(clampedH * scaleFactor);

        const marginY = Math.round(58 * scaleFactor);
        const physicalX = monitor.position.x + Math.round((monitor.size.width - physicalW) / 2);
        const physicalY = monitor.position.y + monitor.size.height - physicalH - marginY;

        await win.setSize(new PhysicalSize(physicalW, physicalH));
        await win.setPosition(new PhysicalPosition(physicalX, physicalY));
      } catch {
        // ignore
      }
    };

    adjustWindowDimensions();
  }, [
    description,
    checklist.length,
    showChecklist,
  ]);

  useEffect(() => {
    applyCurrentTheme();

    let hasGainedFocus = false;
    const mountTime = Date.now();

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWindow();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        const active = document.activeElement;
        const isInputOrTextarea = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
        if (!isInputOrTextarea) {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              e.preventDefault();
              if (!titleRef.current) {
                const lines = text.split('\n');
                if (lines.length === 1 && lines[0].length <= 80) {
                  setTitle(lines[0]);
                  titleInputRef.current?.focus();
                } else {
                  setDescription(text);
                  descTextareaRef.current?.focus();
                }
              } else {
                setDescription((prev) => (prev ? `${prev}\n${text}` : text));
                descTextareaRef.current?.focus();
              }
            }
          } catch {}
        }
      }
    };

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const active = document.activeElement;
      const isInputOrTextarea = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (!isInputOrTextarea) {
        const text = e.clipboardData?.getData('text') || '';
        if (text) {
          e.preventDefault();
          if (!titleRef.current) {
            const lines = text.split('\n');
            if (lines.length === 1 && lines[0].length <= 80) {
              setTitle(lines[0]);
              titleInputRef.current?.focus();
            } else {
              setDescription(text);
              descTextareaRef.current?.focus();
            }
          } else {
            setDescription((prev) => (prev ? `${prev}\n${text}` : text));
            descTextareaRef.current?.focus();
          }
        }
      }
    };

    const handleFocus = () => {
      hasGainedFocus = true;
      applyCurrentTheme();
      if (!titleRef.current) {
        titleInputRef.current?.focus();
      }
    };

    const handleBlur = () => {
      if (hasGainedFocus && Date.now() - mountTime > 300) {
        closeWindow();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'leaf_theme' || e.key === 'leaf_color_theme') {
        applyCurrentTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handleGlobalPaste);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('storage', handleStorageChange);

    // Tauri-native focus listener
    let unlistenFocus: (() => void) | undefined;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (focused) {
          hasGainedFocus = true;
          applyCurrentTheme();
          titleInputRef.current?.focus();
        } else if (hasGainedFocus && Date.now() - mountTime > 300) {
          closeWindow();
        }
      }).then((unlisten) => {
        unlistenFocus = unlisten;
      }).catch(() => {});
    }).catch(() => {});

    // Ensure input is focused
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handleGlobalPaste);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('storage', handleStorageChange);
      if (unlistenFocus) unlistenFocus();
    };
  }, []);

  const toggleChecklist = () => {
    setShowChecklist(!showChecklist);
    if (!showChecklist) {
      setTimeout(() => checklistInputRef.current?.focus(), 50);
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

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle && !trimmedDesc) return;

    const finalTitle = trimmedTitle || deriveTitleFromContent(trimmedDesc, 7);
    const finalContent = trimmedDesc;

    const checklistItems: ChecklistItem[] = checklist.map((c, idx) => ({
      id: c.id || crypto.randomUUID(),
      itemId: '',
      title: c.title.trim(),
      isCompleted: false,
      position: idx,
    }));

    const newItem = await dbService.createItem({
      projectId: '',
      title: finalTitle,
      content: finalContent,
      type: 'task',
      priority: 'none',
      status: 'inbox',
      tags: [],
      checklist: checklistItems,
      attachments: [],
      assigneeId: null,
      dueAt: null,
    });

    broadcastSync({ type: 'item_created', item: newItem });
    setTitle('');
    setDescription('');
    setChecklist([]);
    setShowChecklist(false);
    setNewChecklistText('');
    closeWindow();
  };

  const hasContent = Boolean(title.trim() || description.trim());

  return (
    <div className="w-screen h-screen bg-white dark:bg-[var(--theme-bg-card,#18181b)] border border-[#e5e7eb] dark:border-[var(--theme-border,#27272a)] rounded-[12px] shadow-2xl relative flex flex-col overflow-hidden select-none font-sans animate-capture-bounce">
      {/* Top Header Row with Title Badge and Actions */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-[#f3f4f6] dark:border-[var(--theme-border,#27272a)] shrink-0" data-tauri-drag-region>
        <div className="flex items-center gap-2 text-xs" data-tauri-drag-region>
          <img src="/leaf_logo.png" alt="leeflet" className="w-4 h-4 object-contain shrink-0 invert dark:invert-0" data-tauri-drag-region />
          <span className="font-brand text-[15px] italic text-[#111827] dark:text-[#f4f4f5] tracking-tight leading-none select-none" data-tauri-drag-region>
            leeflet
          </span>
          <span className="text-[#9ca3af] dark:text-[#52525b]">›</span>
          <span className="text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa]" data-tauri-drag-region>
            New Task
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleChecklist}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer ${
              showChecklist || checklist.length > 0
                ? 'text-[#111827] dark:text-white bg-[#f3f4f6] dark:bg-[var(--theme-bg-card-elevated,#27272a)]'
                : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[var(--theme-bg-card-elevated,#27272a)]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Checklist{checklist.length > 0 ? ` (${checklist.length})` : ''}</span>
          </button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={closeWindow}
                  className="text-[10px] font-semibold bg-[#f3f4f6] dark:bg-[var(--theme-bg-card-elevated,#27272a)] text-[#6b7280] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-[5px] border border-[#e5e7eb] dark:border-[var(--theme-border,#3f3f46)] hover:bg-[#e5e7eb] dark:hover:bg-[var(--theme-bg-card,#3f3f46)] transition-colors cursor-pointer"
                >
                  Esc
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Close (Esc)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Editor Body: Title, Description, Checklist */}
      <div ref={bodyScrollRef} className="px-4 py-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col space-y-2.5 transition-all duration-200 ease-out">
        {/* Prominent Title Line */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              descTextareaRef.current?.focus();
            }
          }}
          placeholder="Task title"
          className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#52525b] outline-none focus:outline-none border-none p-0 leading-tight"
          autoFocus
        />

        {/* Description Area */}
        <textarea
          ref={descTextareaRef}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            e.target.style.height = 'auto';
            const targetHeight = Math.min(Math.max(e.target.scrollHeight, 44), 180);
            e.target.style.height = `${targetHeight}px`;
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Add description or notes... (Ctrl+Enter to save)"
          className="w-full bg-transparent text-xs text-[#374151] dark:text-[#d4d4d8] placeholder-[#9ca3af] dark:placeholder-[#52525b] outline-none focus:outline-none border-none p-0 resize-none leading-relaxed min-h-[44px] max-h-[180px] overflow-y-auto custom-scrollbar transition-[height] duration-75"
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
                        className="opacity-60 hover:opacity-100 p-0.5 text-[#6b7280] dark:text-[#a1a1aa] hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add checklist input */}
              <div className="flex items-start gap-2 pt-1">
                <span className="w-3 h-3 mt-1.5 rounded border border-dashed border-[#9ca3af] dark:border-[#52525b] flex items-center justify-center shrink-0" />
                <div className="flex-1 flex items-center bg-[#f9fafb] dark:bg-[#141416] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] px-2 py-1 focus-within:border-[#9ca3af] dark:focus-within:border-[#52525b] transition-colors">
                  <textarea
                    ref={checklistInputRef}
                    rows={1}
                    value={newChecklistText}
                    onChange={(e) => {
                      setNewChecklistText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 60)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddChecklistStep();
                      } else if (e.key === 'Escape') {
                        if (!newChecklistText) {
                          setShowChecklist(false);
                        }
                      }
                    }}
                    placeholder="Add a step... (Press Enter to add)"
                    className="w-full bg-transparent text-xs text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#52525b] outline-none focus:outline-none border-none p-0 resize-none leading-relaxed max-h-[60px] custom-scrollbar overflow-y-auto"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistStep}
                    disabled={!newChecklistText.trim()}
                    className="ml-1.5 p-1 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[4px] disabled:opacity-30 transition-opacity shrink-0 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Row inside Card */}
        <div className="px-4 py-2.5 bg-transparent border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between gap-2 shrink-0">
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
            className="px-3.5 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] disabled:opacity-40 text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold transition-all shadow-subtle active:scale-[0.98] shrink-0 cursor-pointer"
          >
            Create task
          </button>
        </div>
    </div>
  );
};
