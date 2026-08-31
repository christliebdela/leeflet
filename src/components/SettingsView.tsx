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
  Cloud,
  Key,
  Globe,
  Eye,
  EyeOff,
  ExternalLink,
  Share2,
  X,
  Send,
  Lock,
  Heart,
  Info,
} from 'lucide-react';
import { Item, Attachment, ItemType, Priority, Project, THEME_PRESETS } from '../types';
import { formatFileSize, ITEM_TYPE_CONFIG, PRIORITY_CONFIG } from '../utils/format';
import { toast } from '../store/useToastStore';
import { INITIAL_SCHEMA_SQL } from '../utils/schemaSql';
import { getStoredSmtpConfig, saveStoredSmtpConfig, isSmtpConfigured, sendTestEmail } from '../utils/smtp';

type SettingsTab = 'preferences' | 'shortcuts' | 'sync' | 'data' | 'about';

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
  { id: '3a', label: 'Refresh / Sync Workspace Data', category: 'Creation & Global', keys: ['Ctrl + R', 'F5'] },
  { id: '4', label: 'Coffee Break / Standby', category: 'Creation & Global', keys: ['Z'] },
  { id: '4a', label: 'Next / Previous Joke (Standby)', category: 'Creation & Global', keys: ['> / ArrowRight', '< / ArrowLeft'] },
  { id: '5', label: 'Go to Settings', category: 'Creation & Global', keys: ['S', 'Ctrl + ,'] },
  { id: '6', label: 'Close Detail Pane / Modal', category: 'Creation & Global', keys: ['Esc'] },
  { id: '6a', label: 'Toggle Sidebar', category: 'Creation & Global', keys: ['Ctrl + B'] },
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
    workspaces,
    projects,
    items,
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    sidebarCollapseMode,
    setSidebarCollapseMode,
    standbyJokesEnabled,
    setStandbyJokesEnabled,
    viewMode,
    initialize,
  } = useLeafStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (viewMode.type === 'settings' && viewMode.tab) {
      return viewMode.tab;
    }
    return 'preferences';
  });

  useEffect(() => {
    if (viewMode.type === 'settings') {
      if (viewMode.tab) {
        setActiveTab(viewMode.tab);
      }
      if (viewMode.section) {
        setTimeout(() => {
          const el = document.getElementById(`settings-section-${viewMode.section}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [viewMode]);
  const [copiedPath, setCopiedPath] = useState(false);
  const [shortcutFilter, setShortcutFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [showExportModal, setShowExportModal] = useState(false);
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
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
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

  // BYOD Supabase Team Sync state
  const wsId = workspace?.id || '';
  const isJoinedWorkspace = wsId ? localStorage.getItem(`leeflet_is_joined_workspace_${wsId}`) === 'true' : false;
  const userRole = (wsId ? localStorage.getItem(`leeflet_workspace_role_${wsId}`) : null) || 'owner';
  const isOwnerOrAdmin = !isJoinedWorkspace || userRole === 'owner' || userRole === 'admin';

  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    return wsId ? localStorage.getItem(`leeflet_supabase_url_${wsId}`) || '' : '';
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    return wsId ? localStorage.getItem(`leeflet_supabase_anon_key_${wsId}`) || '' : '';
  });
  const [syncMode, setSyncMode] = useState<'cloud' | 'local'>(() => {
    if (!wsId) return 'local';
    return (localStorage.getItem(`leeflet_sync_mode_${wsId}`) as any) || (localStorage.getItem(`leeflet_supabase_url_${wsId}`) ? 'cloud' : 'local');
  });
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const storedDbUrl = wsId ? localStorage.getItem(`leeflet_supabase_url_${wsId}`) || '' : '';
  const storedDbAnonKey = wsId ? localStorage.getItem(`leeflet_supabase_anon_key_${wsId}`) || '' : '';
  const hasDbChanges =
    supabaseUrl.trim().replace(/\/$/, '') !== storedDbUrl.trim().replace(/\/$/, '') ||
    supabaseAnonKey.trim() !== storedDbAnonKey.trim();
  const canSaveDb = hasDbChanges && Boolean(supabaseUrl.trim()) && Boolean(supabaseAnonKey.trim());

  const handleTestConnection = async () => {
    const url = supabaseUrl.trim().replace(/\/$/, '');
    const key = supabaseAnonKey.trim();

    if (!url || !key) {
      setTestStatus('error');
      setTestMessage('Please enter both Supabase Project URL and Anon Key');
      return;
    }

    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      setTestStatus('error');
      setTestMessage('Invalid Supabase URL. Must start with https:// and end with .supabase.co');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging Supabase REST endpoint...');

    try {
      const res = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });

      if (res.ok || res.status === 200 || res.status === 404) {
        setTestStatus('success');
        setTestMessage('Connected successfully! Database is ready for team sync.');
        toast.success('Database connection verified');
      } else {
        setTestStatus('error');
        setTestMessage(`Connection returned status ${res.status}: ${res.statusText}`);
        toast.error('Could not connect to database');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err?.message || 'Network error connecting to Supabase instance');
      toast.error('Connection failed');
    }
  };

  const handleSaveConnection = () => {
    const url = supabaseUrl.trim().replace(/\/$/, '');
    const key = supabaseAnonKey.trim();

    if (!url || !key) {
      toast.error('Please enter both Project URL and Anon Key');
      return;
    }

    if (wsId) {
      localStorage.setItem(`leeflet_supabase_url_${wsId}`, url);
      localStorage.setItem(`leeflet_supabase_anon_key_${wsId}`, key);
      localStorage.setItem(`leeflet_sync_mode_${wsId}`, 'cloud');
    }
    setSyncMode('cloud');
    toast.success('Database configuration saved. Cloud Sync enabled.');
  };

  const handleDisconnect = () => {
    if (wsId) {
      localStorage.removeItem(`leeflet_supabase_url_${wsId}`);
      localStorage.removeItem(`leeflet_supabase_anon_key_${wsId}`);
      localStorage.setItem(`leeflet_sync_mode_${wsId}`, 'local');
    }
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setSyncMode('local');
    setTestStatus('idle');
    setTestMessage('');
    toast.info('Disconnected cloud database. Workspace is now local-only.');
  };

  const inviteLink = supabaseUrl && supabaseAnonKey && workspace
    ? `leeflet://join#server=${encodeURIComponent(supabaseUrl.trim().replace(/\/$/, ''))}&key=${encodeURIComponent(supabaseAnonKey.trim())}&ws=${workspace.id}&name=${encodeURIComponent(workspace.name)}`
    : '';

  const handleCopyInvite = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    toast.success('Team invite link copied to clipboard!');
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopyMigrationSql = () => {
    navigator.clipboard.writeText(INITIAL_SCHEMA_SQL);
    setCopiedSql(true);
    toast.success('Migration SQL copied to clipboard');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // SMTP Configuration State
  const initialSmtp = getStoredSmtpConfig();
  const [smtpHost, setSmtpHost] = useState(initialSmtp?.host || '');
  const [smtpPort, setSmtpPort] = useState(initialSmtp?.port ? String(initialSmtp.port) : '587');
  const [smtpEncryption, setSmtpEncryption] = useState<'tls' | 'ssl' | 'none'>(initialSmtp?.encryption || 'tls');
  const [smtpUser, setSmtpUser] = useState(initialSmtp?.username || '');
  const [smtpPass, setSmtpPass] = useState(initialSmtp?.password || '');
  const [smtpFromEmail, setSmtpFromEmail] = useState(initialSmtp?.fromEmail || '');
  const [smtpFromName, setSmtpFromName] = useState(initialSmtp?.fromName || 'Leeflet Workspaces');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isEncryptionDropdownOpen, setIsEncryptionDropdownOpen] = useState(false);
  const encryptionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (encryptionDropdownRef.current && !encryptionDropdownRef.current.contains(e.target as Node)) {
        setIsEncryptionDropdownOpen(false);
      }
    };
    if (isEncryptionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEncryptionDropdownOpen]);

  const [smtpTestStatus, setSmtpTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [smtpTestMessage, setSmtpTestMessage] = useState('');
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [selectedGuideTab, setSelectedGuideTab] = useState<'resend' | 'gmail' | 'sendgrid' | 'postmark' | 'custom'>('resend');

  const storedSmtp = getStoredSmtpConfig();
  const hasSmtpChanges =
    smtpHost.trim() !== (storedSmtp?.host || '') ||
    smtpPort.trim() !== (storedSmtp?.port ? String(storedSmtp.port) : '587') ||
    smtpEncryption !== (storedSmtp?.encryption || 'tls') ||
    smtpUser.trim() !== (storedSmtp?.username || '') ||
    smtpPass.trim() !== (storedSmtp?.password || '') ||
    smtpFromEmail.trim() !== (storedSmtp?.fromEmail || '') ||
    smtpFromName.trim() !== (storedSmtp?.fromName || 'Leeflet Workspaces');

  const canSaveSmtp =
    hasSmtpChanges &&
    Boolean(smtpHost.trim()) &&
    Boolean(smtpUser.trim()) &&
    Boolean(smtpPass.trim()) &&
    Boolean(smtpFromEmail.trim());

  const handleSaveSmtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim() || !smtpFromEmail.trim()) {
      toast.error('Please fill in all required SMTP fields (Host, Username, Password, From Email)');
      return;
    }
    const portNum = parseInt(smtpPort, 10);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      toast.error('Please enter a valid port number (e.g. 587, 465, 2525)');
      return;
    }
    saveStoredSmtpConfig({
      host: smtpHost.trim(),
      port: portNum,
      encryption: smtpEncryption,
      username: smtpUser.trim(),
      password: smtpPass.trim(),
      fromEmail: smtpFromEmail.trim(),
      fromName: smtpFromName.trim(),
    });
    toast.success('SMTP configuration saved successfully');
  };

  const handleClearSmtp = () => {
    localStorage.removeItem('leeflet_custom_smtp_config');
    setSmtpHost('');
    setSmtpPort('587');
    setSmtpEncryption('tls');
    setSmtpUser('');
    setSmtpPass('');
    setSmtpFromEmail('');
    setSmtpFromName('Leeflet Workspaces');
    setSmtpTestStatus('idle');
    setSmtpTestMessage('');
    toast.info('SMTP configuration cleared');
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim() || !testEmailRecipient.includes('@')) {
      setSmtpTestStatus('error');
      setSmtpTestMessage('Please enter a valid recipient email address.');
      return;
    }
    if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim() || !smtpFromEmail.trim()) {
      setSmtpTestStatus('error');
      setSmtpTestMessage('Please save or fill in all required SMTP fields first.');
      return;
    }

    setSmtpTestStatus('testing');
    setSmtpTestMessage('Sending test email via SMTP...');
    try {
      await sendTestEmail(testEmailRecipient.trim(), {
        host: smtpHost.trim(),
        port: parseInt(smtpPort, 10) || 587,
        encryption: smtpEncryption,
        username: smtpUser.trim(),
        password: smtpPass.trim(),
        fromEmail: smtpFromEmail.trim(),
        fromName: smtpFromName.trim(),
      });
      setSmtpTestStatus('success');
      setSmtpTestMessage(`Test email successfully delivered to ${testEmailRecipient}!`);
      toast.success('SMTP Test Email Sent!');
    } catch (err: any) {
      setSmtpTestStatus('error');
      setSmtpTestMessage(`Delivery failed: ${err.message || String(err)}`);
      toast.error('SMTP Connection Failed');
    }
  };

  const applyProviderPreset = (preset: 'resend' | 'gmail' | 'sendgrid' | 'postmark') => {
    if (preset === 'resend') {
      setSmtpHost('smtp.resend.com');
      setSmtpPort('587');
      setSmtpEncryption('tls');
      setSmtpUser('resend');
      toast.info('Applied Resend preset');
    } else if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort('587');
      setSmtpEncryption('tls');
      toast.info('Applied Gmail preset');
    } else if (preset === 'sendgrid') {
      setSmtpHost('smtp.sendgrid.net');
      setSmtpPort('587');
      setSmtpEncryption('tls');
      setSmtpUser('apikey');
      toast.info('Applied SendGrid preset');
    } else if (preset === 'postmark') {
      setSmtpHost('smtp.postmarkapp.com');
      setSmtpPort('587');
      setSmtpEncryption('tls');
      toast.info('Applied Postmark preset');
    }
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
    if (exportScope === 'current' && items.length === 0) {
      setShowEmptyExportModal(true);
      return;
    }

    try {
      setIsExporting(true);
      const jsonStr = exportScope === 'all'
        ? await dbService.exportAllWorkspacesData()
        : await dbService.exportWorkspaceData();

      const dateStr = new Date().toISOString().slice(0, 10);
      const sanitizedWsName = (workspace?.name || 'workspace')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const defaultFilename = exportScope === 'all'
        ? `leeflet-all-workspaces-backup-${dateStr}.json`
        : `leeflet-${sanitizedWsName}-backup-${dateStr}.json`;

      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { invoke } = await import('@tauri-apps/api/core');
        const filePath = await save({
          defaultPath: defaultFilename,
          filters: [{ name: 'JSON Archive', extensions: ['json'] }],
        });

        if (filePath) {
          await invoke('write_file_to_path', { path: filePath, content: jsonStr });
          toast.success(exportScope === 'all' ? 'All workspaces backup exported' : 'Workspace backup exported');
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
      toast.success(exportScope === 'all' ? 'All workspaces backup exported' : 'Workspace backup exported');
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
        <div className="space-y-3.5 pb-4 border-b border-[#e5e7eb] dark:border-[#27272a]">
          <div>
            <h1 className="text-sm font-bold text-[#111827] dark:text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
              Configure your workspace, team sync, backups, and hotkeys
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] max-w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'preferences'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'sync'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Team Sync</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'data'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data & Backup</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'shortcuts'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[5px] transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'about'
                  ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-xs font-semibold'
                  : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
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
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-visible text-xs">
                {/* Mode Switcher */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Mode
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Switch between clean light and sleek dark mode
                    </div>
                  </div>

                  <div className="flex items-center p-0.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024]">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[5px] transition-colors cursor-pointer ${
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
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[5px] transition-colors cursor-pointer ${
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

                {/* Interface Theme (Linear-style Dropdown) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Interface theme
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Select or customize your interface color scheme
                    </div>
                  </div>

                  <div className="relative" ref={themeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                      className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-xs text-[#111827] dark:text-[#f4f4f5] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-all cursor-pointer min-w-[168px] shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{
                            backgroundColor:
                              (THEME_PRESETS.find((p) => p.id === colorTheme) || THEME_PRESETS[0]).dotColor,
                          }}
                        />
                        <span className="text-[11px] font-mono text-[#6b7280] dark:text-[#a1a1aa] font-semibold">
                          Aa
                        </span>
                        <span className="font-medium truncate">
                          {(THEME_PRESETS.find((p) => p.id === colorTheme) || THEME_PRESETS[0]).name}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] transition-transform shrink-0 ${
                          isThemeDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isThemeDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-64 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#9ca3af] dark:text-[#71717a]">
                          Color Schemes
                        </div>
                        <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
                          {THEME_PRESETS.map((preset) => {
                            const isSelected = colorTheme === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setColorTheme(preset.id);
                                  setIsThemeDropdownOpen(false);
                                  if (theme !== 'dark') setTheme('dark');
                                  toast.success(`Theme set to ${preset.name}`);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[5px] text-xs transition-colors cursor-pointer text-left ${
                                  isSelected
                                    ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                                    : 'text-[#4b5563] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#202024]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-black/10 dark:border-white/10"
                                    style={{ backgroundColor: preset.dotColor }}
                                  />
                                  <div className="truncate">
                                    <div className="truncate font-medium">{preset.name}</div>
                                    <div className="text-[10px] text-[#9ca3af] dark:text-[#71717a] truncate font-normal">
                                      {preset.description}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar Collapsed Style */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Sidebar Collapsed Style
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Show quick navigation icon rail or collapse completely into full-width mode
                    </div>
                  </div>

                  <div className="flex items-center p-0.5 rounded-[6px] border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024]">
                    <button
                      type="button"
                      onClick={() => setSidebarCollapseMode('icons')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-[5px] transition-colors cursor-pointer ${
                        sidebarCollapseMode === 'icons'
                          ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-2xs font-semibold'
                          : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
                      }`}
                    >
                      Icons Only (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarCollapseMode('hidden')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-[5px] transition-colors cursor-pointer ${
                        sidebarCollapseMode === 'hidden'
                          ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-2xs font-semibold'
                          : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
                      }`}
                    >
                      Hidden
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

        {/* TAB: TEAM SYNC (BYOD SUPABASE) */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            {/* Architecture Banner */}
            <div className="p-4 rounded-[10px] border border-[#e5e7eb] dark:border-[#27272a] bg-gradient-to-br from-white via-[#fcfcfd] to-[#f9fafb] dark:from-[#18181b] dark:via-[#18181b] dark:to-[#141416] shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-[#111827] dark:text-white tracking-tight">
                      Bring Your Own Database (BYOD)
                    </h3>
                  </div>
                  <p className="text-[11.5px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 max-w-xl leading-relaxed">
                    Connect your team's Supabase PostgreSQL instance to collaborate in real-time.
                  </p>
                </div>

                {/* Status Indicator Pill */}
                <div className="self-start sm:self-auto shrink-0">
                  {syncMode === 'cloud' && supabaseUrl ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Cloud Sync Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f3f4f6] dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
                      <span>Local Only (Offline)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isOwnerOrAdmin ? (
              <div className="space-y-4">
                <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5] font-semibold">
                      <Lock className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                      <span>Managed by Workspace Administrator</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#f4f5f6] dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#323238] uppercase">
                      Role: {userRole}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
                    This workspace was joined via team invite. Database credentials and outbound mail configuration are centrally managed by your workspace administrator to preserve team synchronization.
                  </p>
                  <div className="pt-2 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                    <span>Cloud Database</span>
                    <span className="font-mono text-[#111827] dark:text-[#f4f4f5]">
                      {supabaseUrl ? `${supabaseUrl.replace(/^https?:\/\//, '').split('.')[0]}.supabase.co` : 'Connected'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[11.5px] text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
                  Want to configure your own Supabase database or custom SMTP mail server? Create or switch to a personal workspace where you are the owner.
                </div>
              </div>
            ) : (
              <>
            {/* Connection Credentials Form */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Supabase Credentials
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-4 space-y-4 text-xs">
                {/* Project URL Field */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8] mb-1">
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => {
                        setSupabaseUrl(e.target.value);
                        setTestStatus('idle');
                        setTestMessage('');
                      }}
                      placeholder="https://your-project-id.supabase.co"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                    />
                  </div>
                  <p className="text-[10.5px] text-[#9ca3af] dark:text-[#71717a] mt-1">
                    Found in your Supabase project dashboard under Settings &gt; API.
                  </p>
                </div>

                {/* Publishable API Key Field */}
                <div>
                  <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8] mb-1">
                    Publishable API Key (Client-Safe)
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showAnonKey ? 'text' : 'password'}
                      value={supabaseAnonKey}
                      onChange={(e) => {
                        setSupabaseAnonKey(e.target.value);
                        setTestStatus('idle');
                        setTestMessage('');
                      }}
                      placeholder="sb_publishable_... or eyJhbGci..."
                      className="w-full pl-9 pr-9 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnonKey(!showAnonKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white transition-colors p-1"
                      title={showAnonKey ? 'Hide key' : 'Show key'}
                    >
                      {showAnonKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10.5px] text-[#9ca3af] dark:text-[#71717a] mt-1">
                    Supports new <code className="px-1 py-0.2 rounded bg-[#f3f4f6] dark:bg-[#27272a] font-mono text-[10px]">sb_publishable_</code> and legacy <code className="px-1 py-0.2 rounded bg-[#f3f4f6] dark:bg-[#27272a] font-mono text-[10px]">anon</code> keys. Row-Level Security (RLS) protects your tables. Never use a secret key.
                  </p>
                </div>

                {/* Test Feedback Message */}
                {testMessage && (
                  <div
                    className={`p-3 rounded-[6px] text-xs flex items-start gap-2 border ${
                      testStatus === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : testStatus === 'error'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {testStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    ) : testStatus === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-blue-600 dark:text-blue-400" />
                    )}
                    <span className="leading-snug">{testMessage}</span>
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing' || !supabaseUrl || !supabaseAnonKey}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{testStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {syncMode === 'cloud' && (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-3 py-1.5 text-xs font-medium rounded-[6px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        Disconnect
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveConnection}
                      disabled={!canSaveDb}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#1f2937] dark:hover:bg-[#f4f4f5] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                    >
                      <span>Save & Connect</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 1-Click Teammate Invite Link */}
            {supabaseUrl && supabaseAnonKey && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                  1-Click Teammate Onboarding
                </div>
                <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-4 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs text-[#111827] dark:text-white">
                        Invite Link for Teammates
                      </div>
                      <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 leading-relaxed">
                        Teammates who click this link will have their Leeflet client automatically configured with this database without needing to touch API keys.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-1.5 text-[11px] font-mono bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#6b7280] dark:text-[#a1a1aa] select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#1f2937] dark:hover:bg-[#f4f4f5] transition-all shrink-0 shadow-xs"
                    >
                      {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{inviteCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Database Setup Guide */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Database Setup Guide
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                {/* Step 1 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-4 sm:py-3 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-[6px] bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] font-mono text-[10px] font-bold text-[#111827] dark:text-[#f4f4f5] flex items-center justify-center shrink-0">
                      01
                    </span>
                    <div>
                      <div className="font-semibold text-[#111827] dark:text-white">
                        Create Supabase Project
                      </div>
                      <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                        Launch a new project in your Supabase organization dashboard.
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors self-start sm:self-auto shrink-0"
                  >
                    <span>Open Supabase</span>
                    <ExternalLink className="w-3 h-3 text-[#9ca3af]" />
                  </a>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-4 sm:py-3 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-[6px] bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] font-mono text-[10px] font-bold text-[#111827] dark:text-[#f4f4f5] flex items-center justify-center shrink-0">
                      02
                    </span>
                    <div>
                      <div className="font-semibold text-[#111827] dark:text-white">
                        Run Initial Schema
                      </div>
                      <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                        Paste the schema into the Supabase SQL Editor to initialize tables and RLS policies.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyMigrationSql}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#9ca3af]" />
                        <span>Copy Schema SQL</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-4 sm:py-3 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-[6px] bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] font-mono text-[10px] font-bold text-[#111827] dark:text-[#f4f4f5] flex items-center justify-center shrink-0">
                      03
                    </span>
                    <div>
                      <div className="font-semibold text-[#111827] dark:text-white">
                        Connect Credentials
                      </div>
                      <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                        Copy your Project URL and Publishable API key from Project Settings &gt; API into the form above.
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10.5px] font-mono rounded bg-[#f4f5f6] dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#323238] self-start sm:self-auto shrink-0">
                    Settings &gt; API
                  </span>
                </div>
              </div>
            </div>

            {/* Outbound SMTP Configuration */}
            <div id="settings-section-smtp" className="space-y-1.5 pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                Team Invitations & SMTP Server
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                  <div>
                    <div className="font-semibold text-xs text-[#111827] dark:text-[#f4f4f5] flex items-center gap-2">
                      <span>Outbound Mail Server</span>
                      <span className="px-2 py-0.5 text-[10.5px] font-mono rounded bg-[#f4f5f6] dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#323238]">
                        {isSmtpConfigured() ? 'Configured' : 'Unconfigured'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 leading-relaxed">
                      Custom SMTP credentials used by your desktop app to dispatch invitation emails to new team members.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTestEmailModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f9fafb] dark:hover:bg-[#27272a] transition-all self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Test SMTP...</span>
                  </button>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSaveSmtp} className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Host */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        placeholder="smtp.resend.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                      />
                    </div>

                    {/* Port */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                        Port
                      </label>
                      <input
                        type="number"
                        placeholder="587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                      />
                    </div>

                    {/* Encryption (Modern Custom Dropdown) */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                        Encryption
                      </label>
                      <div className="relative" ref={encryptionDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsEncryptionDropdownOpen(!isEncryptionDropdownOpen)}
                          className="w-full flex items-center justify-between gap-1.5 px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] cursor-pointer"
                        >
                          <span className="font-medium truncate">
                            {smtpEncryption === 'tls' ? 'STARTTLS' : smtpEncryption === 'ssl' ? 'SSL / TLS' : 'Plain'}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] transition-transform shrink-0 ${
                              isEncryptionDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isEncryptionDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b] shadow-xl p-1 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                            {[
                              { value: 'tls', label: 'STARTTLS (587 / 2525)' },
                              { value: 'ssl', label: 'SSL / TLS (465)' },
                              { value: 'none', label: 'Plain (Unencrypted)' },
                            ].map((opt) => {
                              const isSelected = smtpEncryption === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setSmtpEncryption(opt.value as any);
                                    setIsEncryptionDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[5px] text-xs transition-colors cursor-pointer text-left ${
                                    isSelected
                                      ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                                      : 'text-[#4b5563] dark:text-[#d4d4d8] hover:bg-[#f4f5f6] dark:hover:bg-[#202024]'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Username */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                        Username / API Key
                      </label>
                      <input
                        type="text"
                        placeholder="resend or user@domain.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                        Password / Secret Token
                      </label>
                      <div className="relative">
                        <input
                          type={showSmtpPass ? 'text' : 'password'}
                          placeholder="••••••••••••••••••••"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          className="w-full pr-9 px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(!showSmtpPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white cursor-pointer"
                        >
                          {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sender Email */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                        Sender Email
                      </label>
                      <input
                        type="email"
                        placeholder="invites@yourdomain.com"
                        value={smtpFromEmail}
                        onChange={(e) => setSmtpFromEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                      />
                    </div>

                    {/* Sender Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                        Sender Name
                      </label>
                      <input
                        type="text"
                        placeholder="Leeflet Workspaces"
                        value={smtpFromName}
                        onChange={(e) => setSmtpFromName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
                    <button
                      type="button"
                      onClick={handleClearSmtp}
                      className="text-xs text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Clear Settings
                    </button>
                    <button
                      type="submit"
                      disabled={!canSaveSmtp}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-[6px] bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#1f2937] dark:hover:bg-[#f4f4f5] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                    >
                      <span>Save SMTP Settings</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Provider Setup Presets & Instructions */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
                SMTP Provider Setup Guide & Presets
              </div>
              <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
                {/* Segmented Preset Switcher */}
                <div className="p-3 bg-[#fafafa] dark:bg-[#1c1c20]">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 p-1 bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px]">
                    {[
                      { id: 'resend', label: 'Resend' },
                      { id: 'gmail', label: 'Gmail' },
                      { id: 'sendgrid', label: 'SendGrid' },
                      { id: 'postmark', label: 'Postmark' },
                      { id: 'custom', label: 'Custom' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedGuideTab(tab.id as any)}
                        className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors text-center cursor-pointer ${
                          selectedGuideTab === tab.id
                            ? 'bg-white dark:bg-[#27272a] text-[#111827] dark:text-white shadow-2xs font-semibold'
                            : 'text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Details & Instructions */}
                <div className="p-4 space-y-3">
                  {selectedGuideTab === 'resend' && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#111827] dark:text-white">
                            Resend SMTP (Recommended)
                          </div>
                          <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                            Modern transactional mail API. Free tier provides 100 emails/day.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyProviderPreset('resend')}
                          className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                        >
                          <span>Apply Preset</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] p-3 rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8]">
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Host:</span> smtp.resend.com</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Port:</span> 587 (STARTTLS)</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Username:</span> resend</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Password:</span> API Key (re_...)</div>
                      </div>
                    </div>
                  )}

                  {selectedGuideTab === 'gmail' && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#111827] dark:text-white">
                            Google Workspace / Gmail (App Password)
                          </div>
                          <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                            Requires generating a 16-character Google App Password (not your account password).
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyProviderPreset('gmail')}
                          className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                        >
                          <span>Apply Preset</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] p-3 rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8]">
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Host:</span> smtp.gmail.com</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Port:</span> 587 (STARTTLS)</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Username:</span> your-email@gmail.com</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Password:</span> 16-char App Password</div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                        <div>1. Visit Google Account &gt; Security &gt; 2-Step Verification.</div>
                        <div>2. Select <strong>App Passwords</strong> and generate one named "Leeflet".</div>
                        <div>3. Paste the generated 16-character token into the Password field above.</div>
                      </div>
                    </div>
                  )}

                  {selectedGuideTab === 'sendgrid' && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#111827] dark:text-white">
                            Twilio SendGrid SMTP
                          </div>
                          <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                            Uses "apikey" as the username with your SendGrid API key as password.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyProviderPreset('sendgrid')}
                          className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                        >
                          <span>Apply Preset</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] p-3 rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8]">
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Host:</span> smtp.sendgrid.net</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Port:</span> 587 (STARTTLS)</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Username:</span> apikey</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Password:</span> SG.123... (API Key)</div>
                      </div>
                    </div>
                  )}

                  {selectedGuideTab === 'postmark' && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#111827] dark:text-white">
                            Postmark SMTP
                          </div>
                          <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                            Uses your Server API token for both username and password.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyProviderPreset('postmark')}
                          className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                        >
                          <span>Apply Preset</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] p-3 rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8]">
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Host:</span> smtp.postmarkapp.com</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Port:</span> 587 or 2525</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Username:</span> (Server API Token)</div>
                        <div><span className="text-[#6b7280] dark:text-[#71717a]">Password:</span> (Server API Token)</div>
                      </div>
                    </div>
                  )}

                  {selectedGuideTab === 'custom' && (
                    <div className="space-y-2">
                      <div className="font-semibold text-[#111827] dark:text-white">
                        Custom SMTP / Mailgun / Amazon SES
                      </div>
                      <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
                        Leeflet supports standard RFC 5321 SMTP servers with STARTTLS or SSL encryption. Ensure your server allows outbound client submissions on port 587, 465, or 2525.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
          )}
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
                {/* Export Row */}
                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Export Workspace Archive
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Download a JSON backup of your projects, tasks, notes, and attachments
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-1.5 min-w-[136px] px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle shrink-0 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                  >
                    {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Export JSON...</span>
                  </button>
                </div>

                <div className="flex items-center justify-between px-4 py-3 gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                      Restore from Backup
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                      Import a single workspace or master multi-workspace JSON backup file
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
                      className="flex items-center justify-center gap-1.5 min-w-[136px] px-3.5 py-1.5 border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-[#111827] dark:text-white rounded-[6px] text-xs font-medium hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-all shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
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

      {/* Export Scope Choice Modal */}
      {showExportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExportModal(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5]">
                <Download className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                <h2 className="text-xs font-semibold">Export Workspace Data</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed">
              Choose what you would like to include in this backup archive:
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Current Workspace */}
              <button
                type="button"
                onClick={() => setExportScope('current')}
                className={`w-full text-left p-3 rounded-[6px] border transition-colors cursor-pointer ${
                  exportScope === 'current'
                    ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f9fafb] dark:bg-[#202024]'
                    : 'border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#111827] dark:text-white flex items-center gap-1.5">
                      <span>Current Workspace</span>
                      <span className="text-[10.5px] font-normal text-[#6b7280] dark:text-[#a1a1aa]">
                        ({workspace?.name})
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                      Includes all projects ({projects.length}), tasks ({items.length}), and attachments for this workspace only.
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    exportScope === 'current'
                      ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#111827] dark:bg-white'
                      : 'border-[#d1d5db] dark:border-[#3f3f46]'
                  }`}>
                    {exportScope === 'current' && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#111827]" />}
                  </div>
                </div>
              </button>

              {/* Option 2: All Workspaces */}
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`w-full text-left p-3 rounded-[6px] border transition-colors cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f9fafb] dark:bg-[#202024]'
                    : 'border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#111827] dark:text-white flex items-center gap-1.5">
                      <span>All Workspaces</span>
                      <span className="text-[10.5px] font-normal text-[#6b7280] dark:text-[#a1a1aa]">
                        ({workspaces.length} workspaces)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                      Complete master backup containing every workspace and all associated projects and tasks.
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    exportScope === 'all'
                      ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#111827] dark:bg-white'
                      : 'border-[#d1d5db] dark:border-[#3f3f46]'
                  }`}>
                    {exportScope === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#111827]" />}
                  </div>
                </div>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowExportModal(false);
                  await handleExport();
                }}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{exportScope === 'all' ? 'Export All Workspaces' : 'Export Current Workspace'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Send Test Email Modal */}
      {showTestEmailModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTestEmailModal(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-[10px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5]">
                <Send className="w-4 h-4 text-[#111827] dark:text-white" />
                <h2 className="text-xs font-semibold">Test SMTP Email Delivery</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTestEmailModal(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
                Send a test email through <span className="font-mono text-[#111827] dark:text-white">{smtpHost || 'your SMTP server'}</span> to verify host connection, port negotiation, and authentication credentials.
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#374151] dark:text-[#d4d4d8]">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  placeholder="your-personal-email@example.com"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] font-mono"
                />
              </div>

              {smtpTestStatus !== 'idle' && (
                <div className="p-3 rounded-[6px] text-xs border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] flex items-start gap-2.5">
                  {smtpTestStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-[#6b7280] dark:text-[#a1a1aa]" />}
                  {smtpTestStatus === 'success' && <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#111827] dark:text-white" />}
                  {smtpTestStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#111827] dark:text-white" />}
                  <span className="leading-relaxed break-words">{smtpTestMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setShowTestEmailModal(false)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={smtpTestStatus === 'testing'}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle cursor-pointer disabled:opacity-50"
              >
                {smtpTestStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ABOUT */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Hero Card */}
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] bg-white dark:bg-[#18181b] overflow-hidden">
            <div className="px-6 py-8 flex flex-col items-center text-center gap-3 border-b border-[#f3f4f6] dark:border-[#27272a]">
              <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#111827] to-[#374151] dark:from-white dark:to-[#d1d5db] flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white dark:text-[#111827]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#111827] dark:text-white tracking-tight">
                  Leeflet
                </h2>
                <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                  Local-first task &amp; workspace management
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] text-[11px] font-semibold text-[#374151] dark:text-[#d4d4d8]">
                  v0.1.0
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  Early Access
                </span>
              </div>
            </div>

            {/* Credits row */}
            <div className="px-6 py-4 flex items-center justify-center gap-1.5 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
              <span>Built with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>by</span>
              <span className="font-semibold text-[#111827] dark:text-white">Christlieb Dela</span>
            </div>
          </div>

          {/* Tech stack */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
              Built With
            </div>
            <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] text-xs">
              {([
                { label: 'Framework', value: 'React 18 + TypeScript' },
                { label: 'Desktop Shell', value: 'Tauri v2 (Rust)' },
                { label: 'Styling', value: 'Tailwind CSS v4' },
                { label: 'Database', value: 'SQLite (local) / Supabase (cloud)' },
                { label: 'State', value: 'Zustand' },
                { label: 'Avatars', value: 'DiceBear 10.x' },
                { label: 'Icons', value: 'Lucide React' },
              ] as { label: string; value: string }[]).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 gap-4">
                  <span className="text-[#6b7280] dark:text-[#a1a1aa]">{label}</span>
                  <span className="font-medium text-[#111827] dark:text-[#f4f4f5] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
              Legal &amp; Licenses
            </div>
            <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-4 text-xs text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed space-y-2">
              <p>
                Leeflet is a personal productivity tool. All data is stored locally on your device
                unless you configure a cloud database. No telemetry or analytics are collected.
              </p>
              <p>
                Third-party licenses: DiceBear avatar styles are used under their respective
                open-source licenses (CC0 1.0 &amp; CC BY 4.0). Lucide icons are MIT licensed.
              </p>
              <p className="text-[10px] text-[#9ca3af] dark:text-[#71717a]">
                © {new Date().getFullYear()} Christlieb Dela. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
