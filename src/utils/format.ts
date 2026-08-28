import { ItemType, Priority, Status } from '../types';
import { format, isToday, isYesterday } from 'date-fns';

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

export function formatFullDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ITEM_TYPE_CONFIG: Record<
  ItemType,
  { label: string; color: string; bg: string; border: string }
> = {
  idea: {
    label: 'Idea',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  bug: {
    label: 'Bug',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/50',
  },
  task: {
    label: 'Task',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  improvement: {
    label: 'Improvement',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/50',
  },
  research: {
    label: 'Research',
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800/50',
  },
  question: {
    label: 'Question',
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/50',
  },
  note: {
    label: 'Note',
    color: 'text-zinc-700 dark:text-zinc-300',
    bg: 'bg-zinc-100 dark:bg-zinc-800/60',
    border: 'border-zinc-200 dark:border-zinc-700/50',
  },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; dotColor: string; textColor: string }
> = {
  none: { label: 'None', dotColor: 'bg-zinc-300 dark:bg-zinc-600', textColor: 'text-zinc-500 dark:text-zinc-400' },
  low: { label: 'Low', dotColor: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
  medium: { label: 'Medium', dotColor: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
  high: { label: 'High', dotColor: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
  critical: { label: 'Critical', dotColor: 'bg-rose-600', textColor: 'text-rose-600 dark:text-rose-400' },
};

export const STATUS_CONFIG: Record<
  Status,
  { label: string; dotColor: string; textColor: string }
> = {
  inbox: { label: 'Backlog', dotColor: 'bg-purple-500', textColor: 'text-purple-700 dark:text-purple-300' },
  planned: { label: 'Todo', dotColor: 'bg-zinc-400 dark:bg-zinc-500', textColor: 'text-zinc-600 dark:text-zinc-400' },
  in_progress: { label: 'In Progress', dotColor: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-300' },
  done: { label: 'Done', dotColor: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-300' },
  archived: { label: 'Archived', dotColor: 'bg-zinc-300 dark:bg-zinc-600', textColor: 'text-zinc-400 dark:text-zinc-500' },
};
