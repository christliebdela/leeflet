import React from 'react';
import {
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
import { Item, ItemType, ProjectComponent, ChecklistItem } from '../types';
import { useLeafStore } from '../store/useLeafStore';
import { formatDueDateLabel, PRIORITY_CONFIG, STATUS_CONFIG } from '../utils/format';
import { resolveAssignee } from '../utils/team';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { openUrl } from '@tauri-apps/plugin-opener';

const TypeIcon: React.FC<{ type: ItemType }> = ({ type }) => {
  switch (type) {
    case 'bug':
      return <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    case 'idea':
      return <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    case 'improvement':
      return <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    case 'research':
      return <BookOpen className="w-3.5 h-3.5 text-teal-500 shrink-0" />;
    case 'question':
      return <HelpCircle className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
    case 'note':
      return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    default:
      return null;
  }
};

interface ItemCardGridViewProps {
  items: Item[];
  projectComponents: ProjectComponent[];
  activeProjectId?: string;
}

export const ItemCardGridView: React.FC<ItemCardGridViewProps> = ({
  items,
  projectComponents,
  activeProjectId,
}) => {
  const {
    workspace,
    projects,
    selectedItemId,
    setSelectedItemId,
  } = useLeafStore();

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#9ca3af] dark:text-[#71717a]">
        <Layers className="w-8 h-8 stroke-[1.5] mb-2 opacity-50" />
        <span className="text-sm font-semibold">No items to display</span>
        <span className="text-xs opacity-75">Create an item or adjust your filters.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1 pb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;
          const comp = projectComponents.find((c) => c.id === item.componentId);
          const proj = projects.find((p) => p.id === item.projectId);
          const pConfig = PRIORITY_CONFIG[item.priority];
          const sConfig = STATUS_CONFIG[item.status];

          const checklistCompleted = item.checklist?.filter((c: ChecklistItem) => c.isCompleted).length || 0;
          const checklistTotal = item.checklist?.length || 0;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedItemId(isSelected ? null : item.id)}
              className={`group flex flex-col justify-between rounded-[8px] p-3.5 border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f9fafb] dark:bg-[#1f1f23] shadow-sm'
                  : 'border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] hover:shadow-2xs'
              }`}
            >
              {/* Header: Status Pill + Priority Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#4b5563] dark:text-[#a1a1aa]">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sConfig?.dotColor || 'bg-zinc-400'}`} />
                  <span>{sConfig?.label || item.status}</span>
                </span>

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

              {/* Title & Type Icon */}
              <div className="flex items-start gap-1.5 min-w-0 mb-1.5">
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

              {/* Content snippet */}
              {item.content && (
                <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] line-clamp-2 leading-relaxed mb-3">
                  {item.content.replace(/[#*`_~]/g, '')}
                </p>
              )}

              {/* Footer Metadata */}
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#f3f4f6] dark:border-[#27272a]/60 mt-auto">
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
                      title={`GitHub Issue #${item.githubIssueNumber}${item.githubIssueState ? ` (${item.githubIssueState})` : ''}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="opacity-75 shrink-0">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>#{item.githubIssueNumber}</span>
                    </a>
                  )}
                </div>

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
};
