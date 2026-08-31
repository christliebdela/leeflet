import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/db';
import { ChecklistItem } from '../../types';
import { CheckSquare, X, Plus } from 'lucide-react';
import { broadcastSync } from '../../utils/sync';

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
    const savedTheme = localStorage.getItem('leaf_theme') as 'light' | 'dark' | null;
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const savedColorTheme = localStorage.getItem('leaf_color_theme');
    if (savedColorTheme) {
      document.documentElement.setAttribute('data-color-theme', savedColorTheme);
    }
  };

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

        const lines = (description || '').split('\n').length;
        const descHeight = Math.min(Math.max(lines, 2) * 20, 140);
        const checklistHeight = (showChecklist || checklist.length > 0)
          ? 36 + Math.min(checklist.length * 28, 120)
          : 0;

        const logicalH = 175 + descHeight + checklistHeight;
        const clampedH = Math.min(Math.max(logicalH, 280), 440);
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWindow();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    <div className="w-screen h-screen bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[18px] shadow-modal relative flex flex-col select-none font-sans animate-capture-bounce">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-[#f3f4f6] dark:border-[#27272a] rounded-t-[18px] shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <img src="/leaf_logo.png" alt="leeflet" className="w-4 h-4 object-contain shrink-0 invert dark:invert-0" />
          <span className="font-brand text-[15px] italic text-[#111827] dark:text-[#f4f4f5] tracking-tight leading-none select-none">
            leeflet
          </span>
          <span className="text-[#9ca3af] dark:text-[#52525b]">›</span>
          <span className="text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa]">
            New Task
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
            onClick={closeWindow}
            className="text-[10px] font-semibold bg-[#f3f4f6] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-[5px] border border-[#e5e7eb] dark:border-[#3f3f46] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] transition-colors"
          >
            Esc
          </button>
        </div>
      </div>

      {/* Editor Body: Title, Description, Checklist */}
      <div ref={bodyScrollRef} className="px-4 pt-3.5 pb-2 overflow-y-auto custom-scrollbar flex-1 flex flex-col space-y-2.5 max-h-[340px] transition-all duration-200 ease-out">
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
          rows={showChecklist || checklist.length > 0 ? 2 : Math.min(Math.max((description || '').split('\n').length, 2), 6)}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Add description or notes... (Ctrl+Enter to save)"
          className="w-full bg-transparent text-xs text-[#374151] dark:text-[#d4d4d8] placeholder-[#9ca3af] dark:placeholder-[#52525b] outline-none focus:outline-none border-none p-0 resize-none leading-relaxed min-h-[44px] custom-scrollbar transition-all duration-200 ease-out"
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
                  className="ml-1.5 p-1 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[4px] disabled:opacity-30 transition-opacity shrink-0"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Footer */}
      <div className="px-4 py-2.5 bg-[#fafafa] dark:bg-[#141416] border-t border-[#f3f4f6] dark:border-[#27272a] rounded-b-[18px] flex items-center justify-between shrink-0">
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
  );
};
