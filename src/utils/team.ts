import { TeamMember, RoleId } from '../types';
import { resolveAvatarUrl } from './avatars';

const STORAGE_KEY = 'leeflet_team_members';

const AVATAR_COLORS = [
  'bg-emerald-600 dark:bg-emerald-500',
  'bg-blue-600 dark:bg-blue-500',
  'bg-violet-600 dark:bg-violet-500',
  'bg-amber-600 dark:bg-amber-500',
  'bg-rose-600 dark:bg-rose-500',
  'bg-indigo-600 dark:bg-indigo-500',
  'bg-teal-600 dark:bg-teal-500',
];

export const getMemberColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const OWNER_MEMBER_UUID = '00000000-0000-4000-8000-000000000001';

export const normalizeAssigneeId = (id: string | null | undefined): string | null => {
  if (!id) return null;
  if (id === 'owner_1' || id === OWNER_MEMBER_UUID) return OWNER_MEMBER_UUID;
  return id;
};

export const matchesAssignee = (memberId: string, assigneeId: string | null | undefined): boolean => {
  if (!assigneeId) return false;
  if (memberId === assigneeId) return true;
  if (
    (memberId === 'owner_1' || memberId === OWNER_MEMBER_UUID) &&
    (assigneeId === 'owner_1' || assigneeId === OWNER_MEMBER_UUID)
  ) {
    return true;
  }
  return false;
};

const isSameUser = (nameA: string, nameB: string, emailA?: string, emailB?: string): boolean => {
  const normA = (nameA || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normB = (nameB || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (emailA && emailB && emailA.toLowerCase().trim() === emailB.toLowerCase().trim() && emailA.trim().length > 0) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;
  if (Math.abs(normA.length - normB.length) <= 3) {
    let diff = 0;
    const minLen = Math.min(normA.length, normB.length);
    for (let i = 0; i < minLen; i++) {
      if (normA[i] !== normB[i]) diff++;
    }
    if (diff <= 3) return true;
  }
  return false;
};

export const getStoredTeamMembers = (workspaceId?: string): TeamMember[] => {
  if (typeof window === 'undefined') return [];

  // Read current profile data
  let profileName = 'Workspace Admin';
  let profileEmail = '';
  let profileMascot = '';
  let profileAvatarUrl = '';
  try {
    const pRaw =
      localStorage.getItem('leeflet_user_profile_data') ||
      localStorage.getItem('leaf_user_profile_data');
    if (pRaw) {
      const p = JSON.parse(pRaw);
      if (p.fullName) profileName = p.fullName;
      if (p.email) profileEmail = p.email;
      if (p.avatarMascot) profileMascot = p.avatarMascot;
      if (p.avatarUrl) profileAvatarUrl = p.avatarUrl;
    }
  } catch {}

  const key = workspaceId ? `${STORAGE_KEY}_${workspaceId}` : STORAGE_KEY;
  const isJoined = workspaceId ? localStorage.getItem(`leeflet_is_joined_workspace_${workspaceId}`) === 'true' : false;
  const myRole = workspaceId ? (localStorage.getItem(`leeflet_workspace_role_${workspaceId}`) as RoleId) || 'Member' : 'Admin';

  try {
    let raw = localStorage.getItem(key);
    // Fallback to legacy global key if workspace key is empty
    if (!raw && workspaceId) {
      raw = localStorage.getItem(STORAGE_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Deduplicate by id, keep unique entries only
        const seen = new Set<string>();
        const unique = parsed.filter((m: TeamMember) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        // Migrate any legacy 'Owner' role to 'Admin'
        unique.forEach((m: TeamMember) => {
          if (m.role === 'Owner') m.role = 'Admin';
        });

        // If this is the creator's workspace, sync Admin entry with latest profile data & remove duplicate self-entries
        if (!isJoined) {
          const adminEntry = unique.find(
            (m: TeamMember) => m.role === 'Admin' || m.id === 'owner_1' || m.id === OWNER_MEMBER_UUID
          );
          if (adminEntry) {
            adminEntry.id = OWNER_MEMBER_UUID;
            adminEntry.role = 'Admin';
            if (profileName) adminEntry.name = profileName;
            if (profileEmail) adminEntry.email = profileEmail;
            if (profileMascot) adminEntry.avatarMascot = profileMascot;
            if (profileAvatarUrl) adminEntry.avatarUrl = profileAvatarUrl;
          }

          // Filter out duplicate entries that match the admin creator
          const cleaned = unique.filter((m: TeamMember) => {
            if (m.id === OWNER_MEMBER_UUID || m.role === 'Admin') return true;
            if (isSameUser(profileName, m.name, profileEmail, m.email)) return false;
            return true;
          });

          if (cleaned.length !== unique.length) {
            saveStoredTeamMembers(cleaned, workspaceId);
          }

          return cleaned;
        }

        return unique;
      }
    }
  } catch {}

  // Fallback / Initial
  if (isJoined) {
    const initial: TeamMember[] = [
      {
        id: OWNER_MEMBER_UUID,
        name: 'Workspace Admin',
        email: '',
        role: 'Admin',
        status: 'active',
        joinedAt: 'Workspace Creator',
        avatarColor: 'bg-violet-600 dark:bg-violet-500',
      },
      {
        id: crypto.randomUUID(),
        name: profileName || 'Member',
        email: profileEmail,
        role: myRole || 'Developer',
        status: 'active',
        joinedAt: 'Joined just now',
        avatarColor: 'bg-blue-600 dark:bg-blue-500',
        avatarMascot: profileMascot || undefined,
        avatarUrl: profileAvatarUrl || undefined,
      },
    ];
    return initial;
  }

  const initial: TeamMember[] = [
    {
      id: OWNER_MEMBER_UUID,
      name: profileName,
      email: profileEmail,
      role: 'Admin',
      status: 'active',
      joinedAt: 'Workspace Creator',
      avatarColor: 'bg-violet-600 dark:bg-violet-500',
      avatarMascot: profileMascot || undefined,
      avatarUrl: profileAvatarUrl || undefined,
    },
  ];
  return initial;
};

export const getActiveTeamMembers = (workspaceId?: string): TeamMember[] => {
  return getStoredTeamMembers(workspaceId).filter(
    (m) => m.status === 'active' || (!m.status && m.role === 'Admin') || m.id === OWNER_MEMBER_UUID
  );
};

export const saveStoredTeamMembers = (members: TeamMember[], workspaceId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const key = workspaceId ? `${STORAGE_KEY}_${workspaceId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(members));
  } catch {}
};

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const resolveAssignee = (
  assigneeId: string | null | undefined,
  workspaceId?: string
): { name: string; avatarUrl: string } | null => {
  if (!assigneeId) return null;

  const members = getStoredTeamMembers(workspaceId);
  const assignedMember = members.find((m) => matchesAssignee(m.id, assigneeId));

  let name = assignedMember?.name;
  let avatarVal =
    assignedMember?.avatarMascot ||
    assignedMember?.avatarUrl ||
    assignedMember?.avatarColor;

  if (!name || name === OWNER_MEMBER_UUID || name === 'owner_1') {
    if (matchesAssignee(OWNER_MEMBER_UUID, assigneeId)) {
      try {
        const pRaw =
          localStorage.getItem('leeflet_user_profile_data') ||
          localStorage.getItem('leaf_user_profile_data');
        if (pRaw) {
          const p = JSON.parse(pRaw);
          if (p.fullName) name = p.fullName;
          if (!avatarVal) {
            avatarVal = p.avatarMascot || p.avatarUrl || p.avatarColor;
          }
        }
      } catch {}
      if (!name) name = 'Workspace Admin';
    } else {
      name = assigneeId;
    }
  }

  const avatarUrl = resolveAvatarUrl(avatarVal, name);
  return { name, avatarUrl };
};
