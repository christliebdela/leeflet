import { Item, Project, Workspace, FilterOptions, ChecklistItem, Attachment } from '../types';

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
      return JSON.parse(wsJson) as Workspace;
    } catch {
      return null;
    }
  }

  public async createWorkspace(name: string, locationPath: string): Promise<Workspace> {
    const id = crypto.randomUUID();
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

    return workspace;
  }

  public async updateWorkspace(workspace: Workspace): Promise<void> {
    workspace.updatedAt = new Date().toISOString();
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${workspace.id}`, JSON.stringify(workspace));
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

  public async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) throw new Error('No active workspace');

    const projects = await this.getProjects();
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    projects.push(newProject);
    this.saveWorkspaceProjects(wsId, projects);
    return newProject;
  }

  public async updateProject(project: Project): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      projects[index] = { ...project, updatedAt: new Date().toISOString() };
      this.saveWorkspaceProjects(wsId, projects);
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
    }

    return filtered;
  }

  public async saveItemsOrder(items: Item[]): Promise<void> {
    const wsId = this.activeWorkspaceId;
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
      dueAt: null,
      completedAt: data.status === 'done' ? now : null,
    };

    items.unshift(newItem);
    this.saveWorkspaceItems(wsId, items);
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
    }
  }

  public async deleteItem(id: string): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const items = (await this.getItems()).filter(i => i.id !== id);
    this.saveWorkspaceItems(wsId, items);
  }

  // --- Export & Backup ---

  public async exportWorkspaceData(): Promise<string> {
    const workspace = await this.getActiveWorkspace();
    const projects = await this.getProjects();
    const items = await this.getItems();

    const bundle = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspace,
      projects,
      items,
    };

    return JSON.stringify(bundle, null, 2);
  }

  public async importWorkspaceData(jsonStr: string): Promise<Workspace> {
    const bundle = JSON.parse(jsonStr);
    if (!bundle.workspace || !bundle.projects || !bundle.items) {
      throw new Error('Invalid leaf workspace backup bundle');
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
