import { Workspace, Project, Item, ChecklistItem, Attachment, TeamMember, RoleId, MemberStatus } from '../types';
import { normalizeAssigneeId, getStoredTeamMembers, saveStoredTeamMembers } from '../utils/team';

export interface CloudCredentials {
  url: string;
  anonKey: string;
}

export function getCloudCredentials(workspaceId: string): CloudCredentials | null {
  try {
    const isCloud = localStorage.getItem(`leeflet_sync_mode_${workspaceId}`) === 'cloud';
    const url = (localStorage.getItem(`leeflet_supabase_url_${workspaceId}`) || '').trim().replace(/\/$/, '');
    const anonKey = (localStorage.getItem(`leeflet_supabase_anon_key_${workspaceId}`) || '').trim();
    if (url && anonKey && isCloud !== false) {
      return { url, anonKey };
    }
  } catch {
    // Storage access error
  }
  return null;
}

function getAuthHeaders(creds: CloudCredentials): Record<string, string> {
  const isJwt = creds.anonKey.includes('.') && creds.anonKey.split('.').length === 3;
  const headers: Record<string, string> = {
    apikey: creds.anonKey,
    'Content-Type': 'application/json',
  };
  if (isJwt) {
    headers['Authorization'] = `Bearer ${creds.anonKey}`;
  }
  return headers;
}

const isValidUuid = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};



export async function pushWorkspaceToCloud(ws: Workspace): Promise<void> {
  const creds = getCloudCredentials(ws.id);
  if (!creds || !isValidUuid(ws.id)) return;

  try {
    await fetch(`${creds.url}/rest/v1/workspaces`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(creds),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([
        {
          id: ws.id,
          name: ws.name,
          created_at: ws.createdAt || new Date().toISOString(),
          updated_at: ws.updatedAt || new Date().toISOString(),
        },
      ]),
    });
  } catch {
    // swallowed
  }
}

// ─── Project Cloud Sync ─────────────────────────────────────────────────────

export async function pushProjectToCloud(wsId: string, project: Project): Promise<void> {
  const creds = getCloudCredentials(wsId);
  if (!creds || !isValidUuid(wsId) || !isValidUuid(project.id)) return;

  const updatedAt = project.updatedAt || new Date().toISOString();
  const body = {
    id: project.id,
    workspace_id: wsId,
    name: project.name,
    description: project.description || '',
    color: project.color || '#10b981',
    icon: project.icon || null,
    is_archived: Boolean(project.isArchived),
    created_at: project.createdAt || new Date().toISOString(),
    updated_at: updatedAt,
  };

  try {
    await pushWorkspaceStubIfNeeded(creds, wsId);

    // 1. Try INSERT (no-op if already exists)
    await fetch(`${creds.url}/rest/v1/projects`, {
      method: 'POST',
      headers: { ...getAuthHeaders(creds), Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify([body]),
    });

    // 2. PATCH only if our updated_at is strictly newer than what's in the cloud
    await fetch(
      `${creds.url}/rest/v1/projects?id=eq.${project.id}&updated_at=lt.${encodeURIComponent(updatedAt)}`,
      {
        method: 'PATCH',
        headers: { ...getAuthHeaders(creds), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  } catch {
    // swallowed
  }
}

export async function deleteProjectFromCloud(wsId: string, projectId: string): Promise<void> {
  const creds = getCloudCredentials(wsId);
  if (!creds || !isValidUuid(projectId)) return;

  try {
    await fetch(`${creds.url}/rest/v1/projects?id=eq.${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(creds),
    });
  } catch {
    // swallowed
  }
}

// ─── Item Cloud Sync ────────────────────────────────────────────────────────

export async function pushItemToCloud(wsId: string, item: Item): Promise<void> {
  const creds = getCloudCredentials(wsId);
  if (!creds || !isValidUuid(wsId) || !isValidUuid(item.id)) return;

  const updatedAt = item.updatedAt || new Date().toISOString();
  const project_id = item.projectId && isValidUuid(item.projectId) ? item.projectId : null;
  const normalizedAssignee = normalizeAssigneeId(item.assigneeId);
  const assignee_id = normalizedAssignee && isValidUuid(normalizedAssignee) ? normalizedAssignee : null;

  const body = {
    id: item.id,
    workspace_id: wsId,
    project_id,
    title: item.title,
    content: item.content || '',
    type: item.type || 'task',
    status: item.status || 'inbox',
    priority: item.priority || 'none',
    tags: item.tags || [],
    assignee_id,
    is_pinned: Boolean((item as any).isPinned),
    due_at: item.dueAt || null,
    completed_at: item.completedAt || null,
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: updatedAt,
  };

  try {
    await pushWorkspaceStubIfNeeded(creds, wsId);

    // 1. INSERT — creates the record if it doesn't exist yet; silently no-ops if it does
    await fetch(`${creds.url}/rest/v1/items`, {
      method: 'POST',
      headers: { ...getAuthHeaders(creds), Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify([body]),
    });

    // 2. PATCH — only overwrites if our updated_at is strictly newer than the cloud record
    //    If updated_at=lt.{ours} doesn't match (cloud is newer), 0 rows updated — stale write dropped.
    const patchRes = await fetch(
      `${creds.url}/rest/v1/items?id=eq.${item.id}&updated_at=lt.${encodeURIComponent(updatedAt)}`,
      {
        method: 'PATCH',
        headers: { ...getAuthHeaders(creds), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!patchRes.ok) return;

    // Push checklist items if present
    if (item.checklist && item.checklist.length > 0) {
      const validChecklists = item.checklist
        .filter((c) => isValidUuid(c.id))
        .map((c) => ({
          id: c.id,
          item_id: item.id,
          title: c.title,
          is_completed: Boolean(c.isCompleted),
          sort_order: c.position ?? 0,
        }));

      if (validChecklists.length > 0) {
        // INSERT new checklist items
        await fetch(`${creds.url}/rest/v1/checklist_items`, {
          method: 'POST',
          headers: { ...getAuthHeaders(creds), Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify(validChecklists),
        });
        // PATCH existing checklist items (no timestamp guard needed — item-level guard above is sufficient)
        for (const c of validChecklists) {
          await fetch(`${creds.url}/rest/v1/checklist_items?id=eq.${c.id}`, {
            method: 'PATCH',
            headers: { ...getAuthHeaders(creds), 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: c.title, is_completed: c.is_completed, sort_order: c.sort_order }),
          });
        }
      }
    }

    // Push attachments if present
    if (item.attachments && item.attachments.length > 0) {
      const validAttachments = item.attachments
        .filter((a) => isValidUuid(a.id))
        .map((a) => ({
          id: a.id,
          item_id: item.id,
          file_name: a.fileName,
          file_path: a.filePath,
          file_size: Number(a.fileSize || 0),
          mime_type: a.mimeType || 'application/octet-stream',
          created_at: a.createdAt || new Date().toISOString(),
        }));

      if (validAttachments.length > 0) {
        await fetch(`${creds.url}/rest/v1/attachments`, {
          method: 'POST',
          headers: { ...getAuthHeaders(creds), Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify(validAttachments),
        });
      }
    }
  } catch {
    // swallowed
  }
}

export async function deleteItemFromCloud(wsId: string, itemId: string): Promise<void> {
  const creds = getCloudCredentials(wsId);
  if (!creds || !isValidUuid(itemId)) return;

  try {
    await fetch(`${creds.url}/rest/v1/items?id=eq.${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(creds),
    });
  } catch {
    // swallowed
  }
}

// ─── Full Bidirectional Cloud Sync ──────────────────────────────────────────

export async function syncWorkspaceWithCloud(
  ws: Workspace,
  localProjects: Project[],
  localItems: Item[]
): Promise<{ projects: Project[]; items: Item[]; synced: boolean }> {
  const creds = getCloudCredentials(ws.id);
  if (!creds || !isValidUuid(ws.id)) {
    return { projects: localProjects, items: localItems, synced: false };
  }

  try {
    // 1. Ensure Workspace exists in Cloud
    await pushWorkspaceToCloud(ws);

    // 2. Fetch remote projects
    const projRes = await fetch(`${creds.url}/rest/v1/projects?workspace_id=eq.${ws.id}&select=*`, {
      method: 'GET',
      headers: getAuthHeaders(creds),
    });

    let remoteProjects: any[] = [];
    if (projRes.ok) {
      remoteProjects = await projRes.json();
    }

    // 3. Fetch remote items with checklist items and attachments
    const itemsRes = await fetch(
      `${creds.url}/rest/v1/items?workspace_id=eq.${ws.id}&select=*,checklist_items(*),attachments(*)`,
      {
        method: 'GET',
        headers: getAuthHeaders(creds),
      }
    );

    let remoteItems: any[] = [];
    if (itemsRes.ok) {
      remoteItems = await itemsRes.json();
    }

    // 4. Merge Projects
    const projectMap = new Map<string, Project>();
    // Local projects first
    for (const p of localProjects) {
      projectMap.set(p.id, p);
    }
    // Merge or add remote projects
    for (const rp of remoteProjects) {
      const existing = projectMap.get(rp.id);
      const remoteP: Project = {
        id: rp.id,
        name: rp.name,
        description: rp.description || '',
        color: rp.color || '#10b981',
        icon: rp.icon || undefined,
        isArchived: Boolean(rp.is_archived),
        createdAt: rp.created_at || new Date().toISOString(),
        updatedAt: rp.updated_at || new Date().toISOString(),
      };

      if (!existing || new Date(remoteP.updatedAt) >= new Date(existing.updatedAt)) {
        projectMap.set(rp.id, remoteP);
      }
    }
    const mergedProjects = Array.from(projectMap.values());

    // Push any local projects that were not in remote
    const remoteProjIds = new Set(remoteProjects.map((p) => p.id));
    for (const p of localProjects) {
      if (!remoteProjIds.has(p.id) && isValidUuid(p.id)) {
        await pushProjectToCloud(ws.id, p);
      }
    }

    // 5. Merge Items
    const itemMap = new Map<string, Item>();
    for (const item of localItems) {
      itemMap.set(item.id, item);
    }

    for (const ri of remoteItems) {
      const existing = itemMap.get(ri.id);
      const checklist: ChecklistItem[] = Array.isArray(ri.checklist_items)
        ? ri.checklist_items.map((c: any) => ({
            id: c.id,
            itemId: ri.id,
            title: c.title,
            isCompleted: Boolean(c.is_completed),
            position: c.sort_order ?? 0,
          }))
        : [];

      const attachments: Attachment[] =
        Array.isArray(ri.attachments) && ri.attachments.length > 0
          ? ri.attachments.map((a: any) => ({
              id: a.id,
              itemId: ri.id,
              fileName: a.file_name,
              filePath: a.file_path,
              fileSize: Number(a.file_size || 0),
              mimeType: a.mime_type || 'application/octet-stream',
              createdAt: a.created_at || new Date().toISOString(),
            }))
          : existing?.attachments || [];

      const remoteItem: Item = {
        id: ri.id,
        projectId: ri.project_id || '',
        title: ri.title,
        content: ri.content || '',
        type: ri.type || 'task',
        status: ri.status || 'inbox',
        priority: ri.priority || 'none',
        tags: Array.isArray(ri.tags) ? ri.tags : [],
        checklist,
        attachments,
        dueAt: ri.due_at || null,
        completedAt: ri.completed_at || null,
        assigneeId: ri.assignee_id || existing?.assigneeId || null,
        createdAt: ri.created_at || new Date().toISOString(),
        updatedAt: ri.updated_at || new Date().toISOString(),
      };

      if (!existing || new Date(remoteItem.updatedAt) >= new Date(existing.updatedAt)) {
        itemMap.set(ri.id, remoteItem);
      }
    }
    const mergedItems = Array.from(itemMap.values());

    // Push any local items that were not yet in remote
    const remoteItemIds = new Set(remoteItems.map((i) => i.id));
    for (const item of localItems) {
      if (!remoteItemIds.has(item.id) && isValidUuid(item.id)) {
        await pushItemToCloud(ws.id, item);
      }
    }

    // 6. Merge Team Members
    try {
      const localMembers = getStoredTeamMembers(ws.id);
      const remoteMembers = await pullTeamMembersFromCloud(ws.id);
      
      const memberMap = new Map<string, TeamMember>();
      for (const m of localMembers) {
        const key = (m.email || m.name).toLowerCase();
        memberMap.set(key, m);
      }

      for (const rm of remoteMembers) {
        const key = (rm.email || rm.name).toLowerCase();
        const existing = memberMap.get(key);
        if (!existing) {
          memberMap.set(key, rm);
        } else {
          // If remote has active status, prefer active over invited
          if (rm.status === 'active' && existing.status === 'invited') {
            memberMap.set(key, { ...existing, status: 'active', role: rm.role });
          }
        }
      }

      const mergedMembers = Array.from(memberMap.values());
      saveStoredTeamMembers(mergedMembers, ws.id);

      // Push any active local members that were missing in remote
      const remoteKeys = new Set(remoteMembers.map((m) => (m.email || m.name).toLowerCase()));
      for (const lm of localMembers) {
        const key = (lm.email || lm.name).toLowerCase();
        if (!remoteKeys.has(key) && lm.status === 'active') {
          await pushTeamMemberToCloud(ws.id, lm);
        }
      }
    } catch {
      // member sync error ignored
    }

    return {
      projects: mergedProjects,
      items: mergedItems,
      synced: true,
    };
  } catch {
    return { projects: localProjects, items: localItems, synced: false };
  }
}

// ─── Team Members Cloud Sync ────────────────────────────────────────────────

export async function pushTeamMemberToCloud(wsId: string, member: TeamMember): Promise<void> {
  const creds = getCloudCredentials(wsId);
  if (!creds || !isValidUuid(wsId)) return;

  const roleStr = (member.role || 'developer').toLowerCase();
  const dbRole = (roleStr === 'admin' || roleStr === 'owner') ? 'admin' : (roleStr === 'viewer' ? 'viewer' : 'developer');
  const email = (member.email || `${member.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@leeflet.local`).trim().toLowerCase();

  const body: any = {
    workspace_id: wsId,
    email,
    display_name: member.name || email.split('@')[0] || 'Member',
    role: dbRole,
    status: member.status || 'active',
    avatar_color: member.avatarColor || 'bg-violet-600',
    joined_at: new Date().toISOString(),
  };

  if (isValidUuid(member.id) && member.id !== '00000000-0000-4000-8000-000000000001') {
    body.id = member.id;
  }

  try {
    await pushWorkspaceStubIfNeeded(creds, wsId);
    const res = await fetch(`${creds.url}/rest/v1/workspace_members?on_conflict=workspace_id,email`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(creds),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([body]),
    });
    if (!res.ok) {
      console.warn('Failed to push team member to cloud:', await res.text());
    }
  } catch (err) {
    console.warn('Error pushing team member to cloud:', err);
  }
}

export async function deleteTeamMemberFromCloud(wsId: string, memberId: string): Promise<void> {
  const creds = getCloudCredentials(wsId);
  if (!creds || !isValidUuid(wsId)) return;

  try {
    await fetch(`${creds.url}/rest/v1/workspace_members?workspace_id=eq.${wsId}&id=eq.${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(creds),
    });
  } catch {
    // swallowed
  }
}

export async function pullTeamMembersFromCloud(wsId: string): Promise<TeamMember[]> {
  const creds = getCloudCredentials(wsId);
  if (!creds || !isValidUuid(wsId)) return [];

  try {
    const res = await fetch(
      `${creds.url}/rest/v1/workspace_members?workspace_id=eq.${wsId}&select=*`,
      { headers: getAuthHeaders(creds) }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    return rows.map((r: any) => {
      const rawRole = (r.role || 'developer').toLowerCase();
      let role: RoleId = 'Developer';
      if (rawRole === 'admin' || rawRole === 'owner') role = 'Admin';
      else if (rawRole === 'designer') role = 'Designer';
      else if (rawRole === 'product manager' || rawRole === 'product_manager') role = 'Product Manager';
      else if (rawRole === 'qa engineer' || rawRole === 'qa_engineer') role = 'QA Engineer';
      else if (rawRole === 'member') role = 'Member';
      else if (rawRole === 'viewer') role = 'Viewer';

      return {
        id: r.id,
        name: r.display_name || r.email?.split('@')[0] || 'Member',
        email: r.email || '',
        role,
        status: (r.status || 'active') as MemberStatus,
        joinedAt: r.joined_at ? new Date(r.joined_at).toLocaleDateString() : undefined,
        avatarColor: r.avatar_color || 'bg-violet-600',
      };
    });
  } catch {
    return [];
  }
}

async function pushWorkspaceStubIfNeeded(creds: CloudCredentials, wsId: string): Promise<void> {
  try {
    await fetch(`${creds.url}/rest/v1/workspaces`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(creds),
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify([
        {
          id: wsId,
          name: 'Synced Workspace',
        },
      ]),
    });
  } catch {
    // ignore
  }
}
