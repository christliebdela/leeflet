import { ProjectComponent } from '../types';

const STORAGE_KEY_PREFIX = 'leaf_ws_';

export class ComponentDatabaseService {
  private getActiveWorkspaceId(): string | null {
    try {
      return localStorage.getItem('leaf_active_workspace');
    } catch {
      return null;
    }
  }

  private getStorageKey(wsId: string): string {
    return `${STORAGE_KEY_PREFIX}${wsId}_components`;
  }

  private readComponents(wsId: string): ProjectComponent[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(wsId));
      if (!raw) return [];
      return JSON.parse(raw) as ProjectComponent[];
    } catch {
      return [];
    }
  }

  private writeComponents(wsId: string, components: ProjectComponent[]): void {
    try {
      localStorage.setItem(this.getStorageKey(wsId), JSON.stringify(components));
    } catch {}
  }

  public async getComponents(projectId?: string): Promise<ProjectComponent[]> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return [];

    const all = this.readComponents(wsId);
    if (!projectId) return all;
    return all.filter((c) => c.projectId === projectId);
  }

  public async getComponent(id: string): Promise<ProjectComponent | null> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return null;
    const all = this.readComponents(wsId);
    return all.find((c) => c.id === id) ?? null;
  }

  public async createComponent(
    data: Omit<ProjectComponent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectComponent> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) throw new Error('No active workspace');

    const all = this.readComponents(wsId);
    const now = new Date().toISOString();

    const component: ProjectComponent = {
      ...data,
      id: crypto.randomUUID(),
      workspaceId: wsId,
      memberIds: data.memberIds ?? [],
      color: data.color ?? '#3b82f6',
      sortOrder: data.sortOrder ?? all.filter((c) => c.projectId === data.projectId).length,
      createdAt: now,
      updatedAt: now,
    };

    all.push(component);
    this.writeComponents(wsId, all);
    return component;
  }

  public async updateComponent(component: ProjectComponent): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const all = this.readComponents(wsId);
    const idx = all.findIndex((c) => c.id === component.id);
    if (idx !== -1) {
      all[idx] = { ...component, updatedAt: new Date().toISOString() };
      this.writeComponents(wsId, all);
    }
  }

  public async deleteComponent(id: string): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const all = this.readComponents(wsId).filter((c) => c.id !== id);
    this.writeComponents(wsId, all);
  }

  /** Called when a workspace is deleted so we clean up its component data. */
  public async deleteWorkspaceComponents(wsId: string): Promise<void> {
    try {
      localStorage.removeItem(this.getStorageKey(wsId));
    } catch {}
  }

  /** Import components during workspace restore. */
  public async importComponents(wsId: string, components: ProjectComponent[]): Promise<void> {
    this.writeComponents(wsId, components);
  }

  public async saveComponentsOrder(projectId: string, components: ProjectComponent[]): Promise<void> {
    const wsId = this.getActiveWorkspaceId();
    if (!wsId) return;

    const all = this.readComponents(wsId).filter((c) => c.projectId !== projectId);
    const reordered = components.map((c, i) => ({ ...c, sortOrder: i }));
    this.writeComponents(wsId, [...all, ...reordered]);
  }
}

export const componentDbService = new ComponentDatabaseService();
