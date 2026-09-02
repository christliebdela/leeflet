import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLeafStore } from '../store/useLeafStore';
import { dbService } from '../services/db';
import {
  X,
  Folder,
  Upload,
  RotateCcw,
  Keyboard,
  Command,
  LayoutGrid,
  Edit3,
  Check,
  Copy,
  Sliders,
  Database,
  User,
  Sparkles,
  Globe,
  AlertCircle,
  Plus,
  Coffee,
} from 'lucide-react';
import { Item, Attachment } from '../types';
import { formatFileSize } from '../utils/format';
import { toast } from '../store/useToastStore';
import { useUpdaterStore } from '../store/useUpdaterStore';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type Tab = 'preferences' | 'shortcuts';

interface ShortcutItem {
  id: string;
  label: string;
  category: 'Creation & Global' | 'Views & Projects' | 'Item Actions';
  keys: string[];
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  { id: '1', label: 'New Item (In-App)', category: 'Creation & Global', keys: ['N', 'C', 'Ctrl + N'] },
  { id: '2', label: 'Global Quick Capture', category: 'Creation & Global', keys: ['Alt + L'] },
  { id: '3', label: 'Search Workspace', category: 'Creation & Global', keys: ['Ctrl + K', '/'] },
  { id: '4', label: 'Coffee Break / Standby', category: 'Creation & Global', keys: ['Z'] },
  { id: '4a', label: 'Next / Previous Joke (Standby)', category: 'Creation & Global', keys: ['ArrowRight', 'ArrowLeft'] },
  { id: '5', label: 'Settings & Preferences', category: 'Creation & Global', keys: ['Ctrl + ,'] },
  { id: '6', label: 'Close Sheet / Modal', category: 'Creation & Global', keys: ['Esc'] },
  { id: '7', label: 'Go to Backlog (Inbox)', category: 'Views & Projects', keys: ['Ctrl + I'] },
  { id: '8', label: 'Go to My Queue', category: 'Views & Projects', keys: ['Ctrl + Q'] },
  { id: '10', label: 'Switch Projects (1-9)', category: 'Views & Projects', keys: ['1 - 9'] },
  { id: '11', label: 'Mini Mode (Queue Widget)', category: 'Views & Projects', keys: ['M'] },
  { id: '12', label: 'Pin on Top (Mini Mode)', category: 'Views & Projects', keys: ['P'] },
  { id: '13', label: 'Delete Selected Card', category: 'Item Actions', keys: ['Delete'] },
  { id: '14', label: 'Add Checklist Item', category: 'Item Actions', keys: ['Enter'] },
];

export const WorkspaceModal: React.FC = () => {
  const {
    workspace,
    items,
    isWorkspaceModalOpen,
    setWorkspaceModalOpen,
    setOnboardingOpen,
    setQuickCaptureOpen,
    standbyJokesEnabled,
    setStandbyJokesEnabled,
    initialize,
  } = useLeafStore();

  const currentVersion = useUpdaterStore((state) => state.currentVersion);

  const [activeTab, setActiveTab] = useState<Tab>('preferences');
  const [copiedPath, setCopiedPath] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');
  const [showEmptyExportModal, setShowEmptyExportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global window Escape key listener
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEmptyExportModal) {
          setShowEmptyExportModal(false);
          return;
        }
        if (isWorkspaceModalOpen) {
          setWorkspaceModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isWorkspaceModalOpen, setWorkspaceModalOpen, showEmptyExportModal]);

  if (!workspace) return null;

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

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (items.length === 0) {
      setShowEmptyExportModal(true);
      return;
    }

    try {
      setIsExporting(true);
      const jsonStr = await dbService.exportWorkspaceData();
      const defaultFilename = `leeflet-backup-${new Date().toISOString().slice(0, 10)}.json`;

      // 1. Native Tauri Save File Dialog + Direct Rust File Write
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { invoke } = await import('@tauri-apps/api/core');
        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [{ name: 'JSON Archive', extensions: ['json'] }],
        });

        if (filePath) {
          await invoke('write_file_to_path', { path: filePath, content: jsonStr });
          toast.success('Workspace backup exported successfully!');
          return;
        } else {
          // User clicked Cancel
          return;
        }
      } catch (tauriError) {
        console.warn('Native dialog/invoke failed or running in browser:', tauriError);
      }

      // 2. Fallback for browser environment
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Workspace backup exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export workspace data.');
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
        toast.success('Workspace restored successfully!');
        setWorkspaceModalOpen(false);
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
        toast.success('Workspace restored successfully!');
        setWorkspaceModalOpen(false);
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

  const openExternalUrl = async (url: string) => {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  const filteredShortcuts = SHORTCUTS_DATA.filter(
    (s) =>
      s.label.toLowerCase().includes(shortcutFilter.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(shortcutFilter.toLowerCase()))
  );

  return (
    <div
      className={`transition-all duration-300 ease-out overflow-hidden flex shrink-0 ${
        isWorkspaceModalOpen ? 'w-[360px] pl-2 pr-3 pb-3 pt-0' : 'w-0 pl-0 pr-0 pb-0 pt-0 pointer-events-none'
      }`}
    >
      {/* Right Slide-Over Sheet (matching ItemDetailPane split layout) */}
      <aside
        className={`w-[352px] h-full bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-modal flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out select-none ${
          isWorkspaceModalOpen ? 'translate-x-0' : 'translate-x-[400px]'
        }`}
      >
        {/* Top Header */}
        <div className="p-3 border-b border-[#f3f4f6] dark:border-[#27272a] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[5px] bg-[#f4f5f6] dark:bg-[#27272a] flex items-center justify-center">
                <img
                  src="/leaf_logo.png"
                  alt="Leeflet"
                  className="w-3.5 h-3.5 object-contain invert dark:invert-0"
                />
              </div>
              <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                Settings
              </h2>
            </div>

            <button
              onClick={() => setWorkspaceModalOpen(false)}
              className="p-1 rounded-[5px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Modern Tab Navigation */}
          <div className="flex border-b border-[#f3f4f6] dark:border-[#27272a] -mx-3 px-3 -mb-3 pt-0.5 gap-3">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-2 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'preferences'
                  ? 'border-[#111827] text-[#111827] dark:border-white dark:text-white'
                  : 'border-transparent text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`pb-2 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'shortcuts'
                  ? 'border-[#111827] text-[#111827] dark:border-white dark:text-white'
                  : 'border-transparent text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>
          </div>
        </div>

        {/* Sheet Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* TAB 1: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Filter */}
              <input
                type="text"
                value={shortcutFilter}
                onChange={(e) => setShortcutFilter(e.target.value)}
                placeholder="Search shortcuts..."
                className="w-full px-3 py-1.5 bg-[#f4f5f6] dark:bg-[#202024] text-xs font-medium text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] dark:placeholder-[#71717a] rounded-[6px] border border-[#e5e7eb] dark:border-[#2e2e32] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
              />

              {/* Group 1: Capture & Navigation */}
              <div className="p-3 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[8px] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  <Command className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Creation & Global</span>
                </div>
                <div className="space-y-1 text-xs">
                  {filteredShortcuts
                    .filter((s) => s.category === 'Creation & Global')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a] last:border-b-0"
                      >
                        <span className="text-[#6b7280] dark:text-[#a1a1aa] min-w-0">{item.label}</span>
                        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-[10px] text-[#9ca3af] shrink-0">or</span>}
                              <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#111827] dark:text-white whitespace-nowrap shrink-0 inline-block">
                                {k}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Group 2: Views */}
              <div className="p-3 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[8px] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Views & Projects</span>
                </div>
                <div className="space-y-1 text-xs">
                  {filteredShortcuts
                    .filter((s) => s.category === 'Views & Projects')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a] last:border-b-0"
                      >
                        <span className="text-[#6b7280] dark:text-[#a1a1aa] min-w-0">{item.label}</span>
                        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-[10px] text-[#9ca3af] shrink-0">or</span>}
                              <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#111827] dark:text-white whitespace-nowrap shrink-0 inline-block">
                                {k}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Group 3: Editor & Items */}
              <div className="p-3 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[8px] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  <Edit3 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Item Actions</span>
                </div>
                <div className="space-y-1 text-xs">
                  {filteredShortcuts
                    .filter((s) => s.category === 'Item Actions')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a] last:border-b-0"
                      >
                        <span className="text-[#6b7280] dark:text-[#a1a1aa] min-w-0">{item.label}</span>
                        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-[10px] text-[#9ca3af] shrink-0">or</span>}
                              <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#111827] dark:text-white whitespace-nowrap shrink-0 inline-block">
                                {k}
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREFERENCES & DATA */}
          {activeTab === 'preferences' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Storage Section */}
              <div className="p-3 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[8px] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  <Database className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Workspace & Storage</span>
                </div>
                <div className="space-y-1 text-xs">
                  {/* Location Row */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <div className="min-w-0 pr-2">
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Storage Path</div>
                      <div className="text-[10.5px] font-mono text-[#6b7280] dark:text-[#71717a] truncate max-w-[210px]" title={workspace.path}>
                        {workspace.path}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleCopyPath}
                            className="p-1.5 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors"
                          >
                            {copiedPath ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedPath ? 'Copied to clipboard' : 'Copy folder path'}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleOpenFolder}
                            className="p-1.5 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors"
                          >
                            <Folder className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open folder in File Explorer</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <span className="text-[#6b7280] dark:text-[#a1a1aa]">Total Items</span>
                    <span className="font-semibold text-[#111827] dark:text-white">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <span className="text-[#6b7280] dark:text-[#a1a1aa]">Attachments Storage</span>
                    <span className="font-semibold text-[#111827] dark:text-white">
                      {totalAttachments} {totalAttachments === 1 ? 'file' : 'files'} ({formatFileSize(totalAttachmentsSize)})
                    </span>
                  </div>

                  {/* Backup / Export Row */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Backup Data</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Export offline JSON archive</div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleExport}
                          disabled={isExporting}
                          className="p-1.5 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors shrink-0 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isExporting ? 'Exporting...' : 'Export JSON backup'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Restore Row */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Restore Data</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Import from backup JSON file</div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleImportNative}
                          className="p-1.5 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Import JSON backup</p>
                      </TooltipContent>
                    </Tooltip>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImport}
                      accept=".json"
                      className="hidden"
                    />
                  </div>

                  {/* Replay Onboarding Tour */}
                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Onboarding Tour</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Replay setup & welcome experience</div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setWorkspaceModalOpen(false);
                            setOnboardingOpen(true);
                          }}
                          className="p-1.5 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Replay onboarding tour</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Coffee Break & Standby Section */}
              <div className="p-3 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[8px] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  <Coffee className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Coffee Break & Standby</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between py-1.5">
                    <div className="pr-3">
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Developer Jokes</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">
                        Display a random programming joke during standby
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={standbyJokesEnabled}
                      onClick={() => setStandbyJokesEnabled(!standbyJokesEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        standbyJokesEnabled ? 'bg-[#111827] dark:bg-white' : 'bg-[#e5e7eb] dark:bg-[#3f3f46]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#18181b] shadow-sm ring-0 transition duration-200 ease-in-out ${
                          standbyJokesEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Developer & About Section */}
              <div className="p-3 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[8px] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  <User className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>About & Developer</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <div>
                      <div className="font-brand text-lg text-[#111827] dark:text-[#f4f4f5]">leeflet</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Local-First Desktop Workspace</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#f4f5f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#6b7280] dark:text-[#a1a1aa]">
                      v{currentVersion}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Christlieb Dela</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Creator & Developer</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => openExternalUrl('https://github.com/christliebdela')}
                            className="p-1.5 rounded-[5px] bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#111827] dark:text-[#f4f4f5] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>GitHub (christliebdela)</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => openExternalUrl('https://christliebdela.vercel.app/')}
                            className="p-1.5 rounded-[5px] bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#111827] dark:text-[#f4f4f5] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Website (christliebdela.vercel.app)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="p-3 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-end bg-[#fafafa] dark:bg-[#1a1a1d] shrink-0">
          <button
            onClick={() => setWorkspaceModalOpen(false)}
            className="px-3 py-1 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[5px] text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </aside>

      {/* Empty Workspace Export Alert Modal */}
      {showEmptyExportModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEmptyExportModal(false);
            }}
          >
            <div className="bg-white dark:bg-[#1c1c20] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[12px] shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150 select-none">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#111827] dark:text-[#f4f4f5]">
                    Workspace is Empty
                  </h3>
                  <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
                    There are no items or tasks in your workspace to export. Capture or create items first before generating a backup archive.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f3f4f6] dark:border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowEmptyExportModal(false)}
                  className="px-3 py-1.5 rounded-[6px] text-xs font-medium text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmptyExportModal(false);
                    setWorkspaceModalOpen(false);
                    setQuickCaptureOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Capture Item</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
