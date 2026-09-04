import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Layers,
  CheckSquare,
  Bug,
  Lightbulb,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Item, Status, ItemType, ProjectComponent, ChecklistItem } from '../types';
import { useLeafStore } from '../store/useLeafStore';
import { formatDueDateLabel, PRIORITY_CONFIG } from '../utils/format';
import { resolveAssignee } from '../utils/team';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { soundService } from '../utils/audio';
import { toast } from '../store/useToastStore';
import { openUrl } from '@tauri-apps/plugin-opener';

const BOARD_COLUMNS: {
  id: Status;
  label: string;
  dotColor: string;
  badgeBg: string;
}[] = [
  {
    id: 'inbox',
    label: 'Backlog',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    id: 'planned',
    label: 'Todo',
    dotColor: 'bg-zinc-400 dark:bg-zinc-500',
    badgeBg: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'done',
    label: 'Done',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
];



const TypeIcon: React.FC<{ type: ItemType }> = ({ type }) => {
  switch (type) {
    case 'bug':
      return <Bug className="w-3 h-3 text-rose-500 shrink-0" />;
    case 'idea':
      return <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />;
    case 'improvement':
      return <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />;
    case 'research':
      return <BookOpen className="w-3 h-3 text-teal-500 shrink-0" />;
    case 'question':
      return <HelpCircle className="w-3 h-3 text-sky-500 shrink-0" />;
    case 'note':
      return <FileText className="w-3 h-3 text-slate-400 shrink-0" />;
    default:
      return null;
  }
};

interface ItemBoardViewProps {
  items: Item[];
  projectComponents: ProjectComponent[];
  activeProjectId?: string;
}

export const ItemBoardView: React.FC<ItemBoardViewProps> = ({
  items,
  projectComponents,
  activeProjectId,
}) => {
  const {
    workspace,
    projects,
    selectedItemId,
    setSelectedItemId,
    updateItem,
    createItem,
  } = useLeafStore();

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);
  const [inlineAddColumn, setInlineAddColumn] = useState<Status | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Ensure draggedItemId and dragOverColumn are always cleaned up globally
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedItemId(null);
      setDragOverColumn(null);
    };

    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, []);

  // Group items by status
  const columnsData = BOARD_COLUMNS.map((col) => {
    const colItems = items.filter((item) => item.status === col.id);
    return {
      ...col,
      items: colItems,
    };
  });

  const handleDragStart = (e: React.DragEvent, item: Item) => {
    setDraggedItemId(item.id);
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn(null);
  };

  const handleColumnDrop = async (e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();
    setDragOverColumn(null);
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    setDraggedItemId(null);
    if (!itemId) return;

    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === targetStatus) return;

    const isMovingToDone = targetStatus === 'done';
    const updated: Item = {
      ...item,
      status: targetStatus,
      completedAt: isMovingToDone ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    if (isMovingToDone) {
      soundService.playCompletionChime();
    }

    await updateItem(updated);
    toast.success(`Moved to ${BOARD_COLUMNS.find((c) => c.id === targetStatus)?.label || targetStatus}`);
  };

  const handleQuickAddSubmit = async (status: Status) => {
    const title = inlineTitle.trim();
    if (!title) {
      setInlineAddColumn(null);
      return;
    }

    const targetProjectId = activeProjectId || projects[0]?.id;
    if (!targetProjectId) {
      toast.error('Please create a project first');
      return;
    }

    try {
      await createItem({
        title,
        projectId: targetProjectId,
        status,
        type: 'task',
        priority: 'none',
      });
      setInlineTitle('');
      setInlineAddColumn(null);
    } catch {
      toast.error('Failed to create item');
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar flex gap-3 px-1 pt-1 pb-2.5 select-none">
      {columnsData.map((col) => {
        const isTarget = dragOverColumn === col.id;
        const isInlineAdding = inlineAddColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleColumnDragOver(e, col.id)}
            onDragLeave={handleColumnDragLeave}
            onDrop={(e) => handleColumnDrop(e, col.id)}
            className={`flex-1 min-w-[320px] flex flex-col h-full rounded-[8px] border transition-all duration-150 ${
              isTarget
                ? 'bg-[#111827]/5 dark:bg-white/5 border-[#111827]/30 dark:border-white/30 shadow-sm ring-1 ring-black/10 dark:ring-white/10'
                : 'bg-[#f4f5f6]/70 dark:bg-[#141417]/80 border-[#e5e7eb]/80 dark:border-[#27272a]'
            }`}
          >
            {/* Column Header */}
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-[#e5e7eb]/60 dark:border-[#27272a]/80 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dotColor}`} />
                <span className="font-bold text-xs text-[#111827] dark:text-[#f4f4f5] tracking-tight truncate">
                  {col.label}
                </span>
                <span className="px-1.5 py-0.2 text-[10.5px] rounded-full font-mono font-medium bg-[#e5e7eb]/80 dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] leading-tight">
                  {col.items.length}
                </span>
              </div>

              {/* Quick Add Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddColumn(isInlineAdding ? null : col.id);
                      setInlineTitle('');
                      setTimeout(() => inlineInputRef.current?.focus(), 50);
                    }}
                    className="p-1 rounded-[4px] hover:bg-[#e5e7eb] dark:hover:bg-[#27272a] text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Add task to {col.label}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Inline Quick Add Card */}
            {isInlineAdding && (
              <div className="p-2 border-b border-[#e5e7eb]/60 dark:border-[#27272a]/80 bg-white dark:bg-[#1c1c20] shadow-2xs">
                <input
                  ref={inlineInputRef}
                  type="text"
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAddSubmit(col.id);
                    if (e.key === 'Escape') setInlineAddColumn(null);
                  }}
                  placeholder="Task title... (Enter to save)"
                  className="w-full text-xs px-2 py-1.5 rounded-[5px] border border-[#d1d5db] dark:border-[#3f3f46] bg-transparent text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-end gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setInlineAddColumn(null)}
                    className="px-2 py-1 text-[11px] rounded-[4px] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddSubmit(col.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-[4px] bg-[#111827] dark:bg-white text-white dark:text-[#111827] cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Column Cards Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-0">
              {col.items.length === 0 && !isInlineAdding && (
                <div className="h-28 rounded-[6px] border border-dashed border-[#e5e7eb] dark:border-[#27272a] flex flex-col items-center justify-center text-center p-3 text-[#9ca3af] dark:text-[#71717a]">
                  <span className="text-xs">No tasks</span>
                  <span className="text-[11px] opacity-75">Drop tasks here</span>
                </div>
              )}

              {col.items.map((item) => {
                const isSelected = selectedItemId === item.id;
                const isBeingDragged = draggedItemId === item.id;
                const comp = projectComponents.find((c) => c.id === item.componentId);
                const proj = projects.find((p) => p.id === item.projectId);
                const pConfig = PRIORITY_CONFIG[item.priority];

                // Checklist count
                const checklistCompleted = item.checklist?.filter((c: ChecklistItem) => c.isCompleted).length || 0;
                const checklistTotal = item.checklist?.length || 0;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                    className={`group relative rounded-[8px] p-3 border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f9fafb] dark:bg-[#1f1f23] shadow-xs'
                        : 'border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] hover:shadow-2xs'
                    } ${isBeingDragged ? 'opacity-30 scale-[0.98]' : ''}`}
                  >
                    {/* Top Row: Title + Priority Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <TypeIcon type={item.type} />
                        <h4
                          className={`text-xs font-semibold tracking-tight line-clamp-2 leading-snug ${
                            item.status === 'done'
                              ? 'line-through text-[#6b7280] dark:text-[#a1a1aa]'
                              : 'text-[#111827] dark:text-[#f4f4f5]'
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>

                      {/* Priority Tag (matching Card view) */}
                      {item.priority !== 'none' && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 leading-none ${
                            item.priority === 'critical'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                              : item.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                              : item.priority === 'medium'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/25'
                          }`}
                        >
                          {pConfig.label}
                        </span>
                      )}
                    </div>

                    {/* Middle: Description preview / snippet */}
                    {item.content && (
                      <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] line-clamp-2 mt-1.5 leading-relaxed">
                        {item.content.replace(/[#*`_~]/g, '')}
                      </p>
                    )}

                    {/* Bottom Metadata Bar */}
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]/60">
                      {/* Left: Module Tag or Project Badge */}
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        {comp ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 truncate max-w-[110px] ${
                              !comp.color
                                ? 'bg-[#f3f4f6] dark:bg-[#202024] text-[#4b5563] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]'
                                : ''
                            }`}
                            style={
                              comp.color
                                ? {
                                    backgroundColor: `${comp.color}15`,
                                    color: comp.color,
                                    border: `1px solid ${comp.color}35`,
                                  }
                                : undefined
                            }
                          >
                            <Layers className="w-2.5 h-2.5 shrink-0 opacity-75" />
                            <span className="truncate">{comp.name}</span>
                          </span>
                        ) : !activeProjectId && proj ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#6b7280] dark:text-[#a1a1aa] font-medium bg-[#f3f4f6] dark:bg-[#202024] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a] truncate max-w-[100px]">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: proj.color || '#9ca3af' }}
                            />
                            <span className="truncate">{proj.name}</span>
                          </span>
                        ) : null}

                        {/* Checklist Counter */}
                        {checklistTotal > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6b7280] dark:text-[#71717a] bg-[#f4f5f6] dark:bg-[#202024] px-1 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a] shrink-0">
                            <CheckSquare className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                            <span>
                              {checklistCompleted}/{checklistTotal}
                            </span>
                          </span>
                        )}

                        {/* GitHub Issue Link Badge */}
                        {item.githubIssueNumber && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={item.githubIssueUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.githubIssueUrl) {
                                    try {
                                      openUrl(item.githubIssueUrl);
                                    } catch {
                                      window.open(item.githubIssueUrl, '_blank');
                                    }
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white bg-[#f4f5f6] dark:bg-[#202024] hover:bg-[#e5e7eb] dark:hover:bg-[#27272a] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a] shrink-0 transition-colors cursor-pointer"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-75 shrink-0">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                                <span>#{item.githubIssueNumber}</span>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              GitHub Issue #{item.githubIssueNumber}{item.githubIssueState ? ` (${item.githubIssueState})` : ''}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Right: Due Date & Assignee */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.dueAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#6b7280] dark:text-[#a1a1aa] font-medium bg-[#f4f5f6] dark:bg-[#202024] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a]">
                            <Calendar className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                            <span>{formatDueDateLabel(item.dueAt)}</span>
                          </span>
                        )}

                        {item.assigneeId && (() => {
                          const assignee = resolveAssignee(item.assigneeId, workspace?.id);
                          if (!assignee) return null;
                          return (
                            <Tooltip delayDuration={150}>
                              <TooltipTrigger asChild>
                                <span
                                  className="w-4 h-4 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden shadow-2xs flex items-center justify-center cursor-default"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <img
                                    src={assignee.avatarUrl}
                                    alt={assignee.name}
                                    className="w-full h-full object-cover"
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[11px] font-medium py-1 px-2">
                                <span>{assignee.name}</span>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
