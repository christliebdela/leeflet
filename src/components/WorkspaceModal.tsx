import React, { useState, useRef, useEffect } from 'react';
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
  Sun,
  Moon,
  Check,
  Copy,
  ExternalLink,
  Sliders,
  Database,
  User,
  Sparkles,
} from 'lucide-react';
import { Item, Attachment } from '../types';
import { formatFileSize } from '../utils/format';

type Tab = 'shortcuts' | 'preferences';

interface ShortcutItem {
  id: string;
  label: string;
  category: 'Creation & Global' | 'Views & Projects' | 'Item Actions';
  keys: string[];
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  { id: '1', label: 'New Item (In-App)', category: 'Creation & Global', keys: ['N', 'Ctrl + N'] },
  { id: '2', label: 'Quick Capture (Desktop Floating Panel)', category: 'Creation & Global', keys: ['Alt + L'] },
  { id: '3', label: 'Search Workspace', category: 'Creation & Global', keys: ['Ctrl + K', '/'] },
  { id: '4', label: 'Open Settings Sheet', category: 'Creation & Global', keys: ['S', 'Ctrl + ,'] },
  { id: '5', label: 'Close Sheet / Modal', category: 'Creation & Global', keys: ['Esc'] },
  { id: '6', label: 'Go to Backlog', category: 'Views & Projects', keys: ['Ctrl + I'] },
  { id: '7', label: 'Go to My Queue', category: 'Views & Projects', keys: ['Ctrl + Q'] },
  { id: '8', label: 'Go to All Items', category: 'Views & Projects', keys: ['Ctrl + Shift + A'] },
  { id: '9', label: 'Switch Projects (1-9)', category: 'Views & Projects', keys: ['1 - 9'] },
  { id: '10', label: 'Save / Submit Item', category: 'Item Actions', keys: ['Enter'] },
  { id: '11', label: 'Delete Selected Card', category: 'Item Actions', keys: ['Del / Backspace'] },
  { id: '12', label: 'Add Checklist Item', category: 'Item Actions', keys: ['Enter'] },
];

export const WorkspaceModal: React.FC = () => {
  const {
    workspace,
    items,
    theme,
    setTheme,
    isWorkspaceModalOpen,
    setWorkspaceModalOpen,
    setOnboardingOpen,
    initialize,
  } = useLeafStore();

  const [activeTab, setActiveTab] = useState<Tab>('shortcuts');
  const [copiedPath, setCopiedPath] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global window Escape key listener
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWorkspaceModalOpen) {
        setWorkspaceModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isWorkspaceModalOpen, setWorkspaceModalOpen]);

  if (!isWorkspaceModalOpen || !workspace) return null;

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
    const jsonStr = await dbService.exportWorkspaceData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaf-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await dbService.importWorkspaceData(text);
        alert('Workspace restored successfully!');
        await initialize();
        setWorkspaceModalOpen(false);
      } catch {
        alert('Failed to import workspace. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(workspace.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
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
      onClick={(e) => {
        if (e.target === e.currentTarget) setWorkspaceModalOpen(false);
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end select-none animate-in fade-in duration-200"
    >
      {/* Right Slide-Over Sheet (matching ItemDetailPane floating card layout) */}
      <aside className="w-[420px] max-w-[calc(100vw-3rem)] my-2 mr-6 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-modal flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 border-b border-[#f3f4f6] dark:border-[#27272a] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] flex items-center justify-center">
                <img
                  src="/leaf_logo.png"
                  alt="Leaf"
                  className="w-4 h-4 object-contain brightness-0 dark:brightness-0 dark:invert"
                />
              </div>
              <div>
                <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                  Settings
                </h2>
                <p className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">
                  Shortcuts & Preferences
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa]">
                Esc
              </kbd>
              <button
                onClick={() => setWorkspaceModalOpen(false)}
                className="p-1.5 rounded-[6px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clean Segmented Tab Navigation */}
          <div className="flex items-center gap-1 bg-[#f4f5f6] dark:bg-[#222226] p-1 rounded-[6px]">
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all ${
                activeTab === 'shortcuts'
                  ? 'bg-white dark:bg-[#18181b] text-[#111827] dark:text-white shadow-xs'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 shrink-0" />
              <span>Shortcuts</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all ${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-[#18181b] text-[#111827] dark:text-white shadow-xs'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Preferences & Data</span>
            </button>
          </div>
        </div>

        {/* Sheet Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
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
                        className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a] last:border-b-0"
                      >
                        <span className="text-[#6b7280] dark:text-[#a1a1aa]">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-[10px] text-[#9ca3af]">or</span>}
                              <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#111827] dark:text-white">
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
                        className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a] last:border-b-0"
                      >
                        <span className="text-[#6b7280] dark:text-[#a1a1aa]">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-[10px] text-[#9ca3af]">or</span>}
                              <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#111827] dark:text-white">
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
                        className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a] last:border-b-0"
                      >
                        <span className="text-[#6b7280] dark:text-[#a1a1aa]">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <span className="text-[10px] text-[#9ca3af]">or</span>}
                              <kbd className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#111827] dark:text-white">
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

          {/* TAB 2: PREFERENCES & DATA (Using the exact same clean row-based design as Shortcuts) */}
          {activeTab === 'preferences' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Appearance Section */}
              <div className="p-3 bg-white dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#2e2e32] rounded-[8px] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  <Sun className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Appearance</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Theme</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Select interface color mode</div>
                    </div>
                    {/* Compact Segmented Switch */}
                    <div className="flex items-center bg-[#f4f5f6] dark:bg-[#27272a] p-0.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#3f3f46]">
                      <button
                        onClick={() => setTheme('dark')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[11px] font-medium transition-all ${
                          theme === 'dark'
                            ? 'bg-[#18181b] text-white shadow-xs'
                            : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-white'
                        }`}
                      >
                        <Moon className="w-3 h-3" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => setTheme('light')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[11px] font-medium transition-all ${
                          theme === 'light'
                            ? 'bg-white text-[#111827] shadow-xs'
                            : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827]'
                        }`}
                      >
                        <Sun className="w-3 h-3" />
                        <span>Light</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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
                      <button
                        onClick={handleCopyPath}
                        className="px-2 py-1 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Copy folder path"
                      >
                        {copiedPath ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPath ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => alert(`Workspace folder:\n${workspace.path}`)}
                        className="p-1 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors"
                        title="Open in file manager"
                      >
                        <Folder className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <span className="text-[#6b7280] dark:text-[#a1a1aa]">Total Items</span>
                    <span className="font-semibold text-[#111827] dark:text-white">{items.length} items</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <span className="text-[#6b7280] dark:text-[#a1a1aa]">Attachments Storage</span>
                    <span className="font-semibold text-[#111827] dark:text-white">
                      {totalAttachments} files ({formatFileSize(totalAttachmentsSize + 12400)})
                    </span>
                  </div>

                  {/* Backup / Export Row */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Backup Data</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Export offline JSON archive</div>
                    </div>
                    <button
                      onClick={handleExport}
                      className="px-2.5 py-1 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Export JSON</span>
                    </button>
                  </div>

                  {/* Restore Row */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Restore Data</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Import from backup JSON file</div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Import JSON</span>
                    </button>
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
                    <button
                      onClick={() => {
                        setWorkspaceModalOpen(false);
                        setOnboardingOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[#374151] dark:text-[#d4d4d8] rounded-[4px] border border-[#e5e7eb] dark:border-[#3f3f46] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                      <span>Replay Tour</span>
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
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Leaf</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Local-First Desktop Workspace</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#f4f5f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[10px] font-semibold text-[#6b7280] dark:text-[#a1a1aa]">
                      v0.1.0 Beta
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <div className="text-[#111827] dark:text-[#f4f4f5] font-medium">Christlieb Dela</div>
                      <div className="text-[10.5px] text-[#6b7280] dark:text-[#71717a]">Creator & Developer</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openExternalUrl('https://github.com/christliebdela')}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-[#f4f5f6] dark:bg-[#27272a] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] text-[11px] font-medium text-[#111827] dark:text-[#f4f4f5] border border-[#e5e7eb] dark:border-[#3f3f46] transition-colors"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>/christliebdela</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="p-3 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between bg-[#fafafa] dark:bg-[#1a1a1d] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span className="text-[10.5px] font-medium text-[#6b7280] dark:text-[#a1a1aa]">
              Local Storage Connected
            </span>
          </div>

          <button
            onClick={() => setWorkspaceModalOpen(false)}
            className="px-3 py-1 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[5px] text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
};
