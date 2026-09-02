import { Item, Project, Workspace, FilterOptions, ChecklistItem, Attachment } from '../types';
import {
  pushWorkspaceToCloud,
  pushProjectToCloud,
  deleteProjectFromCloud,
  pushItemToCloud,
  deleteItemFromCloud,
  syncWorkspaceWithCloud,
} from './cloudSync';

const STORAGE_KEY_PREFIX = 'leaf_ws_';
const ACTIVE_WS_KEY = 'leaf_active_workspace';

export class DatabaseService {
  private activeWorkspaceId: string | null = null;

  constructor() {
    this.initActiveWorkspace();
  }

  private initActiveWorkspace() {
    try {
      const saved = localStorage.getItem(ACTIVE_WS_KEY);
      if (saved) {
        this.activeWorkspaceId = saved;
      }
    } catch {
      // Storage unavailable
    }
  }

  public getActiveWorkspaceId(): string | null {
    try {
      const saved = localStorage.getItem(ACTIVE_WS_KEY);
      if (saved) {
        this.activeWorkspaceId = saved;
        return saved;
      }
      if (!this.activeWorkspaceId) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_KEY_PREFIX) && !k.endsWith('_projects') && !k.endsWith('_items')) {
            const id = k.replace(STORAGE_KEY_PREFIX, '');
            this.activeWorkspaceId = id;
            localStorage.setItem(ACTIVE_WS_KEY, id);
            return id;
          }
        }
      }
    } catch {
      // Storage unavailable
    }
    return this.activeWorkspaceId;
  }

  public async getActiveWorkspace(): Promise<Workspace | null> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return null;

    const wsJson = localStorage.getItem(`${STORAGE_KEY_PREFIX}${wsId}`);
    if (!wsJson) return null;

    try {
      const ws = JSON.parse(wsJson) as Workspace;
      if (ws && (ws.path === 'C:\\leaf' || ws.path.endsWith('\\leaf') || ws.path.endsWith('/leaf'))) {
        ws.path = ws.path.replace(/[\\/]leaf$/, (match) => match.replace('leaf', 'leeflet'));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${ws.id}`, JSON.stringify(ws));
      }
      return ws;
    } catch {
      return null;
    }
  }

  public async getWorkspace(id: string): Promise<Workspace | null> {
    const wsJson = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    if (!wsJson) return null;
    try {
      return JSON.parse(wsJson) as Workspace;
    } catch {
      return null;
    }
  }

  public async getAllWorkspaces(): Promise<Workspace[]> {
    const list: Workspace[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_PREFIX) && !k.endsWith('_projects') && !k.endsWith('_items')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const ws = JSON.parse(raw) as Workspace;
              if (ws && ws.id && ws.name) {
                list.push(ws);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch {
      // storage error
    }
    return list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }

  public async setActiveWorkspace(id: string): Promise<void> {
    localStorage.setItem(ACTIVE_WS_KEY, id);
    this.activeWorkspaceId = id;
  }

  public async renameWorkspace(id: string, newName: string): Promise<void> {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    if (raw) {
      try {
        const ws = JSON.parse(raw) as Workspace;
        ws.name = newName;
        ws.updatedAt = new Date().toISOString();
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(ws));
        pushWorkspaceToCloud(ws).catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  public async deleteWorkspace(id: string): Promise<void> {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}_projects`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}_items`);

    // If the deleted workspace was active, find another one
    if (this.activeWorkspaceId === id) {
      const remaining = await this.getAllWorkspaces();
      if (remaining.length > 0) {
        await this.setActiveWorkspace(remaining[0].id);
      } else {
        await this.createWorkspace('Personal Workspace', 'C:\\leeflet\\workspaces\\personal');
      }
    }
  }

  public async getWorkspaceStats(id: string): Promise<{ projectCount: number; itemCount: number }> {
    let projectCount = 0;
    let itemCount = 0;
    try {
      const pRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_projects`);
      if (pRaw) {
        const pList = JSON.parse(pRaw);
        if (Array.isArray(pList)) projectCount = pList.length;
      }
      const iRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_items`);
      if (iRaw) {
        const iList = JSON.parse(iRaw);
        if (Array.isArray(iList)) itemCount = iList.length;
      }
    } catch {
      // ignore
    }
    return { projectCount, itemCount };
  }

  public async createWorkspace(name: string, locationPath: string, explicitId?: string): Promise<Workspace> {
    const id = explicitId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(explicitId)
      ? explicitId
      : crypto.randomUUID();
    const now = new Date().toISOString();

    const workspace: Workspace = {
      id,
      name,
      path: locationPath,
      createdAt: now,
      updatedAt: now,
      settings: {
        defaultPriority: 'none',
        defaultType: 'task',
        globalShortcut: 'Alt+L',
        theme: 'light',
        compactMode: false,
      },
    };

    localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(workspace));
    localStorage.setItem(ACTIVE_WS_KEY, id);
    this.activeWorkspaceId = id;

    // Initialize empty project & items collections for this workspace
    this.saveWorkspaceProjects(id, []);
    this.saveWorkspaceItems(id, []);

    // Async push to cloud if configured
    pushWorkspaceToCloud(workspace).catch(() => {});

    return workspace;
  }

  public async updateWorkspace(workspace: Workspace): Promise<void> {
    workspace.updatedAt = new Date().toISOString();
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${workspace.id}`, JSON.stringify(workspace));
    pushWorkspaceToCloud(workspace).catch(() => {});
  }

  // --- Projects ---

  public async getProjects(): Promise<Project[]> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return [];
    const json = localStorage.getItem(`${STORAGE_KEY_PREFIX}${wsId}_projects`);
    if (!json) return [];
    try {
      return JSON.parse(json) as Project[];
    } catch {
      return [];
    }
  }

  private saveWorkspaceProjects(wsId: string, projects: Project[]): void {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${wsId}_projects`, JSON.stringify(projects));
  }

  public async saveProjectsOrder(projects: Project[]): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;
    this.saveWorkspaceProjects(wsId, projects);
  }

  public async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) throw new Error('No active workspace');

    const projects = await this.getProjects();
    const now = new Date().toISOString();
    
    const newProject: Project = {
      ...data,
      color: data.color ?? '',
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    projects.push(newProject);
    this.saveWorkspaceProjects(wsId, projects);

    // Async push to cloud
    pushProjectToCloud(wsId, newProject).catch(() => {});

    return newProject;
  }

  public async updateProject(project: Project): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      const updated = { ...project, updatedAt: new Date().toISOString() };
      projects[index] = updated;
      this.saveWorkspaceProjects(wsId, projects);

      // Async push to cloud
      pushProjectToCloud(wsId, updated).catch(() => {});
    }
  }

  public async deleteProject(projectId: string): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const projects = (await this.getProjects()).filter(p => p.id !== projectId);
    this.saveWorkspaceProjects(wsId, projects);

    // Also remove items or orphan them
    const items = (await this.getItems()).filter(i => i.projectId !== projectId);
    this.saveWorkspaceItems(wsId, items);

    // Async delete from cloud
    deleteProjectFromCloud(wsId, projectId).catch(() => {});
  }

  // --- Items ---

  public async getItems(filters?: FilterOptions): Promise<Item[]> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return [];

    const json = localStorage.getItem(`${STORAGE_KEY_PREFIX}${wsId}_items`);
    if (!json) return [];

    let items: Item[] = [];
    try {
      items = JSON.parse(json) as Item[];
    } catch {
      return [];
    }

    if (!filters) return items;

    // Apply filtering
    const filtered = items.filter((item: Item) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesContent = item.content.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        const matchesAttachments = item.attachments.some(a => a.fileName.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesAttachments) {
          return false;
        }
      }

      if (filters.projectIds && filters.projectIds.length > 0) {
        if (!filters.projectIds.includes(item.projectId)) return false;
      }

      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(item.type)) return false;
      }

      if (filters.priorities && filters.priorities.length > 0) {
        if (!filters.priorities.includes(item.priority)) return false;
      }

      if (filters.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(item.status)) return false;
      }

      return true;
    });

    if (filters.sortBy === 'created_desc') {
      filtered.sort((a: Item, b: Item) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sortBy === 'title_asc') {
      filtered.sort((a: Item, b: Item) => a.title.localeCompare(b.title));
    } else if (filters.sortBy === 'priority_desc') {
      const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, none: 0 };
      filtered.sort((a: Item, b: Item) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
    } else if (filters.sortBy === 'updated_desc') {
      filtered.sort((a: Item, b: Item) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (filters.sortBy === 'project_asc') {
      const projects = await this.getProjects();
      const projMap = new Map<string, string>(projects.map((p: Project) => [p.id, p.name.toLowerCase()]));
      filtered.sort((a: Item, b: Item) => {
        const nameA = projMap.get(a.projectId) || '';
        const nameB = projMap.get(b.projectId) || '';
        const cmp = nameA.localeCompare(nameB);
        if (cmp !== 0) return cmp;
        return a.title.localeCompare(b.title);
      });
    }

    return filtered;
  }

  public async saveItemsOrder(items: Item[]): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;
    this.saveWorkspaceItems(wsId, items);
  }

  public async getItem(id: string): Promise<Item | null> {
    const items = await this.getItems();
    return items.find(i => i.id === id) || null;
  }

  private saveWorkspaceItems(wsId: string, items: Item[]): void {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${wsId}_items`, JSON.stringify(items));
  }

  public async createItem(data: {
    projectId: string;
    title: string;
    content?: string;
    type?: Item['type'];
    priority?: Item['priority'];
    status?: Item['status'];
    tags?: string[];
    checklist?: ChecklistItem[];
    attachments?: Attachment[];
    dueAt?: string | null;
    assigneeId?: string | null;
  }): Promise<Item> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) throw new Error('No active workspace');

    const items = await this.getItems();
    const now = new Date().toISOString();

    const newItem: Item = {
      id: crypto.randomUUID(),
      projectId: data.projectId,
      title: data.title.trim(),
      content: data.content || '',
      type: data.type || 'task',
      priority: data.priority || 'none',
      status: data.status || 'inbox',
      tags: data.tags || [],
      checklist: data.checklist || [],
      attachments: data.attachments || [],
      createdAt: now,
      updatedAt: now,
      dueAt: data.dueAt || null,
      assigneeId: data.assigneeId || null,
      completedAt: data.status === 'done' ? now : null,
    };

    items.unshift(newItem);
    this.saveWorkspaceItems(wsId, items);

    // Async push to cloud
    pushItemToCloud(wsId, newItem).catch(() => {});

    return newItem;
  }

  public async updateItem(item: Item): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const items = await this.getItems();
    const index = items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      const updated: Item = {
        ...item,
        updatedAt: now,
        completedAt: item.status === 'done' && !item.completedAt ? now : (item.status !== 'done' ? null : item.completedAt),
      };
      items[index] = updated;
      this.saveWorkspaceItems(wsId, items);

      // Async push to cloud
      pushItemToCloud(wsId, updated).catch(() => {});
    }
  }

  public async deleteItem(id: string): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const items = (await this.getItems()).filter(i => i.id !== id);
    this.saveWorkspaceItems(wsId, items);

    // Async delete from cloud
    deleteItemFromCloud(wsId, id).catch(() => {});
  }

  // --- Cloud Sync ---

  public async syncWithCloud(workspaceId?: string): Promise<{ projects: Project[]; items: Item[]; synced: boolean }> {
    const ws = workspaceId ? await this.getWorkspace(workspaceId) : await this.getActiveWorkspace();
    if (!ws) return { projects: [], items: [], synced: false };

    const localProjects = await this.getProjects();
    const localItems = await this.getItems();

    const res = await syncWorkspaceWithCloud(ws, localProjects, localItems);
    if (res.synced) {
      this.saveWorkspaceProjects(ws.id, res.projects);
      this.saveWorkspaceItems(ws.id, res.items);
    }
    return res;
  }

  // --- Export & Backup ---

  public async exportWorkspaceData(workspaceId?: string): Promise<string> {
    const wsId = workspaceId || this.getActiveWorkspaceId();
    let workspace: Workspace | null = null;
    if (wsId) {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${wsId}`);
      if (raw) {
        try { workspace = JSON.parse(raw); } catch {}
      }
    }
    if (!workspace) {
      workspace = await this.getActiveWorkspace();
    }
    if (!workspace) {
      throw new Error('No active workspace found to export');
    }
    const projectsRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workspace.id}_projects`);
    const itemsRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workspace.id}_items`);
    const projects = projectsRaw ? JSON.parse(projectsRaw) : [];
    const items = itemsRaw ? JSON.parse(itemsRaw) : [];

    const bundle = {
      version: '1.0.0',
      scope: 'single_workspace',
      exportedAt: new Date().toISOString(),
      workspace,
      projects,
      items,
    };

    return JSON.stringify(bundle, null, 2);
  }

  public async exportAllWorkspacesData(): Promise<string> {
    const workspaces = await this.getAllWorkspaces();
    const workspaceBundles = workspaces.map((ws) => {
      const projectsRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${ws.id}_projects`);
      const itemsRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${ws.id}_items`);
      return {
        workspace: ws,
        projects: projectsRaw ? JSON.parse(projectsRaw) : [],
        items: itemsRaw ? JSON.parse(itemsRaw) : [],
      };
    });

    const bundle = {
      version: '2.0.0',
      scope: 'all_workspaces',
      exportedAt: new Date().toISOString(),
      totalWorkspaces: workspaces.length,
      workspaces: workspaceBundles,
    };

    return JSON.stringify(bundle, null, 2);
  }

  public async importWorkspaceData(jsonStr: string): Promise<Workspace> {
    const bundle = JSON.parse(jsonStr);

    // Multi-workspace archive support
    if (bundle.scope === 'all_workspaces' && Array.isArray(bundle.workspaces)) {
      let lastWs: Workspace | null = null;
      for (const item of bundle.workspaces) {
        if (item.workspace && item.projects && item.items) {
          const ws = item.workspace as Workspace;
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${ws.id}`, JSON.stringify(ws));
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${ws.id}_projects`, JSON.stringify(item.projects));
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${ws.id}_items`, JSON.stringify(item.items));
          lastWs = ws;
        }
      }
      if (lastWs) {
        localStorage.setItem(ACTIVE_WS_KEY, lastWs.id);
        this.activeWorkspaceId = lastWs.id;
        return lastWs;
      }
      throw new Error('No valid workspaces found in multi-workspace archive');
    }

    // Single workspace archive
    if (!bundle.workspace || !bundle.projects || !bundle.items) {
      throw new Error('Invalid leeflet workspace backup bundle');
    }

    const ws = bundle.workspace as Workspace;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${ws.id}`, JSON.stringify(ws));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${ws.id}_projects`, JSON.stringify(bundle.projects));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${ws.id}_items`, JSON.stringify(bundle.items));
    localStorage.setItem(ACTIVE_WS_KEY, ws.id);
    this.activeWorkspaceId = ws.id;

    return ws;
  }
}

export const dbService = new DatabaseService();
