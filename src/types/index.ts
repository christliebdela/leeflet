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

export type RoleId = 'Admin' | 'Developer' | 'Member' | 'Viewer' | 'Owner';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: RoleId | string;
  status: 'active' | 'invited';
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
  | 'midnight-sage'
  | 'abyssal-azure'
  | 'warm-espresso'
  | 'cyber-violet'
  | 'nordic-frost';

export interface ThemePreset {
  id: ColorThemeId;
  name: string;
  dotColor: string;
  accentColor: string;
  description: string;
  bgHex: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default Dark',
    dotColor: '#a1a1aa',
    accentColor: '#10b981',
    description: 'The original clean Charcoal & Zinc Leeflet dark mode',
    bgHex: '#0f0f11',
  },
  {
    id: 'midnight-sage',
    name: 'Midnight Sage',
    dotColor: '#10b981',
    accentColor: '#34d399',
    description: 'Deep botanical dark with organic emerald undertone',
    bgHex: '#0b120f',
  },
  {
    id: 'abyssal-azure',
    name: 'Abyssal Azure',
    dotColor: '#38bdf8',
    accentColor: '#0284c7',
    description: 'Deep oceanic navy with electric cyan glow',
    bgHex: '#0a0e17',
  },
  {
    id: 'warm-espresso',
    name: 'Warm Espresso',
    dotColor: '#f59e0b',
    accentColor: '#d97706',
    description: 'Cozy roasted cocoa with warm amber radiance',
    bgHex: '#120f0d',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    dotColor: '#a855f7',
    accentColor: '#9333ea',
    description: 'Synthwave twilight noir with vivid violet ambiance',
    bgHex: '#0e0b17',
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Slate',
    dotColor: '#60a5fa',
    accentColor: '#3b82f6',
    description: 'Crisp Scandinavian steel with icy blue clarity',
    bgHex: '#0c1118',
  },
];
