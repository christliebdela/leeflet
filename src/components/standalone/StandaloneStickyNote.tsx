import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/db';
import { Item, Project, ChecklistItem, Attachment, ItemType } from '../../types';
import {
  X,
  MoreHorizontal,
  Pin,
  Plus,
  Trash2,
  CheckSquare,
  Paperclip,
  Eye,
  Download,
  Check,
  ChevronDown,
  Folder,
  Bug,
  Lightbulb,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';
import { broadcastSync, subscribeToSync } from '../../utils/sync';
import { ITEM_TYPE_CONFIG, STATUS_CONFIG } from '../../utils/format';

const TYPE_ICONS: Record<ItemType, React.FC<{ className?: string }>> = {
  task: CheckSquare,
  bug: Bug,
  idea: Lightbulb,
  improvement: Sparkles,
  research: BookOpen,
  question: HelpCircle,
  note: FileText,
};

interface StandaloneStickyNoteProps {
  itemId: string;
}

type ColorPreset = 'theme' | 'yellow' | 'blue' | 'green' | 'rose' | 'purple' | 'peach';

const COLOR_STYLES: Record<
  ColorPreset,
  {
    bg: string;
    border: string;
    text: string;
    mutedText: string;
    accent: string;
    subtleBg: string;
    swatch: string;
  }
> = {
  theme: {
    swatch: 'bg-[#e4e4e7] dark:bg-[#3f3f46] border-[#d4d4d8] dark:border-[#52525b]',
    bg: 'bg-white dark:bg-[#18181b]',
    border: 'border-[#e5e7eb] dark:border-[#27272a]',
    text: 'text-[#111827] dark:text-[#f4f4f5]',
    mutedText: 'text-[#6b7280] dark:text-[#a1a1aa]',
    accent: 'text-[#111827] dark:text-white',
    subtleBg: 'hover:bg-[#f4f5f6] dark:hover:bg-[#27272a]',
  },
  yellow: {
    swatch: 'bg-[#fef08a] border-[#fde047]',
    bg: 'bg-[#fef08a]',
    border: 'border-[#fde047]',
    text: 'text-[#1c1917]',
    mutedText: 'text-[#713f12]',
    accent: 'text-[#000000]',
    subtleBg: 'hover:bg-[#fde047]',
  },
  blue: {
    swatch: 'bg-[#bfdbfe] border-[#93c5fd]',
    bg: 'bg-[#bfdbfe]',
    border: 'border-[#93c5fd]',
    text: 'text-[#0f172a]',
    mutedText: 'text-[#1e40af]',
    accent: 'text-[#000000]',
    subtleBg: 'hover:bg-[#93c5fd]',
  },
  green: {
    swatch: 'bg-[#bbf7d0] border-[#86efac]',
    bg: 'bg-[#bbf7d0]',
    border: 'border-[#86efac]',
    text: 'text-[#052e16]',
    mutedText: 'text-[#15803d]',
    accent: 'text-[#000000]',
    subtleBg: 'hover:bg-[#86efac]',
  },
  rose: {
    swatch: 'bg-[#fecdd3] border-[#fda4af]',
    bg: 'bg-[#fecdd3]',
    border: 'border-[#fda4af]',
    text: 'text-[#4c0519]',
    mutedText: 'text-[#be123c]',
    accent: 'text-[#000000]',
    subtleBg: 'hover:bg-[#fda4af]',
  },
  purple: {
    swatch: 'bg-[#e9d5ff] border-[#d8b4fe]',
    bg: 'bg-[#e9d5ff]',
    border: 'border-[#d8b4fe]',
    text: 'text-[#3b0764]',
    mutedText: 'text-[#7e22ce]',
    accent: 'text-[#000000]',
    subtleBg: 'hover:bg-[#d8b4fe]',
  },
  peach: {
    swatch: 'bg-[#fed7aa] border-[#fdba74]',
    bg: 'bg-[#fed7aa]',
    border: 'border-[#fdba74]',
    text: 'text-[#431407]',
    mutedText: 'text-[#c2410c]',
    accent: 'text-[#000000]',
    subtleBg: 'hover:bg-[#fdba74]',
  },
};

export const StandaloneStickyNote: React.FC<StandaloneStickyNoteProps> = ({ itemId }) => {
  const [item, setItem] = useState<Item | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [colorPreset, setColorPreset] = useState<ColorPreset>('theme');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [previewImage, setPreviewImage] = useState<Attachment | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  const closeWindow = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.close();
    } catch {
      window.close();
    }
  };

  const toggleAlwaysOnTop = async () => {
    const nextState = !isAlwaysOnTop;
    setIsAlwaysOnTop(nextState);
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.setAlwaysOnTop(nextState);
    } catch (err) {
      console.error('Failed to set always on top:', err);
    }
  };

  const loadItemData = async () => {
    const it = await dbService.getItem(itemId);
    if (it) {
      setItem(it);
      const projs = await dbService.getProjects();
      setProjects(projs);
      const p = projs.find((x) => x.id === it.projectId);
      setProject(p || null);
    }
  };

  useEffect(() => {
    // Theme sync
    const savedTheme = localStorage.getItem('leaf_theme') as 'light' | 'dark' | null;
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Color preset
    const savedColor = localStorage.getItem(`leaf_note_color_${itemId}`) as ColorPreset | null;
    if (savedColor && COLOR_STYLES[savedColor]) {
      setColorPreset(savedColor);
    }

    loadItemData();

    // Subscribe to real-time inter-window sync
    const unsubscribeSync = subscribeToSync((msg) => {
      if (msg.type === 'item_updated' && msg.item.id === itemId) {
        if (
          document.activeElement !== titleInputRef.current &&
          document.activeElement !== textareaRef.current
        ) {
          setItem(msg.item);
          const p = projects.find((x) => x.id === msg.item.projectId);
          setProject(p || null);
        }
      } else if (msg.type === 'item_deleted' && msg.itemId === itemId) {
        closeWindow();
      } else if (msg.type === 'projects_reload') {
        dbService.getProjects().then((projs) => setProjects(projs));
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribeSync();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [itemId]);

  // Synchronize OS Taskbar Window Title with the Item Title
  useEffect(() => {
    if (item?.title) {
      const winTitle = `${item.title} — leaf`;
      document.title = winTitle;
      import('@tauri-apps/api/window')
        .then(({ getCurrentWindow }) => {
          getCurrentWindow().setTitle(winTitle).catch(() => {});
        })
        .catch(() => {});
    } else if (item) {
      document.title = 'leaf';
      import('@tauri-apps/api/window')
        .then(({ getCurrentWindow }) => {
          getCurrentWindow().setTitle('leaf').catch(() => {});
        })
        .catch(() => {});
    }
  }, [item?.title]);

  const handleColorChange = (preset: ColorPreset) => {
    setColorPreset(preset);
    localStorage.setItem(`leaf_note_color_${itemId}`, preset);
    setIsMenuOpen(false);
  };

  const triggerSave = (patch: Partial<Item>) => {
    if (!item) return;
    const updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
    setItem(updated);

    if (patch.projectId !== undefined) {
      const p = projects.find((x) => x.id === patch.projectId);
      setProject(p || null);
    }

    // Broadcast instant zero-latency sync to main window & other open panels
    broadcastSync({ type: 'item_updated', item: updated });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await dbService.updateItem(updated);
    }, 300);
  };

  const handleToggleStatus = async () => {
    if (!item) return;
    const nextStatus = item.status === 'done' ? 'in_progress' : 'done';
    triggerSave({ status: nextStatus });
  };

  const handleToggleChecklist = (id: string) => {
    if (!item) return;
    const currentList = item.checklist || [];
    const nextList = currentList.map((c) =>
      c.id === id ? { ...c, isCompleted: !c.isCompleted } : c
    );
    triggerSave({ checklist: nextList });
  };

  const stickyChecklistInputRef = useRef<HTMLInputElement>(null);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim() || !item) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      itemId: item.id,
      title: newChecklistText.trim(),
      isCompleted: false,
      position: (item.checklist || []).length,
    };
    const nextList = [...(item.checklist || []), newItem];
    triggerSave({ checklist: nextList });
    setNewChecklistText('');
    setTimeout(() => stickyChecklistInputRef.current?.focus(), 20);
  };

  const handleDeleteChecklistItem = (id: string) => {
    if (!item) return;
    const nextList = (item.checklist || []).filter((c) => c.id !== id);
    triggerSave({ checklist: nextList });
  };

  if (!item) {
    return (
      <div className="w-screen h-screen bg-white dark:bg-[#18181b] p-4 flex items-center justify-center text-xs text-[#6b7280]">
        Loading note...
      </div>
    );
  }

  const currentTheme = COLOR_STYLES[colorPreset] || COLOR_STYLES.theme;
  const checklist = item.checklist || [];
  const attachments = item.attachments || [];

  return (
    <div
      className={`w-screen h-screen ${currentTheme.bg} ${currentTheme.border} border p-3 flex flex-col justify-between select-none overflow-hidden font-sans ${currentTheme.text} shadow-xl relative transition-colors duration-150`}
    >
      {/* Header with Drag Region & Interactive Dropdowns */}
      <div
        data-tauri-drag-region
        className={`flex items-center justify-between cursor-move pb-2.5 border-b ${currentTheme.border}`}
      >
        <div className="flex items-center gap-1.5 min-w-0" data-tauri-drag-region>
          {/* Fixed Project Label */}
          <div
            className={`flex items-center gap-1.5 px-1 py-0.5 rounded text-[11px] font-semibold tracking-tight ${currentTheme.mutedText} max-w-[140px] truncate`}
            data-tauri-drag-region
          >
            <Folder className="w-3 h-3 opacity-70 shrink-0" />
            <span className="truncate">{project?.name || 'Backlog'}</span>
          </div>

          <span className={`${currentTheme.mutedText} text-[11px] opacity-40`} data-tauri-drag-region>
            /
          </span>

          {/* Type Selector */}
          <div className="relative" ref={typeRef}>
            <button
              onClick={() => {
                setIsTypeDropdownOpen(!isTypeDropdownOpen);
                setIsMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-semibold capitalize ${currentTheme.subtleBg} ${currentTheme.mutedText} transition-colors`}
            >
              {React.createElement(TYPE_ICONS[item.type] || CheckSquare, { className: 'w-3 h-3 opacity-80 shrink-0' })}
              <span>{ITEM_TYPE_CONFIG[item.type]?.label || item.type}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                {(['task', 'bug', 'idea', 'improvement', 'research', 'question', 'note'] as ItemType[]).map((t) => {
                  const ItemIcon = TYPE_ICONS[t];
                  const cfg = ITEM_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        triggerSave({ type: t });
                        setIsTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] capitalize flex items-center justify-between transition-colors ${
                        item.type === t
                          ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
                          : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ItemIcon className="w-3 h-3 opacity-80 shrink-0" />
                        <span>{cfg.label}</span>
                      </div>
                      {item.type === t && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 shrink-0 relative" ref={menuRef}>
          {/* Always on top Pin Button */}
          <button
            onClick={toggleAlwaysOnTop}
            className={`p-1 rounded-[4px] transition-colors ${
              isAlwaysOnTop
                ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827]'
                : `${currentTheme.subtleBg} ${currentTheme.mutedText}`
            }`}
            title={isAlwaysOnTop ? 'Unpin from Top' : 'Pin Always on Top'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {/* Color & Options Menu Button */}
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsTypeDropdownOpen(false);
            }}
            className={`p-1 ${currentTheme.subtleBg} rounded-[4px] ${currentTheme.mutedText} transition-colors`}
            title="Options & Color"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Options Dropdown Menu with minimal color boxes */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-auto min-w-[190px] bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between gap-1.5 mb-2">
                {(Object.keys(COLOR_STYLES) as ColorPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleColorChange(preset)}
                    className={`w-5 h-5 rounded-[4px] border ${COLOR_STYLES[preset].swatch} flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                      colorPreset === preset ? 'ring-2 ring-[#111827] dark:ring-white ring-offset-1 dark:ring-offset-[#1c1c1f]' : ''
                    }`}
                  >
                    {colorPreset === preset && (
                      <Check className="w-3 h-3 text-[#111827] dark:text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
                <button
                  onClick={toggleAlwaysOnTop}
                  className="w-full text-left px-2 py-1 rounded hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[11px] text-[#374151] dark:text-[#d4d4d8] flex items-center justify-between"
                >
                  <span>Always on Top</span>
                  <span className="text-[10px] font-semibold text-[#9ca3af]">{isAlwaysOnTop ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Close Window */}
          <button
            onClick={closeWindow}
            className={`p-1 ${currentTheme.subtleBg} rounded-[4px] ${currentTheme.mutedText} transition-colors`}
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="py-2.5 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {/* Editable Title */}
        <input
          ref={titleInputRef}
          type="text"
          value={item.title}
          onChange={(e) => triggerSave({ title: e.target.value })}
          placeholder="Item title..."
          className={`w-full text-xs font-bold ${currentTheme.accent} bg-transparent focus:outline-none placeholder:text-[#9ca3af] border-b border-transparent focus:border-current/30 pb-0.5`}
        />

        {/* Editable Notes Content */}
        <div>
          <textarea
            ref={textareaRef}
            value={item.content || ''}
            onChange={(e) => triggerSave({ content: e.target.value })}
            placeholder="Add notes, details, thoughts..."
            rows={3}
            className={`w-full text-[11.5px] ${currentTheme.text} bg-transparent focus:outline-none placeholder:text-[#9ca3af] dark:placeholder:text-[#71717a] resize-none leading-relaxed custom-scrollbar`}
          />
        </div>

        {/* Checklist Section */}
        <div className="space-y-1.5 pt-1 border-t border-current/10">
          <div className="flex items-center justify-between text-[11px] font-bold text-current/80">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-3 h-3" />
              <span>Checklist</span>
              {checklist.length > 0 && (
                <span className="text-[9.5px] font-normal opacity-70">
                  ({checklist.filter((c) => c.isCompleted).length}/{checklist.length})
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setIsAddingChecklist(true);
                setTimeout(() => stickyChecklistInputRef.current?.focus(), 40);
              }}
              className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
              title="Add Item"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Checklist Items */}
          <div className="space-y-1">
            {checklist.map((check) => (
              <div
                key={check.id}
                className="group flex items-start justify-between gap-1.5 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/5 px-1 rounded transition-colors"
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    <Checkbox
                      checked={check.isCompleted}
                      onChange={() => handleToggleChecklist(check.id)}
                    />
                  </div>
                  <span
                    className={`text-[11px] break-words whitespace-pre-wrap flex-1 leading-snug ${
                      check.isCompleted ? 'line-through opacity-50' : ''
                    }`}
                  >
                    {check.title}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteChecklistItem(check.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-500 rounded transition-opacity shrink-0 mt-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {isAddingChecklist && (
              <div className="flex items-center gap-1 mt-1">
                <input
                  ref={stickyChecklistInputRef}
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddChecklistItem();
                    if (e.key === 'Escape') {
                      setIsAddingChecklist(false);
                      setNewChecklistText('');
                    }
                  }}
                  autoFocus
                  placeholder="Type item & press Enter..."
                  className="flex-1 text-[11px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded focus:outline-none"
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="px-1.5 py-0.5 bg-black/10 dark:bg-white/20 hover:bg-black/20 text-[10px] font-semibold rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingChecklist(false);
                    setNewChecklistText('');
                  }}
                  className="p-0.5 text-current/60 hover:text-current"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-current/10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-current/80">
              <Paperclip className="w-3 h-3" />
              <span>Attachments ({attachments.length})</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {attachments.map((att) => {
                const isImage =
                  att.mimeType?.startsWith('image/') ||
                  att.filePath?.startsWith('data:image/') ||
                  /\.(png|jpe?g|gif|webp|svg)$/i.test(att.fileName);

                return (
                  <div
                    key={att.id}
                    onClick={() => isImage && setPreviewImage(att)}
                    className="relative group rounded border border-current/20 overflow-hidden bg-black/5 dark:bg-white/5 p-1 flex flex-col items-center cursor-pointer hover:border-current/50 transition-colors"
                  >
                    {isImage && att.filePath ? (
                      <div className="w-full h-12 relative overflow-hidden rounded mb-1 bg-black/10">
                        <img
                          src={att.filePath}
                          alt={att.fileName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-12 flex items-center justify-center text-current/60">
                        <Paperclip className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-[9.5px] truncate w-full text-center">
                      {att.fileName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`pt-2.5 border-t ${currentTheme.border} flex items-center justify-between text-[10px] font-bold tracking-wider`}
      >
        <span className="truncate max-w-[140px] uppercase opacity-75">
          {STATUS_CONFIG[item.status]?.label || item.status.replace('_', ' ')}
        </span>

        <button
          onClick={handleToggleStatus}
          className={`px-2 py-0.5 rounded ${currentTheme.subtleBg} hover:opacity-80 transition-opacity text-[11px] font-semibold`}
        >
          {item.status === 'done' ? 'Mark Incomplete' : 'Mark Done'}
        </button>
      </div>

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-100"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-full max-h-full flex flex-col items-center gap-2"
          >
            <div className="flex items-center justify-between w-full text-white text-xs px-1">
              <span className="truncate max-w-[200px]">{previewImage.fileName}</span>
              <div className="flex items-center gap-2">
                {previewImage.filePath && (
                  <a
                    href={previewImage.filePath}
                    download={previewImage.fileName}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <img
              src={previewImage.filePath || ''}
              alt={previewImage.fileName}
              className="max-h-[220px] max-w-full object-contain rounded border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
