import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/db';
import { Item, Priority, ItemType, ChecklistItem } from '../../types';
import {
  X,
  Circle,
  CheckCircle2,
  Plus,
  Maximize2,
  Pin,
  Palette,
  Check,
  ChevronDown,
  CheckSquare,
  Square,
  Trash2,
  Sparkles,
  Coffee,
} from 'lucide-react';
import { broadcastSync, subscribeToSync } from '../../utils/sync';
import { exitMiniMode } from '../../utils/window';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { fetchRandomDevJoke, warmJokePool } from '../../utils/jokes';

type SectionKey = 'critical' | 'high' | 'medium' | 'low' | 'ideas' | 'inbox';

const MINI_QUEUE_EMPTY_MESSAGES: Record<SectionKey, string> = {
  critical: 'No critical items pending',
  high: 'No high priority items pending',
  medium: 'Medium queue clear',
  low: 'Low queue clear',
  ideas: 'No active ideas parked',
  inbox: 'Inbox clear',
};

export type ColorPreset = 'theme' | 'yellow' | 'blue' | 'green' | 'rose' | 'purple' | 'peach';

export const COLOR_STYLES: Record<
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

export const StandaloneQueueWidget: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [addingSection, setAddingSection] = useState<SectionKey | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(() => localStorage.getItem('leaf_queue_widget_always_on_top') === 'true');
  const [colorPreset, setColorPreset] = useState<ColorPreset>(() => (localStorage.getItem('leaf_queue_widget_color') as ColorPreset) || 'theme');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStandby, setIsStandby] = useState(false);
  const [jokeHistory, setJokeHistory] = useState<string[]>([]);
  const [jokeHistoryIndex, setJokeHistoryIndex] = useState(0);
  const standbyJoke = jokeHistory[jokeHistoryIndex] ?? null;
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({});
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Load first joke when entering Standby, reset history on exit
  useEffect(() => {
    const jokesEnabled = localStorage.getItem('leaf_standby_jokes_enabled') === 'true';
    if (isStandby && jokesEnabled) {
      let isCurrent = true;
      fetchRandomDevJoke(true).then((joke) => {
        if (isCurrent) {
          setJokeHistory([joke]);
          setJokeHistoryIndex(0);
        }
      });
      return () => { isCurrent = false; };
    } else {
      setJokeHistory([]);
      setJokeHistoryIndex(0);
    }
  }, [isStandby]);

  // Ensure Mini Mode widget cannot be maximized + warm joke pool
  useEffect(() => {
    // Pre-warm joke pool on mount so standby is instant
    warmJokePool();
    (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        await win.setMaximizable(false);
        if (await win.isMaximized()) {
          await win.unmaximize();
        }
      } catch {}
    })();
  }, []);

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
    const next = !isAlwaysOnTop;
    setIsAlwaysOnTop(next);
    localStorage.setItem('leaf_queue_widget_always_on_top', String(next));
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.setAlwaysOnTop(next);
    } catch (err) {
      console.warn('Failed to set always on top:', err);
    }
  };

  const loadData = async () => {
    const it = await dbService.getItems();
    setItems(it);
  };

  const handleToggleDone = async (item: Item, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = item.status === 'done' ? 'inbox' : 'done';
    const updated: Item = { ...item, status: nextStatus };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    broadcastSync({ type: 'item_updated', item: updated });
    await dbService.updateItem(updated);
  };

  const handleUpdateItemTitle = async (item: Item, newTitle: string) => {
    const updated: Item = { ...item, title: newTitle };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    broadcastSync({ type: 'item_updated', item: updated });
    await dbService.updateItem(updated);
  };

  const handleUpdateItemContent = async (item: Item, newContent: string) => {
    const updated: Item = { ...item, content: newContent };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    broadcastSync({ type: 'item_updated', item: updated });
    await dbService.updateItem(updated);
  };

  const handleToggleChecklist = async (item: Item, checkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChecklist = (item.checklist || []).map((c) =>
      c.id === checkId ? { ...c, isCompleted: !c.isCompleted } : c
    );
    const updatedItem: Item = { ...item, checklist: updatedChecklist };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    broadcastSync({ type: 'item_updated', item: updatedItem });
    await dbService.updateItem(updatedItem);
  };

  const handleDeleteChecklistItem = async (item: Item, checkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChecklist = (item.checklist || []).filter((c) => c.id !== checkId);
    const updatedItem: Item = { ...item, checklist: updatedChecklist };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    broadcastSync({ type: 'item_updated', item: updatedItem });
    await dbService.updateItem(updatedItem);
  };

  const handleAddChecklistItem = async (item: Item, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = (newChecklistText[item.id] || '').trim();
    if (!text) return;

    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemId: item.id,
      title: text,
      isCompleted: false,
      position: (item.checklist || []).length,
    };

    const updatedChecklist = [...(item.checklist || []), newItem];
    const updatedItem: Item = { ...item, checklist: updatedChecklist };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
    broadcastSync({ type: 'item_updated', item: updatedItem });
    await dbService.updateItem(updatedItem);
    setNewChecklistText((prev) => ({ ...prev, [item.id]: '' }));
  };

  // Keyboard shortcuts (M to restore Full App, P for Pin, Z for Standby, Esc to exit)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Standby mode navigation
      if (isStandby) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          setIsStandby(false);
        } else if (e.key === '>') {
          e.preventDefault();
          const jokesEnabled = localStorage.getItem('leaf_standby_jokes_enabled') === 'true';
          if (jokesEnabled) {
            setJokeHistory((prev) => {
              const atEnd = jokeHistoryIndex >= prev.length - 1;
              if (atEnd) {
                fetchRandomDevJoke(true).then((joke) => {
                  setJokeHistory((h) => [...h, joke]);
                  setJokeHistoryIndex((i) => i + 1);
                });
                return prev;
              }
              setJokeHistoryIndex((i) => i + 1);
              return prev;
            });
          }
        } else if (e.key === '<') {
          e.preventDefault();
          setJokeHistoryIndex((i) => Math.max(0, i - 1));
        }
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = Boolean(activeEl) && ['INPUT', 'TEXTAREA'].includes(activeEl?.tagName || '');

      if (!isInput) {
        if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setIsStandby(true);
          return;
        }

        if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          await exitMiniMode();
          await closeWindow();
          return;
        }

        if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleAlwaysOnTop();
          return;
        }
      }

      if (e.key === 'Escape') {
        if (addingSection) {
          setAddingSection(null);
          setNewTitle('');
        } else {
          await exitMiniMode();
          await closeWindow();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addingSection, isAlwaysOnTop, isStandby, jokeHistoryIndex]);

  // Remember window position on drag / move
  useEffect(() => {
    let unlistenMove: (() => void) | undefined;
    const setupMoveListener = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        unlistenMove = await win.onMoved(({ payload: position }) => {
          localStorage.setItem('leaf_queue_widget_pos_x', String(position.x));
          localStorage.setItem('leaf_queue_widget_pos_y', String(position.y));
        });
      } catch {
        // Fallback
      }
    };
    setupMoveListener();
    return () => {
      if (unlistenMove) unlistenMove();
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('leaf_theme') as 'light' | 'dark' | null;
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    loadData();

    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'item_updated') {
        setItems((prev) => prev.map((i) => (i.id === msg.item.id ? msg.item : i)));
      } else if (msg.type === 'item_created') {
        setItems((prev) => {
          if (prev.some((i) => i.id === msg.item.id)) return prev;
          return [msg.item, ...prev];
        });
      } else if (msg.type === 'item_deleted') {
        setItems((prev) => prev.filter((i) => i.id !== msg.itemId));
      } else {
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStartAdding = (sectionKey: SectionKey) => {
    setAddingSection(sectionKey);
    setNewTitle('');
    setTimeout(() => inlineInputRef.current?.focus(), 50);
  };

  const handleAddItem = async (sectionKey: SectionKey) => {
    const title = newTitle.trim();
    if (!title) return;

    let priority: Priority = 'none';
    let type: ItemType = 'task';

    if (sectionKey === 'critical') priority = 'critical';
    else if (sectionKey === 'high') priority = 'high';
    else if (sectionKey === 'medium') priority = 'medium';
    else if (sectionKey === 'low') priority = 'low';
    else if (sectionKey === 'ideas') {
      priority = 'none';
      type = 'idea';
    } else if (sectionKey === 'inbox') {
      priority = 'none';
      type = 'task';
    }

    const projects = await dbService.getProjects();
    const defaultProjectId = projects[0]?.id || '';

    const newItem = await dbService.createItem({
      projectId: defaultProjectId,
      title,
      type,
      priority,
      status: 'inbox',
      tags: [],
      checklist: [],
      attachments: [],
    });

    setItems((prev) => [newItem, ...prev]);
    broadcastSync({ type: 'item_created', item: newItem });
    setNewTitle('');
    inlineInputRef.current?.focus();
  };

  const sortQueueList = (list: Item[]) => {
    return [...list].sort((a, b) => {
      const aDone = a.status === 'done';
      const bDone = b.status === 'done';
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const queueItems = items.filter((i) => i.status !== 'archived');
  const criticalItems = sortQueueList(queueItems.filter((i) => i.priority === 'critical'));
  const highItems = sortQueueList(queueItems.filter((i) => i.priority === 'high'));
  const mediumItems = sortQueueList(queueItems.filter((i) => i.priority === 'medium'));
  const lowItems = sortQueueList(queueItems.filter((i) => i.priority === 'low'));
  const ideasItems = sortQueueList(
    queueItems.filter((i) => i.type === 'idea' && i.priority !== 'critical' && i.priority !== 'high')
  );
  const inboxItems = sortQueueList(
    queueItems.filter((i) => i.priority === 'none' && i.type !== 'idea')
  );

  const activeCount = queueItems.filter((i) => i.status !== 'done').length;

  const currentTheme = COLOR_STYLES[colorPreset] || COLOR_STYLES.theme;

  const renderSection = (title: string, sectionKey: SectionKey, list: Item[], dotColor: string) => {
    const sectionActiveCount = list.filter((i) => i.status !== 'done').length;
    const isAdding = addingSection === sectionKey;

    return (
      <div className="space-y-1.5">
        <div className={`flex items-center justify-between text-[11px] font-bold ${currentTheme.text}`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[9.5px] font-semibold ${colorPreset === 'theme' ? 'text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a]' : 'text-current bg-black/10'} px-1.5 py-0 leading-[14px] rounded-full`}>
              {sectionActiveCount > 0 ? `${sectionActiveCount} / ${list.length}` : list.length}
            </span>
            <button
              onClick={() => handleStartAdding(sectionKey)}
              className={`p-0.5 ${currentTheme.subtleBg} rounded ${currentTheme.mutedText} hover:${currentTheme.accent} transition-colors`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Inline Add Input */}
        {isAdding && (
          <div className={`flex items-center gap-1.5 p-1 ${colorPreset === 'theme' ? 'bg-white dark:bg-[#202024] border-[#e5e7eb] dark:border-[#27272a]' : 'bg-black/5 border-black/10'} border rounded-[5px]`}>
            <input
              ref={inlineInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem(sectionKey);
                if (e.key === 'Escape') {
                  setAddingSection(null);
                  setNewTitle('');
                }
              }}
              placeholder={`Add to ${title}...`}
              className={`flex-1 bg-transparent px-1.5 py-0.5 text-xs ${currentTheme.text} placeholder:opacity-50 outline-none`}
            />
            <button
              type="button"
              onClick={() => handleAddItem(sectionKey)}
              className={`px-2 py-0.5 ${
                colorPreset === 'theme'
                  ? 'bg-[#f3f4f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] border border-[#e5e7eb] dark:border-[#3f3f46]'
                  : 'bg-black/10 hover:bg-black/15 border border-black/10'
              } rounded text-[10.5px] font-semibold transition-all`}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingSection(null);
                setNewTitle('');
              }}
              className="p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {list.length === 0 && !isAdding ? (
          <div className={`text-[10.5px] ${currentTheme.mutedText} py-1.5 italic opacity-75`}>
            {MINI_QUEUE_EMPTY_MESSAGES[sectionKey] || 'Queue is clear'}
          </div>
        ) : (
          <div className="space-y-1">
            {list.map((item) => {
              const isDone = item.status === 'done';
              const isExpanded = expandedItemId === item.id;
              const hasChecklist = item.checklist && item.checklist.length > 0;
              const completedChecks = hasChecklist ? item.checklist.filter((c) => c.isCompleted).length : 0;

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col ${
                    colorPreset === 'theme'
                      ? 'bg-white dark:bg-[#202024] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] border-[#e5e7eb] dark:border-[#27272a]'
                      : 'bg-black/5 hover:bg-black/10 border-black/10'
                  } border rounded-[6px] text-xs transition-colors overflow-hidden ${
                    isDone ? 'opacity-55' : ''
                  }`}
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="flex items-center justify-between p-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-1.5">
                      {/* Checkbox button - strictly toggles done state */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleDone(item, e)}
                        className={`p-0.5 rounded transition-colors shrink-0 ${
                          isDone ? 'text-emerald-500' : `${currentTheme.mutedText} hover:text-emerald-500`
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Circle className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded ? (
                        <input
                          type="text"
                          value={item.title}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateItemTitle(item, e.target.value)}
                          className={`flex-1 min-w-0 bg-transparent text-xs font-semibold ${currentTheme.text} outline-none border-b ${
                            colorPreset === 'theme'
                              ? 'border-[#e5e7eb] dark:border-[#3f3f46] focus:border-[#9ca3af]'
                              : 'border-black/20 focus:border-black/40'
                          } px-0.5 py-0.5 select-text`}
                        />
                      ) : (
                        <span
                          className={`truncate text-xs font-medium ${
                            isDone ? `line-through ${currentTheme.mutedText}` : currentTheme.text
                          } select-text`}
                        >
                          {item.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      {hasChecklist && (
                        <span
                          className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${
                            completedChecks === item.checklist.length
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'bg-black/5 dark:bg-white/10 opacity-75'
                          }`}
                        >
                          {completedChecks}/{item.checklist.length}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${currentTheme.mutedText} ${
                          isExpanded ? 'rotate-180 opacity-100' : 'opacity-60 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expandable Details Container */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 pb-3 pt-2 border-t ${
                        colorPreset === 'theme' ? 'border-[#f3f4f6] dark:border-[#27272a]' : 'border-black/10'
                      } space-y-2.5 text-xs animate-in fade-in duration-100 select-text`}
                    >
                      {/* Notes / Description Editable Textarea */}
                      <div className="space-y-1">
                        <textarea
                          value={item.content || ''}
                          onChange={(e) => handleUpdateItemContent(item, e.target.value)}
                          placeholder="Add notes / description..."
                          rows={3}
                          className={`w-full text-xs leading-relaxed p-2 rounded-[6px] border ${
                            colorPreset === 'theme'
                              ? 'bg-[#f9fafb] dark:bg-[#18181b] border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] focus:bg-white dark:focus:bg-[#121214]'
                              : 'bg-black/5 border-black/10 focus:border-black/30 focus:bg-black/[0.08]'
                          } ${currentTheme.text} placeholder:opacity-50 resize-none outline-none custom-scrollbar min-h-[64px] max-h-[140px] overflow-y-auto select-text transition-colors`}
                        />
                      </div>

                      {/* Checklist */}
                      <div className="space-y-1.5">
                        {hasChecklist && (
                          <div className="space-y-1">
                            {item.checklist.map((check) => (
                              <div
                                key={check.id}
                                className={`group/check flex items-center justify-between gap-2 py-1 px-2 rounded-[5px] transition-colors ${currentTheme.subtleBg}`}
                              >
                                <div
                                  onClick={(e) => handleToggleChecklist(item, check.id, e)}
                                  className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                >
                                  <span className={`shrink-0 ${check.isCompleted ? 'text-emerald-500' : 'opacity-60'}`}>
                                    {check.isCompleted ? (
                                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5" />
                                    )}
                                  </span>
                                  <span
                                    className={`text-xs truncate select-text ${
                                      check.isCompleted ? 'line-through opacity-50' : currentTheme.text
                                    }`}
                                  >
                                    {check.title}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteChecklistItem(item, check.id, e)}
                                  className="opacity-0 group-hover/check:opacity-70 hover:opacity-100 p-1 hover:text-rose-500 rounded transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quick Add Subtask Input & Icon Button */}
                        <form
                          onSubmit={(e) => handleAddChecklistItem(item, e)}
                          className="flex items-center gap-1.5 pt-0.5"
                        >
                          <input
                            type="text"
                            value={newChecklistText[item.id] || ''}
                            onChange={(e) =>
                              setNewChecklistText((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            placeholder="Add checklist item..."
                            className={`flex-1 h-[28px] px-2 text-xs border rounded-[4px] ${
                              colorPreset === 'theme'
                                ? 'bg-[#f9fafb] dark:bg-[#1c1c1f] border-[#e5e7eb] dark:border-[#27272a] focus:border-[#9ca3af] dark:focus:border-[#52525b] text-[#111827] dark:text-[#f4f4f5]'
                                : 'bg-black/5 border-black/10 focus:border-black/30 text-current'
                            } placeholder:opacity-50 outline-none select-text transition-colors`}
                          />
                          <button
                            type="submit"
                            className={`w-[28px] h-[28px] flex items-center justify-center rounded-[4px] shrink-0 text-xs transition-colors ${
                              colorPreset === 'theme'
                                ? 'bg-[#f3f4f6] dark:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46]'
                                : 'bg-black/10 hover:bg-black/15 text-current'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5 select-text">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-75 font-mono"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isStandby) {
    return (
      <div
        className={`w-screen h-screen ${currentTheme.bg} border ${currentTheme.border} flex flex-col items-center justify-center p-4 relative select-none animate-in fade-in duration-200`}
        data-tauri-drag-region
      >
        <div className="flex flex-col items-center gap-1.5" data-tauri-drag-region>
          <img
            src="/leaf_logo.png"
            alt="leeflet"
            className="w-10 h-10 object-contain animate-pulse"
            data-tauri-drag-region
          />
          <span className={`font-brand text-2xl font-normal tracking-tight ${currentTheme.text}`} data-tauri-drag-region>
            leeflet
          </span>
        </div>

        {/* Bottom Subtext */}
        <div className="absolute bottom-3 flex flex-col items-center gap-0.5 text-center pointer-events-none max-w-[280px] px-2">
          <span className={`text-[10px] font-mono ${currentTheme.mutedText} tracking-wide leading-tight line-clamp-2`}>
            {standbyJoke || 'taking a coffee break...'}
          </span>
          {!standbyJoke && (
            <span className={`text-[9.5px] font-mono ${currentTheme.mutedText}`}>
              press z to resume
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`w-screen h-screen ${currentTheme.bg} border ${currentTheme.border} ${currentTheme.text} p-3 flex flex-col justify-between overflow-hidden font-sans relative`}>
        {/* Header with Drag Region */}
        <div
          data-tauri-drag-region
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`flex items-center justify-between pb-2.5 border-b ${colorPreset === 'theme' ? 'border-[#f3f4f6] dark:border-[#27272a]' : 'border-black/10'} cursor-move select-none`}
        >
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <img
              src="/leaf_logo.png"
              alt="leaf"
              className="w-4 h-4 object-contain"
              data-tauri-drag-region
            />
            <span
              className={`font-brand text-base tracking-tight ${currentTheme.text}`}
              data-tauri-drag-region
            >
              leeflet
            </span>
            <span
              className={`text-[11px] font-medium opacity-60 ${currentTheme.text} -ml-0.5`}
              data-tauri-drag-region
            >
              queue
            </span>
            <span
              className={`text-[9.5px] font-semibold ${colorPreset === 'theme' ? 'text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a]' : 'text-current bg-black/10'} px-1.5 py-0 leading-[14px] rounded-full`}
              data-tauri-drag-region
            >
              {activeCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Color Palette Menu */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`p-1 rounded transition-colors ${currentTheme.subtleBg} ${currentTheme.mutedText}`}
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Color</p>
              </TooltipContent>
            </Tooltip>

            {/* Options Dropdown Menu with color swatches */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-3 top-10 w-auto bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex items-center gap-1.5">
                  {(Object.keys(COLOR_STYLES) as ColorPreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setColorPreset(preset);
                        localStorage.setItem('leaf_queue_widget_color', preset);
                        setIsMenuOpen(false);
                      }}
                      className={`w-4 h-4 rounded-[3px] border ${COLOR_STYLES[preset].swatch} flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
                        colorPreset === preset ? 'ring-1.5 ring-[#111827] dark:ring-white' : ''
                      }`}
                    >
                      {colorPreset === preset && (
                        <Check className="w-2.5 h-2.5 text-[#111827] dark:text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standby toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsStandby(true)}
                  className={`p-1 rounded transition-colors ${currentTheme.subtleBg} ${currentTheme.mutedText}`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coffee Break (Z)</p>
              </TooltipContent>
            </Tooltip>

            {/* Pin / Always-on-top toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleAlwaysOnTop}
                  className={`p-1 rounded transition-colors ${
                    isAlwaysOnTop
                      ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827]'
                      : `${currentTheme.subtleBg} ${currentTheme.mutedText}`
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${isAlwaysOnTop ? 'fill-current' : ''}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAlwaysOnTop ? 'Unpin' : 'Pin on top (P)'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Restore / Expand to Full App */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={async () => {
                    await exitMiniMode();
                    await closeWindow();
                  }}
                  className={`p-1 ${currentTheme.subtleBg} rounded ${currentTheme.mutedText} transition-colors`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Full app (M)</p>
              </TooltipContent>
            </Tooltip>

            {/* Close Widget */}
            <button
              onClick={closeWindow}
              className={`p-1 ${currentTheme.subtleBg} rounded ${currentTheme.mutedText} transition-colors`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Queue Lists (Hidden scrollbar) */}
        <div className="py-2.5 flex-1 overflow-y-auto space-y-3 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {queueItems.length === 0 ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5 shadow-xs transition-transform hover:scale-105 ${
                  colorPreset === 'theme'
                    ? 'bg-black/5 dark:bg-white/5 border border-[#e5e7eb] dark:border-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]'
                    : 'bg-black/10 text-current'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <p className={`text-xs font-bold ${currentTheme.text}`}>Queue Zero — all caught up</p>
              <p className={`text-[10.5px] ${currentTheme.mutedText} max-w-[200px] mt-1 leading-relaxed`}>
                All caught up. Hit + on any section to add a task.
              </p>
            </div>
          ) : (
            <>
              {renderSection('Critical', 'critical', criticalItems, 'bg-rose-500')}
              {renderSection('High', 'high', highItems, 'bg-orange-500')}
              {renderSection('Medium', 'medium', mediumItems, 'bg-amber-500')}
              {renderSection('Low', 'low', lowItems, 'bg-blue-500')}
              {renderSection('Ideas', 'ideas', ideasItems, 'bg-violet-500')}
              {renderSection('Inbox / Tasks', 'inbox', inboxItems, 'bg-zinc-400')}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
