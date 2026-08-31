import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  X,
  RefreshCw,
  ChevronDown,
  Check,
  Link2,
  Settings,
} from 'lucide-react';
import { useLeafStore } from '../store/useLeafStore';
import { toast } from '../store/useToastStore';
import { getStoredTeamMembers, saveStoredTeamMembers } from '../utils/team';
import { isSmtpConfigured, sendInviteEmail, generateInviteDeepLink } from '../utils/smtp';
import { resolveAvatarUrl } from '../utils/avatars';
import { TeamMember, RoleId } from '../types';

interface RoleConfig {
  id: RoleId;
  name: string;
  shortDesc: string;
  description: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'Admin',
    name: 'Admin',
    shortDesc: 'Full workspace access',
    description: 'Can manage workspace settings, projects, integrations, and all members.',
  },
  {
    id: 'Developer',
    name: 'Developer',
    shortDesc: 'Core contributor',
    description: 'Can create, edit, delete, and resolve items across all projects and queues.',
  },
  {
    id: 'Member',
    name: 'Member',
    shortDesc: 'Standard access',
    description: 'Can create tasks, update assigned items, and contribute to projects.',
  },
  {
    id: 'Viewer',
    name: 'Viewer',
    shortDesc: 'Read-only',
    description: 'Can view workspace tasks and track progress without edit permissions.',
  },
];

export const TeamView: React.FC = () => {
  const { workspace, setViewMode } = useLeafStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showSmtpRequiredModal, setShowSmtpRequiredModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleId>('Developer');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<TeamMember[]>(() => getStoredTeamMembers());

  // Click outside to close role dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    if (isRoleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isRoleMenuOpen]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!isSmtpConfigured()) {
      setShowSmtpRequiredModal(true);
      return;
    }

    if (!workspace) {
      toast.error('No active workspace selected');
      return;
    }

    try {
      setIsSubmitting(true);
      const roleConfig = ROLES.find((r) => r.id === inviteRole) || ROLES[1];
      await sendInviteEmail(
        email,
        email.split('@')[0],
        workspace,
        inviteRole,
        roleConfig.description
      );

      const newMember: TeamMember = {
        id: `member_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: inviteRole,
        status: 'invited',
        joinedAt: 'Invited just now',
      };

      const updated = [...members, newMember];
      setMembers(updated);
      saveStoredTeamMembers(updated);
      setInviteEmail('');
      setIsInviteModalOpen(false);
      setIsRoleMenuOpen(false);
      toast.success(`Invitation email delivered to ${email} as ${inviteRole}`);
    } catch (err: any) {
      console.error('SMTP Invite Error:', err);
      toast.error(`Email send failed: ${err.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!workspace) return;
    const dynamicLink = generateInviteDeepLink(workspace, inviteRole);
    navigator.clipboard?.writeText(dynamicLink).then(() => {
      setHasCopiedLink(true);
      toast.success(`Invite link copied with ${inviteRole} role permissions`);
      setTimeout(() => setHasCopiedLink(false), 2500);
    }).catch(() => {
      toast.info(`Invite link: ${dynamicLink}`);
    });
  };

  const selectedRoleConfig = ROLES.find((r) => r.id === inviteRole) || ROLES[1];

  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-4 custom-scrollbar flex flex-col gap-4">
      {/* Compact Team Collaboration Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#f4f5f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
                  Team Collaboration
                </h3>
                <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a] bg-[#f4f5f6] dark:bg-[#202024] px-1.5 py-0.5 rounded border border-[#e5e7eb] dark:border-[#27272a]">
                  Preview
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 truncate">
                Shared workspaces, role permissions, and live syncing are in active development.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] text-[#374151] dark:text-[#f4f4f5] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] rounded-[6px] text-xs font-medium transition-colors shrink-0 shadow-2xs active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
            <span>Invite Member</span>
          </button>
        </div>

        {/* Workspace Members Section */}
        <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
              Members ({members.length})
            </span>
            <span className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
              {workspace?.name || 'Personal Workspace'}
            </span>
          </div>

        <div className="divide-y divide-[#f3f4f6] dark:divide-[#27272a]">
          {members.map((member) => (
            <div
              key={member.id}
              className="px-3.5 py-2.5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#f3f4f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                  <img
                    src={resolveAvatarUrl(member.avatarMascot || member.avatarUrl || member.avatarColor, member.name || member.id)}
                    alt={member.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#111827] dark:text-[#f4f4f5] truncate">
                      {member.name}
                    </span>
                    {member.status === 'invited' && (
                      <span className="text-[10px] text-[#9ca3af] dark:text-[#71717a] font-normal">
                        (Pending)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a] truncate">
                    {member.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                  {member.role}
                </span>
                <span className="text-[11px] text-[#9ca3af] dark:text-[#71717a] hidden sm:inline">
                  {member.joinedAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linear-Grade Invite Member Modal */}
      {isInviteModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsInviteModalOpen(false);
              setIsRoleMenuOpen(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <div
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (isRoleMenuOpen) {
                  setIsRoleMenuOpen(false);
                } else {
                  setIsInviteModalOpen(false);
                }
              }
            }}
            className="bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] shadow-modal w-full max-w-md p-5 select-none animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f3f4f6] dark:border-[#27272a]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                <h3 className="text-sm font-semibold text-[#111827] dark:text-[#f4f4f5]">
                  Invite to Workspace
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setIsRoleMenuOpen(false);
                }}
                className="text-[#9ca3af] hover:text-[#111827] dark:hover:text-white p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-medium text-[#6b7280] dark:text-[#a1a1aa] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    autoFocus
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] text-[#111827] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                  />
                </div>
              </div>

              {/* Linear-style Role Dropdown */}
              <div className="relative" ref={roleMenuRef}>
                <label className="block text-[11px] font-medium text-[#6b7280] dark:text-[#a1a1aa] mb-1.5">
                  Role & permissions
                </label>
                <button
                  type="button"
                  onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] text-[#111827] dark:text-white hover:border-[#9ca3af] dark:hover:border-[#52525b] transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-[#111827] dark:text-white">
                      {selectedRoleConfig.name}
                    </span>
                    <span className="text-[#9ca3af] dark:text-[#71717a] text-[11px] truncate">
                      — {selectedRoleConfig.shortDesc}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#9ca3af] shrink-0 transition-transform duration-150 ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isRoleMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#323238] rounded-[8px] shadow-dropdown z-30 py-1 divide-y divide-[#f3f4f6] dark:divide-[#27272a] animate-in fade-in duration-100">
                    {ROLES.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setInviteRole(role.id);
                          setIsRoleMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6] dark:hover:bg-[#202024] transition-colors flex items-start justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
                            {role.name}
                          </div>
                          <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 leading-normal">
                            {role.description}
                          </p>
                        </div>
                        {inviteRole === role.id && (
                          <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Share Invite Link (Linear Style) */}
              <div className="pt-2 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Share invite link</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="text-xs font-medium text-[#111827] dark:text-white hover:underline transition-colors"
                >
                  {hasCopiedLink ? 'Copied link!' : 'Copy link'}
                </button>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setIsRoleMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[6px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50 active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMTP Required Prompt Modal */}
      {showSmtpRequiredModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSmtpRequiredModal(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-[10px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5]">
                <Mail className="w-4 h-4 text-[#111827] dark:text-white" />
                <h2 className="text-xs font-semibold">SMTP Configuration Required</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSmtpRequiredModal(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed">
                To dispatch automated email invitations directly from your desktop app, configure your outbound SMTP mail server in Settings.
              </p>
              <div className="p-3 rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[11px] text-[#4b5563] dark:text-[#d4d4d8]">
                You can also copy a direct invite link with the assigned role embedded to share with your teammate immediately.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => {
                  setShowSmtpRequiredModal(false);
                  handleCopyInviteLink();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4b5563] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[6px] transition-colors cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Copy Link Instead</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSmtpRequiredModal(false);
                  setIsInviteModalOpen(false);
                  setViewMode({ type: 'settings', tab: 'sync', section: 'smtp' });
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure SMTP in Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
