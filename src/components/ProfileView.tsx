import React, { useState } from 'react';
import {
  Check,
  Save,
  Shield,
  CheckCircle2,
  ListTodo,
  Layers,
  Bell,
  Volume2,
  Download,
  Database,
  ArrowRight,
  Sparkles,
  Dices,
} from 'lucide-react';
import { useLeafStore } from '../store/useLeafStore';
import { toast } from '../store/useToastStore';
import { dbService } from '../services/db';
import { getStoredTeamMembers, saveStoredTeamMembers } from '../utils/team';
import { isWorkspaceCloudSync, getCloudCredentials } from '../services/cloudSync';
import {
  MASCOT_PRESETS,
  resolveAvatarUrl,
  getDiceBearSvgUrl,
} from '../utils/avatars';

export type StatusIconType = 'zap' | 'message' | 'coffee' | 'rocket' | 'compass';

interface ProfileData {
  fullName: string;
  username: string;
  email: string;
  title: string;
  avatarColor?: string;
  avatarMascot?: string;
  avatarUrl?: string;
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
  title: 'Workspace Admin',
  avatarMascot: 'bot-spark',
  avatarColor: 'bg-violet-600 dark:bg-violet-500',
  statusIcon: 'zap',
  statusText: 'In the zone',
};

const DEFAULT_NOTIFS: NotificationPreferences = {
  desktop: true,
  sound: true,
  weeklyDigest: false,
};

// interface StatusPreset {
//   icon: StatusIconType;
//   label: string;
//   text: string;
// }
//
// STATUS_PRESETS — kept for when Work Status section is re-enabled
// const STATUS_PRESETS: StatusPreset[] = [
//   { icon: 'zap', label: 'In the zone', text: 'In the zone' },
//   { icon: 'message', label: 'In a meeting', text: 'In a meeting' },
//   { icon: 'coffee', label: 'Coffee break', text: 'Coffee break' },
//   { icon: 'rocket', label: 'Shipping', text: 'Shipping features' },
//   { icon: 'compass', label: 'Away', text: 'Away from keyboard' },
// ];

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
  const isCloudSync = workspace ? isWorkspaceCloudSync(workspace.id) : false;
  const supabaseUrl = workspace ? getCloudCredentials(workspace.id)?.url || null : null;

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

  // Password Modal & 2FA State (Commented out — not needed for local-first desktop app)
  // const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  // const [currentPassword, setCurrentPassword] = useState('');
  // const [newPassword, setNewPassword] = useState('');
  // const [confirmPassword, setConfirmPassword] = useState('');
  // const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  // const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const [selectedMascotCategory, setSelectedMascotCategory] = useState<'All' | 'Robots' | 'Clay' | 'Critters' | 'Fun Emoji'>('All');
  const [customSeedInput, setCustomSeedInput] = useState('');

  const handleSelectAvatar = (mascotId: string, customUrl?: string, feedbackName?: string) => {
    const activeUrl = customUrl || resolveAvatarUrl(mascotId, profile.fullName || 'owner');
    const updated: ProfileData = {
      ...profile,
      avatarMascot: mascotId,
      avatarUrl: activeUrl,
    };
    setProfile(updated);
    setInitialProfile((prev) => ({
      ...prev,
      avatarMascot: mascotId,
      avatarUrl: activeUrl,
    }));

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));

      // Sync with team members store
      const members = getStoredTeamMembers();
      if (members.length > 0) {
        members[0].avatarMascot = mascotId;
        members[0].avatarUrl = activeUrl;
        saveStoredTeamMembers(members);
      }

      // Notify Sidebar and all components instantly
      window.dispatchEvent(new CustomEvent('leeflet-profile-updated', { detail: updated }));
      if (feedbackName) {
        toast.success(`Avatar updated: ${feedbackName}`);
      }
    } catch {
      toast.error('Failed to autosave avatar');
    }
  };

  const handleRandomizeMascot = () => {
    const randomPreset = MASCOT_PRESETS[Math.floor(Math.random() * MASCOT_PRESETS.length)];
    const randomSeed = `${randomPreset.seed}-${Math.floor(Math.random() * 1000)}`;
    const url = getDiceBearSvgUrl(randomPreset.style, randomSeed);
    handleSelectAvatar(randomPreset.id, url, randomPreset.name);
  };

  const handleApplyCustomSeed = (seed: string) => {
    if (!seed.trim()) return;
    const url = getDiceBearSvgUrl('bottts', seed.trim());
    handleSelectAvatar(`custom:${seed.trim()}`, url, seed.trim());
  };

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
        if (profile.avatarMascot) members[0].avatarMascot = profile.avatarMascot;
        if (profile.avatarUrl) members[0].avatarUrl = profile.avatarUrl;
        if (profile.avatarColor) {
          members[0].avatarColor = profile.avatarColor;
        }
        saveStoredTeamMembers(members);
      }

      window.dispatchEvent(new CustomEvent('leeflet-profile-updated', { detail: profile }));
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

  // Password submit & reset handlers (Commented out)
  // const handlePasswordSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!currentPassword) {
  //     toast.error('Please enter your current password');
  //     return;
  //   }
  //   if (newPassword.length < 8) {
  //     toast.error('New password must be at least 8 characters');
  //     return;
  //   }
  //   if (newPassword !== confirmPassword) {
  //     toast.error('New passwords do not match');
  //     return;
  //   }
  //   setIsUpdatingPassword(true);
  //   setTimeout(() => {
  //     setIsUpdatingPassword(false);
  //     setIsPasswordModalOpen(false);
  //     setCurrentPassword('');
  //     setNewPassword('');
  //     setConfirmPassword('');
  //     toast.success('Password updated successfully');
  //   }, 800);
  // };
  //
  // const handleSendResetEmail = () => {
  //   toast.info(`Password reset instructions sent to ${profile.email}`);
  //   setIsPasswordModalOpen(false);
  // };

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



  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 custom-scrollbar">
      <div className="max-w-[760px] mx-auto space-y-6 pb-16">
        {/* Profile Header (Linear Style) */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#e5e7eb] dark:border-[#27272a]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl border border-[#e5e7eb] dark:border-[#323238] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              <img
                src={resolveAvatarUrl(profile.avatarMascot || profile.avatarUrl || profile.avatarColor, profile.fullName || profile.username || 'owner')}
                alt={profile.fullName || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#111827] dark:text-white tracking-tight">
                  {profile.fullName || 'User'}
                </h1>
                <span className="text-[9.5px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] px-1.5 py-0.2 rounded">
                  {workspace ? localStorage.getItem(`leeflet_workspace_role_${workspace.id}`) || (localStorage.getItem(`leeflet_is_joined_workspace_${workspace.id}`) === 'true' ? 'Member' : 'Admin') : 'Admin'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                <span>@{profile.username || 'user'}</span>
                {profile.email && (
                  <>
                    <span>•</span>
                    <span>{profile.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            {/* Mascot Avatar Selection */}
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-[#111827] dark:text-[#f4f4f5] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Workspace Mascot Avatar</span>
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
                    Choose a DiceBear mascot or generate a custom seed for your profile
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleRandomizeMascot}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[5px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Randomize</span>
                  </button>
                </div>
              </div>

              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {(['All', 'Robots', 'Clay', 'Critters', 'Fun Emoji'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedMascotCategory(cat)}
                    className={`px-2.5 py-1 rounded-[5px] text-[11px] transition-colors shrink-0 cursor-pointer ${
                      selectedMascotCategory === cat
                        ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] font-semibold'
                        : 'text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Mascot Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-1">
                {MASCOT_PRESETS.filter((m) => selectedMascotCategory === 'All' || m.category === selectedMascotCategory).map((m) => {
                  const url = getDiceBearSvgUrl(m.style, m.seed);
                  const isSelected = (profile.avatarMascot || 'bot-spark') === m.id || profile.avatarUrl === url;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectAvatar(m.id, url, m.name)}
                      className={`group relative flex flex-col items-center p-1.5 rounded-[8px] border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#9ca3af] dark:border-[#52525b] bg-[#f4f5f6] dark:bg-[#27272a] shadow-2xs'
                          : 'border-[#e5e7eb] dark:border-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] bg-[#f9fafb] dark:bg-[#202024]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-[6px] overflow-hidden shrink-0">
                        <img
                          src={url}
                          alt={m.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <span className="text-[10px] text-[#6b7280] dark:text-[#a1a1aa] mt-1 truncate max-w-full font-medium">
                        {m.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Seed Input */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a custom seed (e.g. your nickname or keyword)..."
                  value={customSeedInput}
                  onChange={(e) => setCustomSeedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyCustomSeed(customSeedInput);
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomSeed(customSeedInput)}
                  disabled={!customSeedInput.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] bg-[#f9fafb] dark:bg-[#202024] text-[#374151] dark:text-[#d4d4d8] hover:text-[#111827] dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Apply Seed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Team & Cloud Database Identity */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Team &amp; Database Identity
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Database className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-[#111827] dark:text-[#f4f4f5]">
                    {workspace?.name || 'Workspace'}
                  </div>
                  <div className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] font-mono">
                    {supabaseUrl ? supabaseUrl.replace('https://', '') : 'Local SQLite / IndexedDB'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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

        {/* Work Status Section — hidden for now */}
        {/* <div className="space-y-1.5">
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
            <div className="flex flex-wrap gap-1.5">
              {STATUS_PRESETS.map((preset, idx) => {
                const isSelected = profile.statusIcon === preset.icon && profile.statusText === preset.text;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProfile({ ...profile, statusIcon: preset.icon, statusText: preset.text })}
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
        </div> */}

        {/* Security & Authentication Section — commented out for local-first desktop app */}
        {/* <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] px-1">
            Security & Authentication
          </div>
          <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] divide-y divide-[#f3f4f6] dark:divide-[#27272a] overflow-hidden text-xs">
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
        </div> */}

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

      {/* Password Reset Modal (Commented out) */}
      {/* {isPasswordModalOpen && (
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
      )} */}
    </div>
  );
};
