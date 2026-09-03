import { create } from 'zustand';
import { ProjectComponent } from '../types';
import { componentDbService } from '../services/componentDb';
import { pushComponentToCloud, deleteComponentFromCloud } from '../services/cloudSync';
import { toast } from './useToastStore';

interface ComponentState {
  components: ProjectComponent[];
  selectedComponentId: string | null; // null = 'All Tasks'

  // Modal State
  isComponentModalOpen: boolean;
  editingComponent: ProjectComponent | null;

  // Actions
  loadComponents: (projectId?: string) => Promise<void>;
  createComponent: (data: Omit<ProjectComponent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectComponent>;
  updateComponent: (component: ProjectComponent) => Promise<void>;
  deleteComponent: (id: string) => Promise<void>;
  setSelectedComponentId: (id: string | null) => void;
  openComponentModal: (comp?: ProjectComponent | null) => void;
  closeComponentModal: () => void;

  // Selectors
  getComponentsForProject: (projectId: string) => ProjectComponent[];
  getComponent: (id: string) => ProjectComponent | undefined;
}

export const useComponentStore = create<ComponentState>((set, get) => ({
  components: [],
  selectedComponentId: null,
  isComponentModalOpen: false,
  editingComponent: null,

  openComponentModal: (comp = null) => set({ isComponentModalOpen: true, editingComponent: comp ?? null }),
  closeComponentModal: () => set({ isComponentModalOpen: false, editingComponent: null }),

  loadComponents: async (projectId?: string) => {
    const components = await componentDbService.getComponents(projectId);
    set({ components });
  },

  createComponent: async (data) => {
    const component = await componentDbService.createComponent(data);
    set((state) => ({ components: [...state.components, component] }));

    // Async cloud push
    pushComponentToCloud(data.workspaceId, component).catch(() => {});

    toast.success(`Module "${component.name}" created`);
    return component;
  },

  updateComponent: async (component) => {
    await componentDbService.updateComponent(component);
    set((state) => ({
      components: state.components.map((c) => (c.id === component.id ? component : c)),
    }));

    // Async cloud push
    pushComponentToCloud(component.workspaceId, component).catch(() => {});
  },

  deleteComponent: async (id) => {
    const component = get().components.find((c) => c.id === id);
    await componentDbService.deleteComponent(id);
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
    }));

    if (component) {
      deleteComponentFromCloud(component.workspaceId, id).catch(() => {});
    }

    toast.success('Module deleted');
  },

  setSelectedComponentId: (id) => set({ selectedComponentId: id }),

  getComponentsForProject: (projectId) => {
    return get().components.filter((c) => c.projectId === projectId);
  },

  getComponent: (id) => {
    return get().components.find((c) => c.id === id);
  },
}));
