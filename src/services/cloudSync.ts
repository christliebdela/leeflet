import { Workspace, Project, Item, ChecklistItem } from '../types';

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
  const assignee_id = item.assigneeId && isValidUuid(item.assigneeId) ? item.assigneeId : null;

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

    // 3. Fetch remote items with checklist items
    const itemsRes = await fetch(
      `${creds.url}/rest/v1/items?workspace_id=eq.${ws.id}&select=*,checklist_items(*)`,
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
        attachments: existing?.attachments || [],
        dueAt: ri.due_at || null,
        completedAt: ri.completed_at || null,
        assigneeId: ri.assignee_id || null,
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

    return {
      projects: mergedProjects,
      items: mergedItems,
      synced: true,
    };
  } catch {
    return { projects: localProjects, items: localItems, synced: false };
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
