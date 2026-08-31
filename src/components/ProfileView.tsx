import React, { useState } from 'react';
import {
  Check,
  Save,
  Shield,
  CheckCircle2,
  ListTodo,
  Layers,
  Zap,
  MessageSquare,
  Coffee,
  Rocket,
  Compass,
  KeyRound,
  Smartphone,
  Bell,
  Volume2,
  Download,
  Laptop,
  X,
  RefreshCw,
  Lock,
  Database,
  Palette,
  ArrowRight,
} from 'lucide-react';
import { useLeafStore } from '../store/useLeafStore';
import { toast } from '../store/useToastStore';
import { dbService } from '../services/db';
import { getStoredTeamMembers, saveStoredTeamMembers } from '../utils/team';

export type StatusIconType = 'zap' | 'message' | 'coffee' | 'rocket' | 'compass';

interface ProfileData {
  fullName: string;
  username: string;
  email: string;
  title: string;
  avatarColor?: string;
  statusIcon: StatusIconType;
  statusText: string;
}

interface NotificationPreferences {
  desktop: boolean;
  sound: boolean;
  weeklyDigest: boolean;
}

const PROFILE_STORAGE_KEY = 'leeflet_user_profile_data';
const NOTIF_STORAGE_KEY = 'leeflet_notification_prefs';

const DEFAULT_PROFILE: ProfileData = {
  fullName: '',
  username: '',
  email: '',
  title: 'Workspace Owner',
  avatarColor: 'bg-violet-600 dark:bg-violet-500',
  statusIcon: 'zap',
  statusText: 'In the zone',
};

const DEFAULT_NOTIFS: NotificationPreferences = {
  desktop: true,
  sound: true,
  weeklyDigest: false,
};

interface StatusPreset {
  icon: StatusIconType;
  label: string;
  text: string;
}

const STATUS_PRESETS: StatusPreset[] = [
  { icon: 'zap', label: 'In the zone', text: 'In the zone' },
  { icon: 'message', label: 'In a meeting', text: 'In a meeting' },
  { icon: 'coffee', label: 'Coffee break', text: 'Coffee break' },
  { icon: 'rocket', label: 'Shipping', text: 'Shipping features' },
  { icon: 'compass', label: 'Away', text: 'Away from keyboard' },
];

const AVATAR_COLORS = [
  { label: 'Violet', class: 'bg-violet-600 dark:bg-violet-500' },
  { label: 'Emerald', class: 'bg-emerald-600 dark:bg-emerald-500' },
  { label: 'Blue', class: 'bg-blue-600 dark:bg-blue-500' },
  { label: 'Amber', class: 'bg-amber-600 dark:bg-amber-500' },
  { label: 'Rose', class: 'bg-rose-600 dark:bg-rose-500' },
  { label: 'Zinc', class: 'bg-zinc-800 dark:bg-zinc-700' },
];

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

export const ProfileView: React.FC = () => {
  const { workspace, items, setViewMode } = useLeafStore();
  const supabaseUrl = workspace ? localStorage.getItem(`leeflet_supabase_url_${workspace.id}`) : null;
  const isCloudSync = workspace ? localStorage.getItem(`leeflet_sync_mode_${workspace.id}`) === 'cloud' && Boolean(supabaseUrl) : false;

  const [initialProfile, setInitialProfile] = useState<ProfileData>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY) || localStorage.getItem('leaf_user_profile_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.statusEmoji && !parsed.statusIcon) parsed.statusIcon = 'zap';
        return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROFILE;
  });

  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Notification Preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem(NOTIF_STORAGE_KEY) || localStorage.getItem('leaf_notification_prefs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_NOTIFS;
  });

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA Mock State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Has changes check (disables save button when pristine)
  const hasChanges = JSON.stringify(profile) !== JSON.stringify(initialProfile);

  const completedCount = items.filter((i) => i.status === 'done').length;
  const queueCount = items.filter(
    (i) =>
      (i.priority === 'critical' ||
        i.priority === 'high' ||
        i.priority === 'medium' ||
        i.priority === 'low' ||
        i.type === 'idea') &&
      i.status !== 'done' &&
      i.status !== 'archived'
  ).length;
  const backlogCount = items.filter((i) => i.status === 'inbox').length;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasChanges) return;

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

      // Sync with team members store
      const members = getStoredTeamMembers();
      if (members.length > 0) {
        members[0].name = profile.fullName;
        members[0].email = profile.email;
        if (profile.avatarColor) {
          members[0].avatarColor = profile.avatarColor;
        }
        saveStoredTeamMembers(members);
      }

      setInitialProfile(profile);
      setSavedSuccess(true);
      toast.success('Profile updated');
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      toast.error('Failed to save profile');
    }
  };

  const handleToggleNotif = (key: keyof NotificationPreferences) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
    toast.success('Preference updated');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    }, 450);
  };

  const handleSendResetEmail = () => {
    toast.info(`Password reset instructions sent to ${profile.email}`);
    setIsPasswordModalOpen(false);
  };

  const handleExportData = async () => {
    try {
      const data = await dbService.exportWorkspaceData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leeflet-workspace-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Workspace export downloaded');
    } catch {
      toast.error('Failed to export workspace data');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderStatusIcon = (icon: StatusIconType, className = "w-3.5 h-3.5") => {
    switch (icon) {
      case 'message':
        return <MessageSquare className={className} />;
      case 'coffee':
        return <Coffee className={className} />;
      case 'rocket':
        return <Rocket className={className} />;
      case 'compass':
        return <Compass className={className} />;
      case 'zap':
      default:
        return <Zap className={className} />;
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 custom-scrollbar">
      <div className="max-w-[760px] mx-auto space-y-6 pb-16">
        {/* Profile Header (Linear Style) */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#e5e7eb] dark:border-[#27272a]">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs transition-colors ${profile.avatarColor || 'bg-violet-600 dark:bg-violet-500'}`}>
              {getInitials(profile.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#111827] dark:text-white tracking-tight">
                  {profile.fullName || 'User'}
                </h1>
                <span className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] px-1.5 py-0.2 rounded">
                  Owner
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                <span>@{profile.username}</span>
                <span>•</span>
                <span>{profile.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Current status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-xs text-[#6b7280] dark:text-[#a1a1aa]">
              {renderStatusIcon(profile.statusIcon, "w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]")}
              <span className="font-medium text-[#374151] dark:text-[#d4d4d8]">{profile.statusText}</span>
            </div>

            {/* Save Button: Disabled when pristine */}
            <button
              onClick={() => handleSave()}
              type="button"
              disabled={!hasChanges || savedSuccess}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-semibold transition-all shadow-subtle shrink-0 ${
                hasChanges && !savedSuccess
                  ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] cursor-pointer active:scale-95'
                  : 'bg-[#f4f5f6] dark:bg-[#202024] text-[#9ca3af] dark:text-[#52525b] border border-[#e5e7eb] dark:border-[#27272a] cursor-not-allowed opacity-60'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* General Information Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            General
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
            {/* Full Name */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <label className="text-[#6b7280] dark:text-[#a1a1aa] font-medium shrink-0 w-32">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="flex-1 bg-transparent text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none font-medium"
                placeholder="Your Name"
              />
            </div>

            {/* Username */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <label className="text-[#6b7280] dark:text-[#a1a1aa] font-medium shrink-0 w-32">
                Username
              </label>
              <div className="flex-1 flex items-center gap-1 font-mono text-xs">
                <span className="text-[#9ca3af]">@</span>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full bg-transparent text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none"
                  placeholder="username"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <label className="text-[#6b7280] dark:text-[#a1a1aa] font-medium shrink-0 w-32">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="flex-1 bg-transparent text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none"
                placeholder="email@example.com"
              />
            </div>

            {/* Job Title */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <label className="text-[#6b7280] dark:text-[#a1a1aa] font-medium shrink-0 w-32">
                Job Title
              </label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="flex-1 bg-transparent text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none"
                placeholder="e.g. Frontend Engineer"
              />
            </div>

            {/* Avatar Color */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <label className="text-[#6b7280] dark:text-[#a1a1aa] font-medium shrink-0 w-32 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Avatar Color</span>
              </label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.class}
                    type="button"
                    title={c.label}
                    onClick={() => setProfile({ ...profile, avatarColor: c.class })}
                    className={`w-5 h-5 rounded-full ${c.class} flex items-center justify-center transition-all cursor-pointer ${
                      (profile.avatarColor || 'bg-violet-600 dark:bg-violet-500') === c.class
                        ? 'ring-2 ring-offset-2 ring-[#111827] dark:ring-white scale-110'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {(profile.avatarColor || 'bg-violet-600 dark:bg-violet-500') === c.class && (
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team & Cloud Database Identity */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Team & Database Identity
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] flex items-center justify-center text-[#111827] dark:text-white shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#111827] dark:text-white">
                    {workspace?.name || 'Workspace'}
                  </div>
                  <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] font-mono">
                    {supabaseUrl ? supabaseUrl.replace('https://', '') : 'Local SQLite / IndexedDB'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isCloudSync ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Realtime Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f4f5f6] dark:bg-[#202024] text-[#6b7280] dark:text-[#a1a1aa] border border-[#e5e7eb] dark:border-[#27272a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
                    <span>Local Mode</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setViewMode({ type: 'settings' })}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                >
                  <span>Sync Settings</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
              Your profile, assigned tasks, and avatar colors automatically replicate across your teammates' workspaces when connected to a team database.
            </p>
          </div>
        </div>

        {/* Work Status Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Work Status
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-3.5 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[5px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] flex items-center justify-center text-[#6b7280] dark:text-[#a1a1aa] shrink-0">
                {renderStatusIcon(profile.statusIcon, "w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]")}
              </div>
              <input
                type="text"
                value={profile.statusText}
                onChange={(e) => setProfile({ ...profile, statusText: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none text-xs"
                placeholder="What are you currently focusing on?"
              />
            </div>

            {/* Status presets */}
            <div className="flex flex-wrap gap-1.5">
              {STATUS_PRESETS.map((preset, idx) => {
                const isSelected = profile.statusIcon === preset.icon && profile.statusText === preset.text;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        statusIcon: preset.icon,
                        statusText: preset.text,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] border text-[11px] transition-colors ${
                      isSelected
                        ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#e5e7eb]/70 dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-medium'
                        : 'border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#1c1c1f] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#242428] hover:text-[#111827] dark:hover:text-[#f4f4f5]'
                    }`}
                  >
                    {renderStatusIcon(preset.icon, isSelected ? 'w-3 h-3 text-[#111827] dark:text-[#f4f4f5]' : 'w-3 h-3 text-[#9ca3af] dark:text-[#71717a]')}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security & Authentication Section */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Security & Authentication
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
            {/* Password Row */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                    Password
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                    Set a secure password for your Leaf account
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-[#111827] dark:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors shrink-0"
              >
                Change Password
              </button>
            </div>

            {/* Two-Factor Authentication Row */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Smartphone className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                    Two-Factor Authentication
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                    {is2FAEnabled ? 'Protected with authenticator app' : 'Add an extra layer of security on sign-in'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !is2FAEnabled;
                  setIs2FAEnabled(next);
                  toast.success(next ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-[5px] border transition-colors shrink-0 ${
                  is2FAEnabled
                    ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                    : 'border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-[#111827] dark:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                }`}
              >
                {is2FAEnabled ? 'Enabled' : 'Enable 2FA'}
              </button>
            </div>

            {/* Active Sessions */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Laptop className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5] flex items-center gap-1.5">
                    <span>Windows Desktop App</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                    Tauri Client • Active Now
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#9ca3af] dark:text-[#71717a] bg-[#f9fafb] dark:bg-[#202024] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a]">
                Current Device
              </span>
            </div>
          </div>
        </div>

        {/* Notifications & Preferences */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Notifications & Preferences
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
            {/* Desktop Notifications */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Bell className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                    Desktop Notifications
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                    Receive OS notifications when teammates mention or assign you
                  </div>
                </div>
              </div>
              <ToggleSwitch
                ariaLabel="Desktop notifications"
                checked={notifications.desktop}
                onChange={() => handleToggleNotif('desktop')}
              />
            </div>

            {/* Completion Sound Chime */}
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Volume2 className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                    Completion Chimes
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                    Play a discreet sound effect when checking off tasks
                  </div>
                </div>
              </div>
              <ToggleSwitch
                ariaLabel="Completion chimes"
                checked={notifications.sound}
                onChange={() => handleToggleNotif('sound')}
              />
            </div>
          </div>
        </div>

        {/* Activity Snapshot */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Activity
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5 text-[#6b7280] dark:text-[#a1a1aa]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Completed Tasks</span>
              </div>
              <span className="font-semibold text-[#111827] dark:text-white font-mono">
                {completedCount}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5 text-[#6b7280] dark:text-[#a1a1aa]">
                <ListTodo className="w-3.5 h-3.5 text-blue-400" />
                <span>Active in Queue</span>
              </div>
              <span className="font-semibold text-[#111827] dark:text-white font-mono">
                {queueCount}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5 text-[#6b7280] dark:text-[#a1a1aa]">
                <Layers className="w-3.5 h-3.5 text-[#9ca3af]" />
                <span>Backlog Items</span>
              </div>
              <span className="font-semibold text-[#111827] dark:text-white font-mono">
                {backlogCount}
              </span>
            </div>
          </div>
        </div>

        {/* Data & Backup */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Workspace Data
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Download className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5]">
                    Export Workspace Archive
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                    Download a JSON copy of all items, projects, and checklist data
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#323238] bg-[#f9fafb] dark:bg-[#202024] text-[#111827] dark:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors shrink-0"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Identity Note */}
        <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-[#fafafa] dark:bg-[#151518] px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#6b7280] dark:text-[#a1a1aa]">
            <Shield className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span>
              Workspace <strong className="text-[#111827] dark:text-white font-medium">{workspace?.name || 'Personal'}</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#9ca3af] dark:text-[#71717a]">
            Local-First
          </span>
        </div>
      </div>

      {/* Password Reset Modal (Strict Monochrome with Frosted Blur Backdrop) */}
      {isPasswordModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPasswordModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <div
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsPasswordModalOpen(false);
            }}
            className="bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] shadow-modal w-full max-w-sm p-5 select-none animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f3f4f6] dark:border-[#27272a]">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                <h3 className="text-sm font-semibold text-[#111827] dark:text-[#f4f4f5]">
                  Change Password
                </h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-[#9ca3af] hover:text-[#111827] dark:hover:text-white p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#6b7280] dark:text-[#a1a1aa] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6b7280] dark:text-[#a1a1aa] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6b7280] dark:text-[#a1a1aa] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                  placeholder="Repeat new password"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] hover:underline"
                >
                  Forgot password?
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-2.5 py-1 text-xs text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[5px] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-3 py-1 text-xs font-semibold bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[5px] hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
