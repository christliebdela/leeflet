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
  | 'nord'
  | 'gruvbox'
  | 'rose-pine'
  | 'kanagawa'
  | 'kanagawa-dragon'
  | 'everforest'
  | 'solarized'
  | 'one-dark'
  | 'monokai-pro'
  | 'github-dark'
  | 'tide'
  | 'sage'
  | 'caffeine'
  | 'deep-black';

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
    previewPills: ['#10b981', '#a1a1aa', '#27272a'],
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
  {
    id: 'nord',
    name: 'Nord',
    dotColor: '#88c0d0',
    accentColor: '#88c0d0',
    description: 'Official Arctic North-bluish palette by Arctic Ice Studio.',
    bgHex: '#2e3440',
    sidebarHex: '#242933',
    cardHex: '#3b4252',
    cardElevatedHex: '#434c5e',
    borderHex: '#4c566a',
    previewPills: ['#88c0d0', '#81a1c1', '#a3be8c'],
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox Dark',
    dotColor: '#fabd2f',
    accentColor: '#fabd2f',
    description: 'Official Gruvbox Dark by morhetz: warm retro groove.',
    bgHex: '#282828',
    sidebarHex: '#1d2021',
    cardHex: '#3c3836',
    cardElevatedHex: '#504945',
    borderHex: '#665c54',
    previewPills: ['#fabd2f', '#fe8019', '#b8bb26'],
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    dotColor: '#ebbcba',
    accentColor: '#ebbcba',
    description: 'Official Rosé Pine: all-natural pine, foam & rose gold.',
    bgHex: '#191724',
    sidebarHex: '#14121f',
    cardHex: '#1f1d2e',
    cardElevatedHex: '#26233a',
    borderHex: '#393552',
    previewPills: ['#ebbcba', '#9ccfd8', '#f6c177'],
  },
  {
    id: 'kanagawa',
    name: 'Kanagawa Wave',
    dotColor: '#7e9cd8',
    accentColor: '#7e9cd8',
    description: 'Official Kanagawa by rebelot: sumi ink & fuji white.',
    bgHex: '#1f1f28',
    sidebarHex: '#16161d',
    cardHex: '#2a2a37',
    cardElevatedHex: '#363646',
    borderHex: '#54546d',
    previewPills: ['#7e9cd8', '#98bb6c', '#d27e99'],
  },
  {
    id: 'kanagawa-dragon',
    name: 'Kanagawa Dragon',
    dotColor: '#8ba4b0',
    accentColor: '#8ba4b0',
    description: 'Official Kanagawa Dragon: ink-dark dragon black & aqua.',
    bgHex: '#12120f',
    sidebarHex: '#0d0c0c',
    cardHex: '#1d1c19',
    cardElevatedHex: '#282723',
    borderHex: '#34322d',
    previewPills: ['#8ba4b0', '#87a987', '#b6927b'],
  },
  {
    id: 'everforest',
    name: 'Everforest Dark',
    dotColor: '#a7c080',
    accentColor: '#a7c080',
    description: 'Official Everforest by sainnhe: soothing natural green.',
    bgHex: '#2d353b',
    sidebarHex: '#232a2e',
    cardHex: '#343f44',
    cardElevatedHex: '#3d484d',
    borderHex: '#475258',
    previewPills: ['#a7c080', '#83c092', '#dbbc7f'],
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    dotColor: '#268bd2',
    accentColor: '#268bd2',
    description: "Official Solarized by Ethan Schoonover: precision low-glare.",
    bgHex: '#002b36',
    sidebarHex: '#00212b',
    cardHex: '#073642',
    cardElevatedHex: '#0a4756',
    borderHex: '#0e5668',
    previewPills: ['#268bd2', '#2aa198', '#b58900'],
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    dotColor: '#61afef',
    accentColor: '#61afef',
    description: 'Official Atom One Dark: modern balanced developer classic.',
    bgHex: '#282c34',
    sidebarHex: '#21252b',
    cardHex: '#2c313a',
    cardElevatedHex: '#353b45',
    borderHex: '#3e4451',
    previewPills: ['#61afef', '#c678dd', '#98c379'],
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    dotColor: '#ffd866',
    accentColor: '#ffd866',
    description: 'Official Monokai Pro: filtered dark with vibrant accents.',
    bgHex: '#2d2a2e',
    sidebarHex: '#221f22',
    cardHex: '#3a383c',
    cardElevatedHex: '#403e41',
    borderHex: '#49464e',
    previewPills: ['#ffd866', '#ff6188', '#78dce8'],
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    dotColor: '#58a6ff',
    accentColor: '#58a6ff',
    description: 'Official GitHub Primer Dark: sleek developer aesthetic.',
    bgHex: '#0d1117',
    sidebarHex: '#010409',
    cardHex: '#161b22',
    cardElevatedHex: '#21262d',
    borderHex: '#30363d',
    previewPills: ['#58a6ff', '#3fb950', '#d29922'],
  },
];
