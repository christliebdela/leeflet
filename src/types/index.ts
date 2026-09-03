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
    id: 'default',
    name: 'Noir (Default)',
    dotColor: '#ffffff',
    accentColor: '#ffffff',
    description: 'Charcoal zinc sidebar with flagship OLED pitch-black page.',
    bgHex: '#000000',
    sidebarHex: '#0e0e11',
    cardHex: '#08080a',
    cardElevatedHex: '#141418',
    borderHex: '#1f1f24',
    previewPills: ['#ffffff', '#a1a1aa', '#1f1f24'],
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    dotColor: '#a1a1aa',
    accentColor: '#10b981',
    description: 'Lighter zinc sidebar with deep charcoal black page.',
    bgHex: '#0a0a0c',
    sidebarHex: '#161619',
    cardHex: '#101013',
    cardElevatedHex: '#1c1c20',
    borderHex: '#26262d',
    previewPills: ['#10b981', '#a1a1aa', '#26262d'],
  },
  {
    id: 'claude',
    name: 'Claude',
    dotColor: '#da7756',
    accentColor: '#da7756',
    description: 'Warm stone sidebar with deep dark espresso page.',
    bgHex: '#0f0d0b',
    sidebarHex: '#1f1c19',
    cardHex: '#161412',
    cardElevatedHex: '#221e1a',
    borderHex: '#302a24',
    previewPills: ['#da7756', '#f4845f', '#302a24'],
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    dotColor: '#7aa2f7',
    accentColor: '#7aa2f7',
    description: 'Tokyo blue-gray sidebar with midnight navy page.',
    bgHex: '#11121a',
    sidebarHex: '#1f2335',
    cardHex: '#161824',
    cardElevatedHex: '#24283b',
    borderHex: '#2a2f47',
    previewPills: ['#7aa2f7', '#bb9af7', '#7dcfff'],
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    dotColor: '#cba6f7',
    accentColor: '#cba6f7',
    description: 'Surface slate sidebar with dark Crust page and mauve accents.',
    bgHex: '#11111b',
    sidebarHex: '#222334',
    cardHex: '#181825',
    cardElevatedHex: '#313244',
    borderHex: '#3d3f56',
    previewPills: ['#cba6f7', '#89b4fa', '#f5c2e7'],
  },
  {
    id: 'dracula',
    name: 'Dracula',
    dotColor: '#bd93f9',
    accentColor: '#bd93f9',
    description: 'Purple-gray sidebar with iconic deep abyss Dracula page.',
    bgHex: '#191a21',
    sidebarHex: '#282a36',
    cardHex: '#21222c',
    cardElevatedHex: '#343746',
    borderHex: '#44475a',
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
