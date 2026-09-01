import { RoleId, Item } from '../types';

export interface UserPermissions {
  role: RoleId;
  isAdmin: boolean;
  isDeveloper: boolean;
  isMember: boolean;
  isViewer: boolean;

  // Workspace & Project Permissions
  canManageWorkspace: boolean;
  canManageProjects: boolean;
  canManageTeam: boolean;

  // Item Permissions
  canCreateItems: boolean;
  canEditItem: (item?: Item | null) => boolean;
  canDeleteItem: (item?: Item | null) => boolean;
  canMoveItemStatus: (item?: Item | null) => boolean;
  canEditChecklist: boolean;
}

export function getUserPermissions(workspaceId?: string): UserPermissions {
  if (!workspaceId) {
    return createFullAdminPermissions('Admin');
  }

  const isJoined = localStorage.getItem(`leeflet_is_joined_workspace_${workspaceId}`) === 'true';
  const rawRole = localStorage.getItem(`leeflet_workspace_role_${workspaceId}`);

  let role: RoleId = 'Admin';
  if (isJoined) {
    if (rawRole) {
      const normalized = rawRole.trim().toLowerCase();
      if (normalized === 'admin' || normalized === 'owner') role = 'Admin';
      else if (normalized === 'developer') role = 'Developer';
      else if (normalized === 'member') role = 'Member';
      else if (normalized === 'viewer') role = 'Viewer';
      else role = 'Developer';
    } else {
      role = 'Member';
    }
  }

  const isAdmin = role === 'Admin';
  const isDeveloper = role === 'Developer';
  const isMember = role === 'Member';
  const isViewer = role === 'Viewer';

  return {
    role,
    isAdmin,
    isDeveloper,
    isMember,
    isViewer,

    canManageWorkspace: isAdmin,
    canManageProjects: isAdmin,
    canManageTeam: isAdmin,

    canCreateItems: !isViewer,

    canEditItem: () => {
      if (isViewer) return false;
      return true; // Admin, Developer, Member can edit items
    },

    canDeleteItem: () => {
      if (isViewer) return false;
      if (isMember) return false; // Members cannot delete items, only Admins & Developers can
      return true;
    },

    canMoveItemStatus: () => {
      if (isViewer) return false;
      return true;
    },

    canEditChecklist: !isViewer,
  };
}

function createFullAdminPermissions(role: RoleId = 'Admin'): UserPermissions {
  return {
    role,
    isAdmin: true,
    isDeveloper: false,
    isMember: false,
    isViewer: false,
    canManageWorkspace: true,
    canManageProjects: true,
    canManageTeam: true,
    canCreateItems: true,
    canEditItem: () => true,
    canDeleteItem: () => true,
    canMoveItemStatus: () => true,
    canEditChecklist: true,
  };
}
