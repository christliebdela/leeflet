import { create } from 'zustand';
import { Workspace, Project, Item, ViewMode, FilterOptions, ChecklistItem, Attachment, ItemType, Priority, Status, ColorThemeId, SidebarCollapseMode } from '../types';
import { dbService } from '../services/db';
import { broadcastSync, subscribeToSync } from '../utils/sync';
import { toast } from './useToastStore';
import { soundService } from '../utils/audio';

interface LeafState {
  workspace: Workspace | null;
  workspaces: Workspace[];
  projects: Project[];
  items: Item[];
  selectedItemId: string | null;
  selectedProjectId: string | null;
  viewMode: ViewMode;
  filterOptions: FilterOptions;
  isQuickCaptureOpen: boolean;
  isOnboardingOpen: boolean;
  isWorkspaceModalOpen: boolean;
  isProjectModalOpen: boolean;
  editingProject: Project | null;
  stickyNoteItemId: string | null;
  itemToDelete: Item | null;
  isLoading: boolean;
  loadingMessage: string;
  isStandby: boolean;
  standbyJokesEnabled: boolean;
  isSidebarCollapsed: boolean;
  sidebarCollapseMode: SidebarCollapseMode;
  theme: 'light' | 'dark';
  colorTheme: ColorThemeId;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarCollapseMode: (mode: SidebarCollapseMode) => void;
  setColorTheme: (colorTheme: ColorThemeId) => void;
  initialize: (customLoadingMessage?: string) => Promise<void>;
  setLoadingMessage: (msg: string) => void;
  setStandby: (isStandby: boolean) => void;
  toggleStandby: () => void;
  setStandbyJokesEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  loadWorkspaces: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, locationPath: string) => Promise<Workspace>;
  renameWorkspace: (workspaceId: string, newName: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  createProject: (data: { name: string; description?: string; color?: string; localPath?: string }) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  loadItems: () => Promise<void>;
  createItem: (data: {
    projectId: string;
    title: string;
    content?: string;
    type?: ItemType;
    priority?: Priority;
    status?: Status;
    tags?: string[];
    checklist?: ChecklistItem[];
    attachments?: Attachment[];
    dueAt?: string | null;
    assigneeId?: string | null;
  }) => Promise<Item>;
  updateItem: (item: Item) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reorderItems: (sourceId: string, targetId: string, position?: 'before' | 'after') => void;
  
  setSelectedItemId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setViewMode: (view: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  
  setQuickCaptureOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  setWorkspaceModalOpen: (open: boolean) => void;
  setProjectModalOpen: (open: boolean, project?: Project | null) => void;
  setStickyNoteItemId: (id: string | null) => void;
  setItemToDelete: (item: Item | null) => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('leaf_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialColorTheme = (): ColorThemeId => {
  try {
    const saved = localStorage.getItem('leaf_color_theme') as ColorThemeId | null;
    if (saved && ['default', 'midnight-sage', 'abyssal-azure', 'warm-espresso', 'cyber-violet', 'nordic-frost'].includes(saved)) {
      return saved;
    }
  } catch {}
  return 'default';
};

const getInitialSidebarCollapseMode = (): SidebarCollapseMode => {
  try {
    const saved = localStorage.getItem('leaf_pref_sidebar_collapse_mode') as SidebarCollapseMode | null;
    if (saved === 'hidden' || saved === 'icons') return saved;
  } catch {}
  return 'icons';
};

const getInitialViewMode = (): ViewMode => {
  try {
    const saved = localStorage.getItem('leaf_current_view_mode');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.type) {
        return parsed;
      }
    }
  } catch {}
  return { type: 'inbox' };
};

export const useLeafStore = create<LeafState>((set, get) => ({
  workspace: null,
  workspaces: [],
  projects: [],
  items: [],
  selectedItemId: null,
  selectedProjectId: null,
  viewMode: getInitialViewMode(),
  filterOptions: {
    searchQuery: '',
    sortBy: 'manual',
  },
  isQuickCaptureOpen: false,
  isOnboardingOpen: false,
  isWorkspaceModalOpen: false,
  isProjectModalOpen: false,
  editingProject: null,
  stickyNoteItemId: null,
  itemToDelete: null,
  isLoading: true,
  loadingMessage: 'loading workspace...',
  isStandby: false,
  standbyJokesEnabled: typeof window !== 'undefined' && localStorage.getItem('leaf_standby_jokes_enabled') === 'true',
  isSidebarCollapsed: typeof window !== 'undefined' && localStorage.getItem('leaf_sidebar_collapsed') === 'true',
  sidebarCollapseMode: getInitialSidebarCollapseMode(),
  theme: getInitialTheme(),
  colorTheme: getInitialColorTheme(),

  setSidebarCollapseMode: (sidebarCollapseMode: SidebarCollapseMode) => {
    localStorage.setItem('leaf_pref_sidebar_collapse_mode', sidebarCollapseMode);
    set({ sidebarCollapseMode });
  },

  setColorTheme: (colorTheme: ColorThemeId) => {
    localStorage.setItem('leaf_color_theme', colorTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-color-theme', colorTheme);
    }
    set({ colorTheme });
  },

  toggleSidebar: () => {
    const next = !get().isSidebarCollapsed;
    localStorage.setItem('leaf_sidebar_collapsed', String(next));
    set({ isSidebarCollapsed: next });
  },
  setSidebarCollapsed: (collapsed: boolean) => {
    localStorage.setItem('leaf_sidebar_collapsed', String(collapsed));
    set({ isSidebarCollapsed: collapsed });
  },

  setLoadingMessage: (loadingMessage: string) => set({ loadingMessage }),
  setStandby: (isStandby: boolean) => set({ isStandby }),
  toggleStandby: () => set((state) => ({ isStandby: !state.isStandby })),
  setStandbyJokesEnabled: (enabled: boolean) => {
    localStorage.setItem('leaf_standby_jokes_enabled', String(enabled));
    set({ standbyJokesEnabled: enabled });
  },

  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('leaf_theme', theme);
    // Temporarily disable CSS transitions during theme switch to prevent color flashing
    const css = document.createElement('style');
    css.appendChild(
      document.createTextNode(
        `*, *::before, *::after {
          -webkit-transition: none !important;
          -moz-transition: none !important;
          -o-transition: none !important;
          -ms-transition: none !important;
          transition: none !important;
        }`
      )
    );
    document.head.appendChild(css);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Force a reflow to apply classes without transition lag
    if (typeof window !== 'undefined') {
      window.getComputedStyle(document.body);
      setTimeout(() => {
        if (css.parentNode) {
          css.parentNode.removeChild(css);
        }
      }, 10);
    }

    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initialize: async (customLoadingMessage?: string) => {
    set({
      isLoading: true,
      loadingMessage: customLoadingMessage || 'loading workspace...',
    });
    // Apply theme class
    const curTheme = get().theme;
    if (curTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-color-theme', get().colorTheme);

    // Subscribe to real-time inter-window sync
    if (typeof window !== 'undefined' && !(window as any).__leaf_sync_active) {
      (window as any).__leaf_sync_active = true;
      subscribeToSync((msg) => {
        if (msg.type === 'item_updated') {
          set((state) => ({
            items: state.items.map((i) => (i.id === msg.item.id ? msg.item : i)),
          }));
        } else if (msg.type === 'item_created') {
          set((state) => {
            if (state.items.some((i) => i.id === msg.item.id)) return state;
            return { items: [msg.item, ...state.items] };
          });
          toast.success('Item added');
        } else if (msg.type === 'item_deleted') {
          set((state) => ({
            items: state.items.filter((i) => i.id !== msg.itemId),
            selectedItemId: state.selectedItemId === msg.itemId ? null : state.selectedItemId,
          }));
          toast.success('Item deleted');
        } else if (msg.type === 'items_reload') {
          get().loadItems();
        } else if (msg.type === 'projects_reload') {
          get().loadProjects();
        }
      });
    }

    const startTime = Date.now();
    try {
      const ws = await dbService.getActiveWorkspace();
      if (!ws) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) {
          await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
        }
        set({ isOnboardingOpen: true, isLoading: false, loadingMessage: 'loading workspace...' });
        return;
      }

      set({ workspace: ws, isOnboardingOpen: false });
      await get().loadWorkspaces();
      await get().loadProjects();
      await get().loadItems();
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
      }
      set({ isLoading: false, loadingMessage: 'loading workspace...' });
    }
  },

  loadWorkspaces: async () => {
    const workspaces = await dbService.getAllWorkspaces();
    set({ workspaces });
  },

  switchWorkspace: async (workspaceId: string) => {
    set({ isLoading: true, loadingMessage: 'switching workspace...' });
    try {
      await dbService.setActiveWorkspace(workspaceId);
      const ws = await dbService.getActiveWorkspace();
      set({ workspace: ws, selectedItemId: null, selectedProjectId: null });
      await get().loadWorkspaces();
      await get().loadProjects();
      await get().loadItems();
      toast.success(`Switched to ${ws?.name || 'workspace'}`);
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkspace: async (name: string, locationPath: string) => {
    set({ isLoading: true, loadingMessage: 'creating workspace...' });
    try {
      const ws = await dbService.createWorkspace(name, locationPath);
      await get().loadWorkspaces();
      set({ workspace: ws, isOnboardingOpen: false, selectedItemId: null, selectedProjectId: null });
      await get().loadProjects();
      await get().loadItems();
      toast.success(`Created workspace "${name}"`);
      return ws;
    } finally {
      set({ isLoading: false });
    }
  },

  renameWorkspace: async (workspaceId: string, newName: string) => {
    await dbService.renameWorkspace(workspaceId, newName);
    await get().loadWorkspaces();
    const ws = await dbService.getActiveWorkspace();
    set({ workspace: ws });
    toast.success(`Workspace renamed to "${newName}"`);
  },

  deleteWorkspace: async (workspaceId: string) => {
    set({ isLoading: true, loadingMessage: 'deleting workspace...' });
    try {
      await dbService.deleteWorkspace(workspaceId);
      await get().loadWorkspaces();
      const ws = await dbService.getActiveWorkspace();
      set({ workspace: ws, selectedItemId: null, selectedProjectId: null });
      await get().loadProjects();
      await get().loadItems();
      toast.success('Workspace deleted');
    } finally {
      set({ isLoading: false });
    }
  },

  loadProjects: async () => {
    const projects = await dbService.getProjects();
    set({ projects });
  },

  createProject: async (data) => {
    const project = await dbService.createProject(data);
    await get().loadProjects();
    broadcastSync({ type: 'projects_reload' });
    return project;
  },

  updateProject: async (project) => {
    await dbService.updateProject(project);
    await get().loadProjects();
    broadcastSync({ type: 'projects_reload' });
  },

  deleteProject: async (id) => {
    await dbService.deleteProject(id);
    if (get().selectedProjectId === id) {
      set({ selectedProjectId: null, viewMode: { type: 'inbox' } });
    }
    await get().loadProjects();
    await get().loadItems();
    broadcastSync({ type: 'projects_reload' });
    broadcastSync({ type: 'items_reload' });
  },

  loadItems: async () => {
    const items = await dbService.getItems(get().filterOptions);
    set({ items });
  },

  createItem: async (data) => {
    const newItem = await dbService.createItem(data);
    await get().loadItems();
    broadcastSync({ type: 'item_created', item: newItem });
    toast.success('Item added');
    return newItem;
  },

  updateItem: async (item) => {
    const prevItem = get().items.find((i) => i.id === item.id);
    if (prevItem) {
      if (prevItem.status !== 'done' && item.status === 'done') {
        soundService.playCompletionChime();
      } else if (prevItem.checklist && item.checklist) {
        const prevCompleted = prevItem.checklist.filter((c) => c.isCompleted).length;
        const newCompleted = item.checklist.filter((c) => c.isCompleted).length;
        if (newCompleted > prevCompleted) {
          soundService.playCompletionChime();
        }
      }
    }

    // Immediate in-memory state update
    set((state) => ({
      items: state.items.map((i) => (i.id === item.id ? item : i)),
    }));
    broadcastSync({ type: 'item_updated', item });
    await dbService.updateItem(item);
  },

  deleteItem: async (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }));
    broadcastSync({ type: 'item_deleted', itemId: id });
    await dbService.deleteItem(id);
    await get().loadItems();
    toast.success('Item deleted');
  },

  reorderItems: async (sourceId: string, targetId: string, position: 'before' | 'after' = 'before') => {
    if (sourceId === targetId) return;

    const items = [...get().items];
    const sourceIndex = items.findIndex((i) => i.id === sourceId);
    if (sourceIndex === -1) return;

    const [movedItem] = items.splice(sourceIndex, 1);

    const newTargetIndex = items.findIndex((i) => i.id === targetId);
    if (newTargetIndex === -1) return;

    const insertIndex = position === 'after' ? newTargetIndex + 1 : newTargetIndex;
    items.splice(insertIndex, 0, movedItem);

    set({
      items,
      filterOptions: { ...get().filterOptions, sortBy: 'manual' },
    });
    await dbService.saveItemsOrder(items);
    broadcastSync({ type: 'items_reload' });
  },

  setSelectedItemId: (id) =>
    set({
      selectedItemId: id,
      isWorkspaceModalOpen: id ? false : get().isWorkspaceModalOpen,
    }),
  setSelectedProjectId: (id) => {
    const nextView: ViewMode = id ? { type: 'project', projectId: id } : { type: 'inbox' };
    try {
      localStorage.setItem('leaf_current_view_mode', JSON.stringify(nextView));
    } catch {}
    set({
      selectedProjectId: id,
      selectedItemId: null,
      isWorkspaceModalOpen: false,
      viewMode: nextView,
    });
  },
  setViewMode: (viewMode) => {
    try {
      localStorage.setItem('leaf_current_view_mode', JSON.stringify(viewMode));
    } catch {}
    set({
      viewMode,
      selectedItemId: null,
      isWorkspaceModalOpen: false,
      selectedProjectId: viewMode.type === 'project' ? viewMode.projectId : null,
    });
  },
  setSearchQuery: (searchQuery) => {
    set((state) => ({
      filterOptions: { ...state.filterOptions, searchQuery },
    }));
    get().loadItems();
  },
  setFilterOptions: (options) => {
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...options },
    }));
    get().loadItems();
  },

  setQuickCaptureOpen: (open) => set({ isQuickCaptureOpen: open }),
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
  setWorkspaceModalOpen: (open) =>
    set({
      isWorkspaceModalOpen: open,
      selectedItemId: open ? null : get().selectedItemId,
    }),
  setProjectModalOpen: (open, project = null) => set({ isProjectModalOpen: open, editingProject: project }),
  setStickyNoteItemId: (id) => set({ stickyNoteItemId: id }),
  setItemToDelete: (item) => set({ itemToDelete: item }),
}));
