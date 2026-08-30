import React, { useState, useRef, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { dbService } from '../services/db';
import { soundService } from '../utils/audio';
import {
  Folder,
  Upload,
  Keyboard,
  Sliders,
  Database,
  Coffee,
  Sun,
  Moon,
  Copy,
  Check,
  Search,
  Download,
  AlertCircle,
  RefreshCw,
  Volume2,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  CheckSquare,
  Bug,
  Lightbulb,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Item, Attachment, ItemType, Priority, Project } from '../types';
import { formatFileSize, ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../utils/format';
import { toast } from '../store/useToastStore';

type SettingsTab = 'preferences' | 'shortcuts' | 'data';

interface ShortcutItem {
  id: string;
  label: string;
  category: 'Creation & Global' | 'Views & Projects' | 'Item Actions';
  keys: string[];
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  { id: '1', label: 'New Item (In-App)', category: 'Creation & Global', keys: ['N', 'Ctrl + N'] },
  { id: '2', label: 'Quick Capture (Desktop Floating Panel)', category: 'Creation & Global', keys: ['Alt + L', 'Alt + N'] },
  { id: '3', label: 'Search Workspace', category: 'Creation & Global', keys: ['Ctrl + K', '/'] },
  { id: '4', label: 'Coffee Break / Standby', category: 'Creation & Global', keys: ['Z'] },
  { id: '4a', label: 'Next / Previous Joke (Standby)', category: 'Creation & Global', keys: ['> / ArrowRight', '< / ArrowLeft'] },
  { id: '5', label: 'Go to Settings', category: 'Creation & Global', keys: ['S', 'Ctrl + ,'] },
  { id: '6', label: 'Close Detail Pane / Modal', category: 'Creation & Global', keys: ['Esc'] },
  { id: '7', label: 'Go to Backlog', category: 'Views & Projects', keys: ['Ctrl + I'] },
  { id: '8', label: 'Go to My Queue', category: 'Views & Projects', keys: ['Ctrl + Q'] },
  { id: '10', label: 'Switch Projects (1-9)', category: 'Views & Projects', keys: ['1 - 9'] },
  { id: '11', label: 'Mini Mode (Queue Card)', category: 'Views & Projects', keys: ['M'] },
  { id: '12', label: 'Pin on Top (Mini Mode)', category: 'Views & Projects', keys: ['P'] },
  { id: '13', label: 'Delete Selected Card', category: 'Item Actions', keys: ['Del / Backspace'] },
  { id: '14', label: 'Add Checklist Item', category: 'Item Actions', keys: ['Enter'] },
];

const TYPE_ICONS: Record<ItemType, React.FC<{ className?: string }>> = {
  task: CheckSquare,
  bug: Bug,
  idea: Lightbulb,
  improvement: Sparkles,
  research: BookOpen,
  question: HelpCircle,
  note: FileText,
};

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-label={ariaLabel}
    aria-checked={checked}
    onClick={onChange}
    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 p-0.5 cursor-pointer border ${
      checked
        ? 'bg-[#111827] dark:bg-white border-[#111827] dark:border-white'
        : 'bg-[#e5e7eb] dark:bg-[#27272a] border-[#d1d5db] dark:border-[#3f3f46]'
    }`}
  >
    <span
      className={`block w-3.5 h-3.5 rounded-full transition-transform transform shadow-xs ${
        checked
          ? 'translate-x-4 bg-white dark:bg-[#111827]'
          : 'translate-x-0 bg-white dark:bg-[#a1a1aa]'
      }`}
    />
  </button>
);

export const SettingsView: React.FC = () => {
  const {
    workspace,
    projects,
    items,
    theme,
    setTheme,
    standbyJokesEnabled,
    setStandbyJokesEnabled,
    initialize,
  } = useLeafStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('preferences');
  const [copiedPath, setCopiedPath] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showEmptyExportModal, setShowEmptyExportModal] = useState(false);

  // Workflow & Behavior preferences stored in localStorage
  const [defaultProject, setDefaultProject] = useState(() => localStorage.getItem('leaf_pref_default_project') || '');
  const [defaultPriority, setDefaultPriority] = useState<Priority>(() => (localStorage.getItem('leaf_pref_default_priority') as Priority) || 'none');
  const [defaultType, setDefaultType] = useState<ItemType>(() => (localStorage.getItem('leaf_pref_default_type') as ItemType) || 'task');
  const [completionSound, setCompletionSound] = useState(() => localStorage.getItem('leaf_pref_completion_sound') !== 'false');
  const [preserveDrafts, setPreserveDrafts] = useState(() => localStorage.getItem('leaf_pref_preserve_drafts') !== 'false');
  const [autoCloseCapture, setAutoCloseCapture] = useState(() => localStorage.getItem('leaf_pref_auto_close_capture') !== 'false');
  const [confirmDelete, setConfirmDelete] = useState(() => localStorage.getItem('leaf_pref_confirm_delete') !== 'false');

  // Custom Dropdown Open States
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(e.target as Node)) {
        setIsPriorityDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!workspace) return null;

  const handleSetPref = (key: string, val: string, setter: (v: any) => void) => {
    setter(val);
    localStorage.setItem(key, val);
    toast.success('Preference updated');
  };

  const handleTogglePref = (key: string, current: boolean, setter: (v: boolean) => void) => {
    const next = !current;
    setter(next);
    localStorage.setItem(key, String(next));
    toast.success('Preference updated');
  };

  const handleToggleSound = () => {
    const next = !completionSound;
    setCompletionSound(next);
    localStorage.setItem('leaf_pref_completion_sound', String(next));
    if (next) {
      soundService.playCompletionChime();
    }
    toast.success(next ? 'Completion chime enabled' : 'Completion chime muted');
  };

  const selectedProjectObj = projects.find((p) => p.id === defaultProject);
  const SelectedTypeIcon = TYPE_ICONS[defaultType] || CheckSquare;

  const totalAttachments = items.reduce(
    (acc: number, i: Item) => acc + (i.attachments?.length || 0),
    0
  );
  const totalAttachmentsSize = items.reduce(
    (acc: number, i: Item) =>
      acc +
      (i.attachments?.reduce(
        (a: number, att: Attachment) => a + (att.fileSize || 0),
        0
      ) || 0),
    0
  );

  const handleExport = async () => {
    if (items.length === 0) {
      setShowEmptyExportModal(true);
      return;
    }

    try {
      setIsExporting(true);
      const jsonStr = await dbService.exportWorkspaceData();
      const defaultFilename = `leeflet-backup-${new Date().toISOString().slice(0, 10)}.json`;

      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { invoke } = await import('@tauri-apps/api/core');
        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [{ name: 'JSON Archive', extensions: ['json'] }],
        });

        if (filePath) {
          await invoke('write_file_to_path', { path: filePath, content: jsonStr });
          toast.success('Workspace backup exported successfully');
          return;
        } else {
          return;
        }
      } catch (tauriError) {
        console.warn('Native dialog failed, falling back to browser download:', tauriError);
      }

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Workspace backup exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export workspace data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportNative = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { invoke } = await import('@tauri-apps/api/core');
      const selected = await open({
        multiple: false,
        filters: [{ name: 'JSON Archive', extensions: ['json'] }],
      });

      if (selected && typeof selected === 'string') {
        const text = await invoke<string>('read_file_from_path', { path: selected });
        await dbService.importWorkspaceData(text);
        toast.success('Workspace restored successfully');
        await initialize('restoring workspace backup...');
        return;
      }
    } catch (err) {
      console.warn('Native open dialog failed, falling back to file input:', err);
      fileInputRef.current?.click();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await dbService.importWorkspaceData(text);
        toast.success('Workspace restored successfully');
        await initialize('restoring workspace backup...');
      } catch {
        toast.error('Failed to import workspace. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(workspace.path);
    setCopiedPath(true);
    toast.info('Workspace path copied to clipboard');
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleOpenFolder = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_in_file_manager', { path: workspace.path });
    } catch {
      try {
        const { openPath } = await import('@tauri-apps/plugin-opener');
        await openPath(workspace.path);
      } catch {
        toast.info(`Workspace path: ${workspace.path}`);
      }
    }
  };

  const filteredShortcuts = SHORTCUTS_DATA.filter(
    (s) =>
      s.label.toLowerCase().includes(shortcutFilter.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(shortcutFilter.toLowerCase()))
  );

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 custom-scrollbar">
      <div className="max-w-[760px] mx-auto space-y-6 pb-16">
        {/* Settings Header with Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e7eb] dark:border-[#27272a]">
          <div>
            <h1 className="text-sm font-bold text-[#111827] dark:text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
              Configure your workspace, default behavior, and hotkeys
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center p-0.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all ${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all ${
                activeTab === 'shortcuts'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all ${
                activeTab === 'data'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data & Backup</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* 1. Appearance Section */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Appearance
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                {/* Theme Mode */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Interface Theme
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Switch between clean light and sleek dark mode
                    </div>
                  </div>

                  <div className="flex items-center p-0.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024]">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[5px] transition-colors ${
                        theme === 'light'
                          ? 'bg-white text-[#111827] shadow-2xs font-semibold'
                          : 'text-[#6b7280] hover:text-[#111827]'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[5px] transition-colors ${
                        theme === 'dark'
                          ? 'bg-[#27272a] text-white shadow-2xs font-semibold'
                          : 'text-[#a1a1aa] hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Task & Workflow Defaults (Linear-Grade Dropdowns) */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Task & Workflow Defaults
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-visible text-xs">
                {/* Default Project Dropdown */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Default Project
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Pre-select project for newly captured tasks
                    </div>
                  </div>

                  <div className="relative" ref={projectDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProjectDropdownOpen(!isProjectDropdownOpen);
                        setIsPriorityDropdownOpen(false);
                        setIsTypeDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] px-3 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0 text-xs font-medium text-[#111827] dark:text-[#f4f4f5]"
                    >
                      <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                      <span className="max-w-[140px] truncate">
                        {selectedProjectObj?.name || 'No Project (Unassigned)'}
                      </span>
                      <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
                    </button>

                    {isProjectDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-modal p-1 z-50 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                        <button
                          type="button"
                          onClick={() => {
                            handleSetPref('leaf_pref_default_project', '', setDefaultProject);
                            setIsProjectDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[5px] text-xs flex items-center justify-between transition-colors ${
                            !defaultProject
                              ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                              : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Folder className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            <span className="truncate">No Project (Unassigned)</span>
                          </div>
                          {!defaultProject && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>

                        {projects.map((p: Project) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleSetPref('leaf_pref_default_project', p.id, setDefaultProject);
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-[5px] text-xs flex items-center justify-between transition-colors ${
                              defaultProject === p.id
                                ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                                : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Folder className="w-3.5 h-3.5 shrink-0 opacity-60" />
                              <span className="truncate">{p.name}</span>
                            </div>
                            {defaultProject === p.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Default Item Priority Dropdown */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Default Priority
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Initial priority level assigned to new items
                    </div>
                  </div>

                  <div className="relative" ref={priorityDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
                        setIsProjectDropdownOpen(false);
                        setIsTypeDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] px-3 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0 text-xs font-medium text-[#111827] dark:text-[#f4f4f5]"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_CONFIG[defaultPriority]?.dotColor}`} />
                      <span className="capitalize">{PRIORITY_CONFIG[defaultPriority]?.label || defaultPriority}</span>
                      <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
                    </button>

                    {isPriorityDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-modal p-1 z-50 space-y-0.5">
                        {(['none', 'low', 'medium', 'high', 'critical'] as Priority[]).map((p) => {
                          const pCfg = PRIORITY_CONFIG[p];
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                handleSetPref('leaf_pref_default_priority', p, setDefaultPriority);
                                setIsPriorityDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-[5px] text-xs capitalize flex items-center justify-between transition-colors ${
                                defaultPriority === p
                                  ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                                  : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${pCfg.dotColor}`} />
                                <span>{pCfg.label}</span>
                              </div>
                              {defaultPriority === p && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Default Item Type Dropdown */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Default Item Type
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Default classification for items created via Quick Capture
                    </div>
                  </div>

                  <div className="relative" ref={typeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTypeDropdownOpen(!isTypeDropdownOpen);
                        setIsProjectDropdownOpen(false);
                        setIsPriorityDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] px-3 py-1.5 hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors shrink-0 text-xs font-medium text-[#111827] dark:text-[#f4f4f5]"
                    >
                      <SelectedTypeIcon className="w-3.5 h-3.5 shrink-0 text-[#6b7280] dark:text-[#a1a1aa]" />
                      <span className="capitalize">{ITEM_TYPE_CONFIG[defaultType]?.label || defaultType}</span>
                      <ChevronDown className="w-3 h-3 opacity-60 shrink-0 ml-0.5" />
                    </button>

                    {isTypeDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-modal p-1 z-50 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                        {(['task', 'bug', 'idea', 'improvement', 'research', 'question', 'note'] as ItemType[]).map((t) => {
                          const ItemIcon = TYPE_ICONS[t];
                          const cfg = ITEM_TYPE_CONFIG[t];
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                handleSetPref('leaf_pref_default_type', t, setDefaultType);
                                setIsTypeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-[5px] text-xs capitalize flex items-center justify-between transition-colors ${
                                defaultType === t
                                  ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                                  : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                <span>{cfg.label}</span>
                              </div>
                              {defaultType === t && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Quick Capture Behavior */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Quick Capture
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                {/* Hotkey display */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      System-Wide Shortcut
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Summon the floating capture bar from any background app
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[11px] text-[#374151] dark:text-[#d4d4d8]">
                      Alt + L
                    </kbd>
                    <span className="text-[#9ca3af] text-[11px]">or</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[11px] text-[#374151] dark:text-[#d4d4d8]">
                      Alt + N
                    </kbd>
                  </div>
                </div>

                {/* Close on Save */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Auto-Dismiss on Save
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Close the capture panel automatically after submitting an item
                    </div>
                  </div>
                  <ToggleSwitch
                    ariaLabel="Auto-dismiss on save"
                    checked={autoCloseCapture}
                    onChange={() => handleTogglePref('leaf_pref_auto_close_capture', autoCloseCapture, setAutoCloseCapture)}
                  />
                </div>

                {/* Preserve Drafts */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="flex items-center gap-2.5">
                    <Bookmark className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <div>
                      <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                        Retain Unsaved Drafts
                      </div>
                      <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                        Preserve typed text in quick capture if dismissed without saving
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch
                    ariaLabel="Retain unsaved drafts"
                    checked={preserveDrafts}
                    onChange={() => handleTogglePref('leaf_pref_preserve_drafts', preserveDrafts, setPreserveDrafts)}
                  />
                </div>
              </div>
            </div>

            {/* 4. Audio & Interactions */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Audio & Interactions
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                {/* Completion Chimes with Test button */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <div>
                      <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5] flex items-center gap-2">
                        <span>Task Completion Chime</span>
                        <button
                          type="button"
                          onClick={() => soundService.playCompletionChime()}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white hover:border-[#d1d5db] dark:hover:border-[#52525b] transition-colors"
                        >
                          Play preview
                        </button>
                      </div>
                      <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                        Play subtle audio confirmation when checking off a task or checklist item
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch
                    ariaLabel="Task completion chime"
                    checked={completionSound}
                    onChange={handleToggleSound}
                  />
                </div>

                {/* Instant Delete with Undo */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <div>
                      <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                        Always Confirm Item Deletion
                      </div>
                      <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                        Prompt before removing items instead of using instant toast deletion
                      </div>
                    </div>
                  </div>
                  <ToggleSwitch
                    ariaLabel="Always confirm item deletion"
                    checked={confirmDelete}
                    onChange={() => handleTogglePref('leaf_pref_confirm_delete', confirmDelete, setConfirmDelete)}
                  />
                </div>
              </div>
            </div>

            {/* 5. Standby & Relaxation */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Coffee Break & Standby
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="flex items-center gap-2.5">
                    <Coffee className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <div>
                      <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                        Developer Humor on Standby
                      </div>
                      <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                        Display curated programming jokes when entering coffee break mode (<kbd className="font-mono">Z</kbd>)
                      </div>
                    </div>
                  </div>

                  <ToggleSwitch
                    ariaLabel="Developer humor on standby"
                    checked={standbyJokesEnabled}
                    onChange={() => setStandbyJokesEnabled(!standbyJokesEnabled)}
                  />
                </div>
              </div>
            </div>

            {/* 6. Workspace Location */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Workspace Location
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                    <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Local Data Folder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPath}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[5px] transition-colors"
                    >
                      {copiedPath ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPath ? 'Copied' : 'Copy Path'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenFolder}
                      className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-[#111827] dark:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      Open in Explorer
                    </button>
                  </div>
                </div>

                <div className="font-mono text-[11px] text-[#6b7280] dark:text-[#a1a1aa] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] px-3 py-1.5 rounded-[5px] break-all select-all">
                  {workspace.path}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHORTCUTS */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={shortcutFilter}
                onChange={(e) => setShortcutFilter(e.target.value)}
                placeholder="Search shortcuts..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
              />
            </div>

            <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
              {filteredShortcuts.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[#374151] dark:text-[#d4d4d8] font-medium">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    {s.keys.map((k, idx) => (
                      <kbd
                        key={idx}
                        className="px-2 py-0.5 rounded bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] font-mono text-[10.5px] text-[#4b5563] dark:text-[#a1a1aa]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DATA & BACKUP */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            {/* Storage Usage Stats */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Database Stats
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">Total Items</span>
                  <span className="font-semibold text-[#111827] dark:text-white font-mono">{items.length}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">Attachments Stored</span>
                  <span className="font-semibold text-[#111827] dark:text-white font-mono">{totalAttachments}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">Local Storage Size</span>
                  <span className="font-semibold text-[#111827] dark:text-white font-mono">{formatFileSize(totalAttachmentsSize)}</span>
                </div>
              </div>
            </div>

            {/* Export & Import Backup */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Backup & Restore
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Export Workspace Archive
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Download complete JSON backup containing all projects, tasks, and notes
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Export JSON</span>
                  </button>
                </div>

                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Restore from Backup
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Import a previously exported JSON backup file
                    </div>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleImportNative}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-[#111827] dark:text-white rounded-[6px] text-xs font-medium hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-all shadow-2xs shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import JSON</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty Export Warning Modal */}
      {showEmptyExportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEmptyExportModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] shadow-modal w-full max-w-sm p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-[#111827] dark:text-white">
              Workspace is Empty
            </h3>
            <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
              There are no tasks or items to export yet. Add a few items before creating a backup.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowEmptyExportModal(false)}
                className="w-full py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
