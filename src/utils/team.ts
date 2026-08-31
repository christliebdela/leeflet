import { TeamMember } from '../types';

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

export const getStoredTeamMembers = (workspaceId?: string): TeamMember[] => {
  if (typeof window === 'undefined') return [];

  // Read current profile data
  let profileName = 'Workspace Owner';
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
        // Sync owner entry with latest profile data
        const ownerEntry = unique.find((m: TeamMember) => m.role === 'Owner' || m.id === 'owner_1');
        if (ownerEntry) {
          if (profileName) ownerEntry.name = profileName;
          if (profileEmail) ownerEntry.email = profileEmail;
          if (profileMascot) ownerEntry.avatarMascot = profileMascot;
          if (profileAvatarUrl) ownerEntry.avatarUrl = profileAvatarUrl;
        }
        return unique;
      }
    }
  } catch {}

  // Fallback / Initial: current profile or workspace creator
  const initial: TeamMember[] = [
    {
      id: 'owner_1',
      name: profileName,
      email: profileEmail,
      role: 'Owner',
      status: 'active',
      joinedAt: 'Workspace Creator',
      avatarColor: 'bg-violet-600 dark:bg-violet-500',
      avatarMascot: profileMascot || undefined,
      avatarUrl: profileAvatarUrl || undefined,
    },
  ];
  return initial;
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
