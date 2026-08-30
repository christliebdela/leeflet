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
} from 'lucide-react';
import { useLeafStore } from '../store/useLeafStore';
import { toast } from '../store/useToastStore';

export type RoleId = 'Admin' | 'Developer' | 'Member' | 'Viewer';

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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | RoleId;
  status: 'active' | 'invited';
  joinedAt: string;
}

export const TeamView: React.FC = () => {
  const { workspace } = useLeafStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleId>('Developer');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'You',
      email: 'owner@workspace.local',
      role: 'Owner',
      status: 'active',
      joinedAt: 'Workspace Creator',
    },
  ]);

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

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newMember: TeamMember = {
        id: `member_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: inviteRole,
        status: 'invited',
        joinedAt: 'Invited just now',
      };

      setMembers((prev) => [...prev, newMember]);
      setInviteEmail('');
      setIsSubmitting(false);
      setIsInviteModalOpen(false);
      setIsRoleMenuOpen(false);
      toast.success(`Invitation sent to ${email} as ${inviteRole}`);
    }, 350);
  };

  const handleCopyInviteLink = () => {
    const mockLink = `https://leaf.app/join/${workspace?.id || 'ws'}_${Math.random().toString(36).substring(2, 7)}`;
    navigator.clipboard?.writeText(mockLink).then(() => {
      setHasCopiedLink(true);
      toast.info('Invite link copied to clipboard');
      setTimeout(() => setHasCopiedLink(false), 2000);
    }).catch(() => {
      toast.info('Invite link: ' + mockLink);
    });
  };

  const selectedRoleConfig = ROLES.find((r) => r.id === inviteRole) || ROLES[1];

  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-4 custom-scrollbar flex flex-col gap-4">
      {/* Centered Under Development Empty State Hero (Leaf Standard Design System) */}
      <div className="w-full flex flex-col items-center justify-center text-center p-8 sm:p-10 border border-dashed border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] bg-gradient-to-b from-transparent to-[#fafafa]/60 dark:to-[#18181b]/30">
        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] shadow-xs flex items-center justify-center mb-3">
          <Users className="w-6 h-6 text-[#6b7280] dark:text-[#a1a1aa]" />
        </div>
        <div className="text-[10px] font-mono text-[#9ca3af] dark:text-[#71717a] uppercase tracking-wider mb-1">
          Under Development
        </div>
        <h3 className="text-sm font-semibold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
          Team Collaboration
        </h3>
        <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] max-w-sm mt-1.5 leading-relaxed">
          Shared workspaces, role permissions, and live task syncing across team members are coming soon to Leaf.
        </p>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle shrink-0 whitespace-nowrap active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Workspace Members Section */}
      <div className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between">
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
                <div className="w-7 h-7 rounded-full bg-[#f3f4f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] flex items-center justify-center text-[10px] font-semibold text-[#4b5563] dark:text-[#d4d4d8] shrink-0">
                  {member.name.slice(0, 2).toUpperCase()}
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
    </div>
  );
};
