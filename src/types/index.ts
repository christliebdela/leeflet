export type ItemType =
  | 'idea'
  | 'bug'
  | 'task'
  | 'improvement'
  | 'research'
  | 'question'
  | 'note';

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type Status = 'inbox' | 'planned' | 'in_progress' | 'done' | 'archived';

export interface ChecklistItem {
  id: string;
  itemId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

export interface Attachment {
  id: string;
  itemId: string;
  fileName: string;
  filePath: string;
  fileSize: number; // bytes
  mimeType: string;
  createdAt: string;
}

export interface Item {
  id: string;
  projectId: string;
  moduleId?: string | null; // project module / sub-area
  componentId?: string | null; // backward-compatibility alias
  title: string;
  content: string;
  type: ItemType;
  priority: Priority;
  status: Status;
  tags: string[];
  checklist: ChecklistItem[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  dueAt?: string | null;
  assigneeId?: string | null;
  completedAt?: string | null;
  isPinned?: boolean;
  githubIssueNumber?: number;
  githubIssueUrl?: string;
  githubIssueState?: 'open' | 'closed';
}

export interface ProjectModule {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description?: string;
  color?: string; // hex accent colour, e.g. '#3b82f6'
  leadId?: string | null; // default assignee for new tasks in this module
  memberIds: string[]; // workspace_member ids on this module
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectComponent = ProjectModule; // backward-compatibility alias

export type RoleId = 'Admin' | 'Developer' | 'Designer' | 'Product Manager' | 'QA Engineer' | 'Member' | 'Viewer';
export type MemberStatus = 'active' | 'invited' | 'suspended';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: RoleId | string;
  status: MemberStatus;
  joinedAt?: string;
  avatarColor?: string;
  avatarUrl?: string;
  avatarMascot?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string; // hex or tailwind identifier
  icon?: string;
  localPath?: string;
  githubRepo?: string; // e.g. "owner/repo"
  githubToken?: string; // optional per-project token override
  githubLastSyncedAt?: string;
  githubSyncState?: 'open' | 'all';
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  defaultPriority: Priority;
  defaultType: ItemType;
  globalShortcut: string;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
}

export type ViewMode =
  | { type: 'inbox' }
  | { type: 'my_queue' }
  | { type: 'all' }
  | { type: 'project'; projectId: string }
  | { type: 'type_filter'; itemType: ItemType }
  | { type: 'priority_filter'; priority: Priority }
  | { type: 'completed' }
  | { type: 'archived' }
  | { type: 'team' }
  | { type: 'profile' }
  | { type: 'settings'; tab?: 'preferences' | 'shortcuts' | 'sync' | 'data'; section?: string };

export interface FilterOptions {
  searchQuery: string;
  projectIds?: string[];
  types?: ItemType[];
  priorities?: Priority[];
  statuses?: Status[];
  tags?: string[];
  sortBy?: 'manual' | 'updated_desc' | 'created_desc' | 'priority_desc' | 'title_asc' | 'project_asc';
}

export type SidebarCollapseMode = 'icons' | 'hidden';

export type ItemViewLayout = 'list' | 'board' | 'cards';

export type ColorThemeId =
  | 'default'
  | 'charcoal'
  | 'claude'
  | 'tokyo-night'
  | 'catppuccin'
  | 'dracula'
  | 'deep-black'
  // Coming soon:
  // | 'nord'
  // | 'gruvbox'
  // | 'rose-pine'
  // | 'kanagawa'
  // | 'kanagawa-dragon'
  // | 'everforest'
  // | 'solarized'
  // | 'one-dark'
  // | 'monokai-pro'
  // | 'github-dark'
  // | 'tide'
  // | 'sage'
  // | 'caffeine'
  ;

export interface ThemePreset {
  id: ColorThemeId;
  name: string;
  dotColor: string;
  accentColor: string;
  description: string;
  bgHex: string;
  sidebarHex: string;
  cardHex: string;
  cardElevatedHex: string;
  borderHex: string;
  previewPills: [string, string, string];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'charcoal',
    name: 'Charcoal (Default)',
    dotColor: '#a1a1aa',
    accentColor: '#10b981',
    description: 'Balanced dark charcoal and zinc with soft contrast.',
    bgHex: '#0f0f11',
    sidebarHex: '#121214',
    cardHex: '#18181b',
    cardElevatedHex: '#202024',
    borderHex: '#27272a',
    previewPills: ['#10b981', '#a1a1aa', '#27272a'],
  },
  {
    id: 'default',
    name: 'Noir',
    dotColor: '#ffffff',
    accentColor: '#ffffff',
    description: 'Pure void. Flagship OLED pitch-black with sharp contrast.',
    bgHex: '#000000',
    sidebarHex: '#000000',
    cardHex: '#09090b',
    cardElevatedHex: '#121215',
    borderHex: '#18181b',
    previewPills: ['#ffffff', '#a1a1aa', '#18181b'],
  },
  {
    id: 'claude',
    name: 'Claude',
    dotColor: '#da7756',
    accentColor: '#da7756',
    description: 'Official Anthropic Claude warm stone & terracotta coral.',
    bgHex: '#1b1917',
    sidebarHex: '#141210',
    cardHex: '#24201c',
    cardElevatedHex: '#2c2824',
    borderHex: '#3a3530',
    previewPills: ['#da7756', '#f4845f', '#3a3530'],
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    dotColor: '#7aa2f7',
    accentColor: '#7aa2f7',
    description: 'Official Tokyo Night by folke: clean neon night aesthetic.',
    bgHex: '#1a1b26',
    sidebarHex: '#16161e',
    cardHex: '#1f2335',
    cardElevatedHex: '#24283b',
    borderHex: '#292e42',
    previewPills: ['#7aa2f7', '#bb9af7', '#7dcfff'],
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    dotColor: '#cba6f7',
    accentColor: '#cba6f7',
    description: 'Official Catppuccin Mocha palette with soothing mauve.',
    bgHex: '#1e1e2e',
    sidebarHex: '#181825',
    cardHex: '#313244',
    cardElevatedHex: '#45475a',
    borderHex: '#585b70',
    previewPills: ['#cba6f7', '#89b4fa', '#f5c2e7'],
  },
  {
    id: 'dracula',
    name: 'Dracula',
    dotColor: '#bd93f9',
    accentColor: '#bd93f9',
    description: 'Official Dracula theme with iconic gothic purple & pink.',
    bgHex: '#282a36',
    sidebarHex: '#21222c',
    cardHex: '#343746',
    cardElevatedHex: '#44475a',
    borderHex: '#6272a4',
    previewPills: ['#bd93f9', '#ff79c6', '#50fa7b'],
  },
  // Coming soon — themes below are commented out:
  // { id: 'nord', name: 'Nord', ... },
  // { id: 'gruvbox', name: 'Gruvbox Dark', ... },
  // { id: 'rose-pine', name: 'Rosé Pine', ... },
  // { id: 'kanagawa', name: 'Kanagawa Wave', ... },
  // { id: 'kanagawa-dragon', name: 'Kanagawa Dragon', ... },
  // { id: 'everforest', name: 'Everforest Dark', ... },
  // { id: 'solarized', name: 'Solarized Dark', ... },
  // { id: 'one-dark', name: 'One Dark', ... },
  // { id: 'monokai-pro', name: 'Monokai Pro', ... },
  // { id: 'github-dark', name: 'GitHub Dark', ... },
];
