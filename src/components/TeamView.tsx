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
  MoreVertical,
  ShieldCheck,
  Shield,
  Trash2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useLeafStore } from '../store/useLeafStore';
import { toast } from '../store/useToastStore';
import { getStoredTeamMembers, saveStoredTeamMembers } from '../utils/team';
import { isSmtpConfigured, sendInviteEmail, generateInviteDeepLink } from '../utils/smtp';
import { resolveAvatarUrl } from '../utils/avatars';
import { TeamMember, RoleId, MemberStatus } from '../types';

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

  // Management State
  const [activeRoleMemberId, setActiveRoleMemberId] = useState<string | null>(null);
  const [activeActionsMemberId, setActiveActionsMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [members, setMembers] = useState<TeamMember[]>(() => getStoredTeamMembers(workspace?.id));

  // Reload team members whenever workspace changes
  useEffect(() => {
    setMembers(getStoredTeamMembers(workspace?.id));
    setActiveRoleMemberId(null);
    setActiveActionsMemberId(null);
  }, [workspace?.id]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (roleMenuRef.current && !roleMenuRef.current.contains(target)) {
        setIsRoleMenuOpen(false);
      }
      if (tableRef.current && !tableRef.current.contains(target)) {
        setActiveRoleMemberId(null);
        setActiveActionsMemberId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const persistMembers = (updated: TeamMember[]) => {
    setMembers(updated);
    saveStoredTeamMembers(updated, workspace?.id);
  };

  // Send Email Invite / Create Invite Record
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!workspace) {
      toast.error('No active workspace selected');
      return;
    }

    // Check if email already exists in workspace
    const existingMember = members.find(
      (m) => m.email && m.email.trim().toLowerCase() === email.toLowerCase()
    );
    if (existingMember) {
      if (existingMember.status === 'invited') {
        toast.error(`An invitation is already pending for ${email}`);
      } else {
        toast.error(`${email} is already an active member of this workspace (${existingMember.role})`);
      }
      return;
    }

    const roleConfig = ROLES.find((r) => r.id === inviteRole) || ROLES[1];

    if (!isSmtpConfigured()) {
      // Create pending invitation anyway and offer link copy
      const newMember: TeamMember = {
        id: `member_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: inviteRole,
        status: 'invited',
        joinedAt: 'Invited just now',
      };
      const updated = [...members, newMember];
      persistMembers(updated);
      setInviteEmail('');
      setIsInviteModalOpen(false);
      setIsRoleMenuOpen(false);

      setShowSmtpRequiredModal(true);
      return;
    }

    try {
      setIsSubmitting(true);
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
      persistMembers(updated);
      setInviteEmail('');
      setIsInviteModalOpen(false);
      setIsRoleMenuOpen(false);
      toast.success(`Invitation email sent to ${email} as ${inviteRole}`);
    } catch (err: any) {
      console.error('SMTP Invite Error:', err);
      toast.error(`Email send failed: ${err.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInviteLink = (targetRole: RoleId = inviteRole) => {
    if (!workspace) return;
    const dynamicLink = generateInviteDeepLink(workspace, targetRole);
    navigator.clipboard?.writeText(dynamicLink).then(() => {
      setHasCopiedLink(true);
      toast.success(`Invite link copied with ${targetRole} role permissions`);
      setTimeout(() => setHasCopiedLink(false), 2500);
    }).catch(() => {
      toast.info(`Invite link: ${dynamicLink}`);
    });
  };

  // Change Role
  const handleChangeRole = (memberId: string, newRole: RoleId) => {
    const target = members.find((m) => m.id === memberId);
    if (!target || target.role === 'Owner') return;

    const updated = members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m));
    persistMembers(updated);
    setActiveRoleMemberId(null);
    setActiveActionsMemberId(null);
    toast.success(`Updated ${target.name}'s role to ${newRole}`);
  };

  // Toggle Suspend / Active
  const handleToggleSuspend = (member: TeamMember) => {
    if (member.role === 'Owner') {
      toast.error('The workspace owner account cannot be suspended');
      return;
    }

    const newStatus: MemberStatus = member.status === 'suspended' ? 'active' : 'suspended';
    const updated = members.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m));
    persistMembers(updated);
    setActiveActionsMemberId(null);
    if (newStatus === 'suspended') {
      toast.info(`Suspended ${member.name}'s access`);
    } else {
      toast.success(`Reactivated ${member.name}'s access`);
    }
  };

  // Resend / Copy Link for Member
  const handleResendMemberInvite = async (member: TeamMember) => {
    if (!workspace) return;
    const roleId = (ROLES.some((r) => r.id === member.role) ? member.role : 'Developer') as RoleId;
    const dynamicLink = generateInviteDeepLink(workspace, roleId);
    
    // Copy link
    await navigator.clipboard?.writeText(dynamicLink);
    
    // Try sending email if SMTP is configured
    if (isSmtpConfigured() && member.email) {
      try {
        const roleConfig = ROLES.find((r) => r.id === roleId) || ROLES[1];
        await sendInviteEmail(member.email, member.name, workspace, roleId, roleConfig.description);
        toast.success(`Invitation re-sent to ${member.email}`);
      } catch (err: any) {
        toast.success(`Invite link copied to clipboard`);
      }
    } else {
      toast.success(`Invite link copied to clipboard`);
    }
    setActiveActionsMemberId(null);
  };

  // Confirm Remove / Revoke
  const handleConfirmRemove = () => {
    if (!memberToDelete || memberToDelete.role === 'Owner') return;
    const isInvite = memberToDelete.status === 'invited';
    const updated = members.filter((m) => m.id !== memberToDelete.id);
    persistMembers(updated);
    setMemberToDelete(null);
    setActiveActionsMemberId(null);
    if (isInvite) {
      toast.success(`Revoked invitation for ${memberToDelete.email}`);
    } else {
      toast.success(`Removed ${memberToDelete.name} from workspace`);
    }
  };

  const selectedRoleConfig = ROLES.find((r) => r.id === inviteRole) || ROLES[1];

  return (
    <div className="flex-1 h-full overflow-y-auto p-3 sm:p-4 custom-scrollbar flex flex-col gap-4">
      {/* Top Team Collaboration Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] bg-white dark:bg-[#18181b]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#f4f5f6] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5] tracking-tight">
              Team & Permissions
            </h3>
            <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 truncate">
              Manage member roles, permissions, pending invitations, and workspace access.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] text-[#374151] dark:text-[#f4f4f5] hover:bg-[#ebecee] dark:hover:bg-[#27272a] hover:border-[#d1d5db] dark:hover:border-[#3f3f46] rounded-[6px] text-xs font-medium transition-colors shrink-0 shadow-2xs active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Workspace Members Section */}
      <div
        ref={tableRef}
        className="border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] bg-white dark:bg-[#18181b] overflow-visible"
      >
        <div className="px-4 py-3 border-b border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
              Members & Invites
            </span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-[#f4f5f6] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa] font-medium">
              {members.length}
            </span>
          </div>
          <span className="text-[11px] text-[#9ca3af] dark:text-[#71717a]">
            {workspace?.name || 'Personal Workspace'}
          </span>
        </div>

        <div className="divide-y divide-[#f3f4f6] dark:divide-[#27272a]">
          {members.map((member) => {
            const isOwner = member.role === 'Owner' || member.id === 'owner_1';
            const isPending = member.status === 'invited';
            const isSuspended = member.status === 'suspended';
            const isRoleOpen = activeRoleMemberId === member.id;
            const isActionsOpen = activeActionsMemberId === member.id;

            return (
              <div
                key={member.id}
                className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-[#fafafa] dark:hover:bg-[#1c1c1f] transition-colors relative"
              >
                {/* Left: User Avatar & Info */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden relative">
                    <img
                      src={resolveAvatarUrl(
                        member.avatarMascot || member.avatarUrl || member.avatarColor,
                        member.name || member.id
                      )}
                      alt={member.name}
                      className={`w-full h-full object-cover ${isSuspended ? 'grayscale opacity-60' : ''}`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-medium truncate ${
                          isSuspended
                            ? 'line-through text-[#9ca3af] dark:text-[#71717a]'
                            : 'text-[#111827] dark:text-[#f4f4f5]'
                        }`}
                      >
                        {member.name}
                      </span>

                      {/* Status Badges */}
                      {isPending && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.2 rounded font-medium">
                          Pending Invite
                        </span>
                      )}
                      {isSuspended && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-1.5 py-0.2 rounded font-medium">
                          Suspended
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9ca3af] dark:text-[#71717a] truncate">
                      {member.email || 'No email provided'}
                    </div>
                  </div>
                </div>

                {/* Right: Role Picker & Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Role Selector */}
                  <div className="relative">
                    {isOwner ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 rounded-[5px] border border-violet-200 dark:border-violet-800/40 select-none">
                        <ShieldCheck className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                        <span>Owner</span>
                      </span>
                    ) : isPending ? (
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium text-[#6b7280] dark:text-[#a1a1aa] bg-[#f4f5f6] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[5px] opacity-75 select-none"
                        title="Role assigned in invitation (editable once member joins)"
                      >
                        <Shield className="w-3 h-3 text-[#9ca3af]" />
                        <span>{member.role}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveActionsMemberId(null);
                          setActiveRoleMemberId(isRoleOpen ? null : member.id);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium text-[#374151] dark:text-[#d4d4d8] bg-[#f4f5f6] dark:bg-[#202024] hover:bg-[#ebecee] dark:hover:bg-[#27272a] border border-[#e5e7eb] dark:border-[#323238] rounded-[5px] transition-colors cursor-pointer"
                        title="Click to change role"
                      >
                        <Shield className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                        <span>{member.role}</span>
                        <ChevronDown className="w-3 h-3 text-[#9ca3af]" />
                      </button>
                    )}

                    {/* Role Popover (Only for joined members) */}
                    {isRoleOpen && !isPending && !isOwner && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#323238] rounded-[8px] shadow-dropdown z-40 py-1 divide-y divide-[#f3f4f6] dark:divide-[#27272a] animate-in fade-in duration-100">
                        {ROLES.map((role) => (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleChangeRole(member.id, role.id)}
                            className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6] dark:hover:bg-[#202024] transition-colors flex items-start justify-between gap-2 group cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5] flex items-center justify-between">
                                <span>{role.name}</span>
                                {member.role === role.id && (
                                  <Check className="w-3.5 h-3.5 text-[#111827] dark:text-white" />
                                )}
                              </div>
                              <p className="text-[10.5px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5 leading-normal">
                                {role.shortDesc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Menu Trigger (Disabled for Owner) */}
                  {!isOwner && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRoleMemberId(null);
                          setActiveActionsMemberId(isActionsOpen ? null : member.id);
                        }}
                        className="p-1 rounded-[5px] text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white hover:bg-[#ebecee] dark:hover:bg-[#27272a] transition-colors cursor-pointer"
                        title="Member actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Actions Dropdown */}
                      {isActionsOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#323238] rounded-[8px] shadow-dropdown z-40 py-1 animate-in fade-in duration-100 text-xs">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleResendMemberInvite(member)}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#202024] flex items-center gap-2 text-[#374151] dark:text-[#d4d4d8] cursor-pointer"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                <span>Copy Invite Link</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResendMemberInvite(member)}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#202024] flex items-center gap-2 text-[#374151] dark:text-[#d4d4d8] cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Resend Invitation</span>
                              </button>
                              <div className="border-t border-[#f3f4f6] dark:border-[#27272a] my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionsMemberId(null);
                                  setMemberToDelete(member);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Revoke Invitation</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionsMemberId(null);
                                  setActiveRoleMemberId(member.id);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#202024] flex items-center gap-2 text-[#374151] dark:text-[#d4d4d8] cursor-pointer"
                              >
                                <Shield className="w-3.5 h-3.5" />
                                <span>Change Role</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(member)}
                                className={`w-full text-left px-3 py-1.5 hover:bg-[#f3f4f6] dark:hover:bg-[#202024] flex items-center gap-2 cursor-pointer ${
                                  isSuspended
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {isSuspended ? (
                                  <>
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>Reactivate Access</span>
                                  </>
                                ) : (
                                  <>
                                    <PauseCircle className="w-3.5 h-3.5" />
                                    <span>Suspend Access</span>
                                  </>
                                )}
                              </button>
                              <div className="border-t border-[#f3f4f6] dark:border-[#27272a] my-1" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveActionsMemberId(null);
                                  setMemberToDelete(member);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove from Workspace</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete / Revoke Confirmation Modal */}
      {memberToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMemberToDelete(null);
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] shadow-modal w-full max-w-sm p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
                  {memberToDelete.status === 'invited' ? 'Revoke Invitation' : 'Remove Member'}
                </h3>
                <p className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] mt-0.5">
                  {memberToDelete.status === 'invited'
                    ? `Revoke the pending invite for ${memberToDelete.email}?`
                    : `Remove ${memberToDelete.name} (${memberToDelete.email}) from ${workspace?.name || 'this workspace'}?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[6px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] transition-all shadow-subtle cursor-pointer active:scale-98"
              >
                {memberToDelete.status === 'invited' ? 'Revoke Invite' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="text-[#9ca3af] hover:text-[#111827] dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
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
                  className="w-full flex items-center justify-between px-3 py-2 text-xs bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#323238] rounded-[6px] text-[#111827] dark:text-white hover:border-[#9ca3af] dark:hover:border-[#52525b] transition-colors cursor-pointer"
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
                        className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6] dark:hover:bg-[#202024] transition-colors flex items-start justify-between gap-3 group cursor-pointer"
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
                  onClick={() => handleCopyInviteLink(inviteRole)}
                  className="text-xs font-medium text-[#111827] dark:text-white hover:underline transition-colors cursor-pointer"
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
                  className="px-3 py-1.5 text-xs font-medium text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[6px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50 active:scale-98 cursor-pointer"
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

      {/* SMTP Configuration Prompt Modal */}
      {showSmtpRequiredModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSmtpRequiredModal(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-[10px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5]">
                <Mail className="w-4 h-4 text-[#111827] dark:text-white" />
                <h2 className="text-xs font-semibold">Invitation Created & Ready</h2>
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
                The invitation has been registered to your workspace! Since custom SMTP is not yet configured, you can share the direct invite link with your colleague directly.
              </p>
              <div className="p-3 rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[11px] text-[#4b5563] dark:text-[#d4d4d8]">
                Recipients clicking this link will automatically join this workspace with the assigned <strong className="text-[#111827] dark:text-white">{inviteRole}</strong> permissions.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => {
                  setShowSmtpRequiredModal(false);
                  handleCopyInviteLink(inviteRole);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4b5563] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[6px] transition-colors cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Copy Invite Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSmtpRequiredModal(false);
                  setViewMode({ type: 'settings', tab: 'sync', section: 'smtp' });
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] transition-all shadow-subtle cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Setup SMTP in Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
