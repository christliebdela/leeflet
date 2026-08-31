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
  | 'kanagawa'
  | 'kanagawa-dragon'
  | 'tokyo-night'
  | 'catppuccin'
  | 'rose-pine'
  | 'everforest'
  | 'nord'
  | 'gruvbox'
  | 'dracula'
  | 'solarized'
  | 'tide'
  | 'sage'
  | 'caffeine';

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
    description: 'Pure void. Flagship OLED pitch-black with sharp contrast.',
    bgHex: '#000000',
    sidebarHex: '#000000',
    cardHex: '#09090b',
    cardElevatedHex: '#121215',
    borderHex: '#18181b',
    previewPills: ['#ffffff', '#a1a1aa', '#18181b'],
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    dotColor: '#a1a1aa',
    accentColor: '#10b981',
    description: 'Balanced dark charcoal and zinc with soft contrast.',
    bgHex: '#0f0f11',
    sidebarHex: '#121214',
    cardHex: '#18181b',
    cardElevatedHex: '#202024',
    borderHex: '#27272a',
    previewPills: ['#71717a', '#a1a1aa', '#27272a'],
  },
  {
    id: 'claude',
    name: 'Claude',
    dotColor: '#d97706',
    accentColor: '#d97706',
    description: 'Warm clay accent on paper.',
    bgHex: '#181614',
    sidebarHex: '#13110f',
    cardHex: '#201d19',
    cardElevatedHex: '#292520',
    borderHex: '#363028',
    previewPills: ['#d97706', '#f59e0b', '#363028'],
  },
  {
    id: 'kanagawa',
    name: 'Kanagawa',
    dotColor: '#7e9cd8',
    accentColor: '#7e9cd8',
    description: 'Inky dark inspired by Hokusai; warm Lotus.',
    bgHex: '#1f1f28',
    sidebarHex: '#16161d',
    cardHex: '#2a2a37',
    cardElevatedHex: '#363646',
    borderHex: '#3b3b4f',
    previewPills: ['#7e9cd8', '#98bb6c', '#3b3b4f'],
  },
  {
    id: 'kanagawa-dragon',
    name: 'Kanagawa Dragon',
    dotColor: '#8ba4b0',
    accentColor: '#8ba4b0',
    description: 'The muted, near-black Dragon variant of Kanagawa.',
    bgHex: '#12120f',
    sidebarHex: '#0d0d0c',
    cardHex: '#1d1c19',
    cardElevatedHex: '#282723',
    borderHex: '#34322d',
    previewPills: ['#8ba4b0', '#c8c093', '#34322d'],
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    dotColor: '#7aa2f7',
    accentColor: '#7aa2f7',
    description: 'Calm, blue-leaning dark theme.',
    bgHex: '#1a1b26',
    sidebarHex: '#16161e',
    cardHex: '#24283b',
    cardElevatedHex: '#2f354f',
    borderHex: '#384061',
    previewPills: ['#7aa2f7', '#bb9af7', '#384061'],
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    dotColor: '#cba6f7',
    accentColor: '#cba6f7',
    description: 'Mocha + Latte — soothing pastel.',
    bgHex: '#1e1e2e',
    sidebarHex: '#181825',
    cardHex: '#28283d',
    cardElevatedHex: '#313244',
    borderHex: '#45475a',
    previewPills: ['#cba6f7', '#f5c2e7', '#45475a'],
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    dotColor: '#ebbcba',
    accentColor: '#ebbcba',
    description: 'Soho vibes, all-natural pine and rose.',
    bgHex: '#191724',
    sidebarHex: '#14121f',
    cardHex: '#232136',
    cardElevatedHex: '#2a283e',
    borderHex: '#393552',
    previewPills: ['#ebbcba', '#9ccfd8', '#393552'],
  },
  {
    id: 'everforest',
    name: 'Everforest',
    dotColor: '#a7c080',
    accentColor: '#a7c080',
    description: 'Soft, low-contrast green forest palette.',
    bgHex: '#232a2e',
    sidebarHex: '#1e2326',
    cardHex: '#2d353b',
    cardElevatedHex: '#343f44',
    borderHex: '#425047',
    previewPills: ['#a7c080', '#dbbc7f', '#425047'],
  },
  {
    id: 'nord',
    name: 'Nord',
    dotColor: '#88c0d0',
    accentColor: '#88c0d0',
    description: 'Arctic, north-bluish palette.',
    bgHex: '#242933',
    sidebarHex: '#1f232a',
    cardHex: '#2e3440',
    cardElevatedHex: '#3b4252',
    borderHex: '#4c566a',
    previewPills: ['#88c0d0', '#81a1c1', '#4c566a'],
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    dotColor: '#fabd2f',
    accentColor: '#fabd2f',
    description: 'Warm, earthy retro palette.',
    bgHex: '#1d2021',
    sidebarHex: '#181a1b',
    cardHex: '#282828',
    cardElevatedHex: '#32302f',
    borderHex: '#3c3836',
    previewPills: ['#fabd2f', '#fe8019', '#3c3836'],
  },
  {
    id: 'dracula',
    name: 'Dracula',
    dotColor: '#bd93f9',
    accentColor: '#bd93f9',
    description: 'The classic high-contrast purple dark theme.',
    bgHex: '#21222c',
    sidebarHex: '#191a21',
    cardHex: '#282a36',
    cardElevatedHex: '#343746',
    borderHex: '#44475a',
    previewPills: ['#bd93f9', '#ff79c6', '#44475a'],
  },
  {
    id: 'solarized',
    name: 'Solarized',
    dotColor: '#268bd2',
    accentColor: '#268bd2',
    description: "Ethan Schoonover's precision low-glare dark palette.",
    bgHex: '#00212b',
    sidebarHex: '#001b24',
    cardHex: '#002b36',
    cardElevatedHex: '#073642',
    borderHex: '#0e4a59',
    previewPills: ['#268bd2', '#2aa198', '#0e4a59'],
  },
  {
    id: 'tide',
    name: 'Tide',
    dotColor: '#38bdf8',
    accentColor: '#38bdf8',
    description: 'Deep slate with muted teal.',
    bgHex: '#0d151c',
    sidebarHex: '#090e13',
    cardHex: '#15202b',
    cardElevatedHex: '#1d2b3a',
    borderHex: '#273a4e',
    previewPills: ['#38bdf8', '#2dd4bf', '#273a4e'],
  },
  {
    id: 'sage',
    name: 'Sage',
    dotColor: '#86efac',
    accentColor: '#86efac',
    description: 'Muted forest green — calm and soft.',
    bgHex: '#141b18',
    sidebarHex: '#0f1412',
    cardHex: '#1c2420',
    cardElevatedHex: '#242f2a',
    borderHex: '#2e3d36',
    previewPills: ['#86efac', '#6ee7b7', '#2e3d36'],
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    dotColor: '#f59e0b',
    accentColor: '#f59e0b',
    description: 'Roasted espresso & warm latte tones.',
    bgHex: '#140f0c',
    sidebarHex: '#0f0b09',
    cardHex: '#1e1713',
    cardElevatedHex: '#29201a',
    borderHex: '#3d2f26',
    previewPills: ['#f59e0b', '#d97706', '#3d2f26'],
  },
];
