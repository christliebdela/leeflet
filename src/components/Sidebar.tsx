import React, { useState, useEffect, useRef } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import {
  ListTodo,
  Layers,
  Users,
  Folder,
  Plus,
  ChevronRight,
  ChevronDown,
  Bug,
  Lightbulb,
  CheckSquare,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Archive,
  Settings,
  Trash2,
  SquarePen,
  X,
  Sun,
  Moon,
  Minimize2,
  Coffee,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  Link2,
  Building2,
  ArrowUpCircle,
  GripVertical,
} from 'lucide-react';
import { dbService } from '../services/db';
import { ViewMode, ItemType, Priority, Project, Item, Workspace } from '../types';
import { enterMiniMode } from '../utils/window';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { toast } from '../store/useToastStore';
import { resolveAvatarUrl } from '../utils/avatars';
import { getUserPermissions } from '../utils/permissions';
import { useUpdaterStore } from '../store/useUpdaterStore';

export const Sidebar: React.FC = () => {
  const {
    workspace,
    workspaces,
    switchWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    projects,
    items,
    viewMode,
    setViewMode,
    setProjectModalOpen,
    deleteProject,
    reorderProjects,
    theme,
    toggleTheme,
    isSidebarCollapsed,
    sidebarCollapseMode,
    toggleSidebar,
    initialize,
  } = useLeafStore();

  const { status: updateStatus, availableVersion, setModalOpen: setUpdateModalOpen } = useUpdaterStore();

  // User profile & mascot avatar state with real-time instant sync
  const [profileState, setProfileState] = useState(() => {
    let name = 'Profile';
    let avatar = '';
    try {
      const pRaw = localStorage.getItem('leeflet_user_profile_data') || localStorage.getItem('leaf_user_profile_data');
      if (pRaw) {
        const p = JSON.parse(pRaw);
        if (p.fullName) name = p.fullName;
        avatar = resolveAvatarUrl(p.avatarMascot || p.avatarUrl || p.avatarColor, p.fullName || 'user');
      }
    } catch {}
    if (!avatar) avatar = resolveAvatarUrl(undefined, 'owner');
    return { name, avatar };
  });

  useEffect(() => {
    const handleProfileUpdate = (e?: Event) => {
      let name = 'Profile';
      let avatar = '';
      try {
        const customEvent = e as CustomEvent;
        const p = customEvent?.detail || JSON.parse(localStorage.getItem('leeflet_user_profile_data') || localStorage.getItem('leaf_user_profile_data') || '{}');
        if (p?.fullName) name = p.fullName;
        avatar = resolveAvatarUrl(p?.avatarMascot || p?.avatarUrl || p?.avatarColor, p?.fullName || 'user');
      } catch {}
      if (!avatar) avatar = resolveAvatarUrl(undefined, 'owner');
      setProfileState({ name, avatar });
    };

    window.addEventListener('leeflet-profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('leeflet-profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const userProfileName = profileState.name;
  const userAvatarUrl = profileState.avatar;

  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(() => {
    return localStorage.getItem('leaf_sidebar_projects_collapsed') === 'true';
  });
  const [isViewsCollapsed, setIsViewsCollapsed] = useState(() => {
    return localStorage.getItem('leaf_sidebar_views_collapsed') === 'true';
  });
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  const permissions = getUserPermissions(workspace?.id);
  const isCurrentUserAdmin = permissions.isAdmin;

  // Workspace Switcher State
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isJoiningWorkspace, setIsJoiningWorkspace] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [workspaceToRename, setWorkspaceToRename] = useState<Workspace | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string; projectCount: number; itemCount: number } | null>(null);

  const workspaceContainerRef = useRef<HTMLDivElement>(null);

  // Close workspace dropdown on outside click (checks whole container so trigger toggles cleanly)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        workspaceContainerRef.current &&
        !workspaceContainerRef.current.contains(event.target as Node)
      ) {
        setIsWorkspaceMenuOpen(false);
      }
    };

    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWorkspaceMenuOpen]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    const sanitized = newWorkspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const defaultPath = `C:\\leeflet\\workspaces\\${sanitized}`;
    await createWorkspace(newWorkspaceName.trim(), defaultPath);
    setNewWorkspaceName('');
    setIsCreatingWorkspace(false);
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    let teamName = 'Team Workspace';
    let supabaseUrl = '';
    let supabaseKey = '';
    let userRole = 'member';
    let inviterName = 'Workspace Admin';
    let invitedName = '';
    let invitedEmail = '';

    let targetWorkspaceId = '';

    try {
      const trimmed = inviteInput.trim();
      let jsonPayload = '';
      if (trimmed.includes('#join=')) {
        const rawBase64 = trimmed.split('#join=')[1];
        jsonPayload = decodeURIComponent(escape(atob(rawBase64)));
      } else if (trimmed.includes('#data=')) {
        const rawBase64 = trimmed.split('#data=')[1];
        jsonPayload = decodeURIComponent(escape(atob(rawBase64)));
      } else if (trimmed.startsWith('ey') || (!trimmed.includes('://') && !trimmed.includes('&') && trimmed.length > 20)) {
        jsonPayload = decodeURIComponent(escape(atob(trimmed)));
      }

      if (jsonPayload) {
        const parsed = JSON.parse(jsonPayload);
        teamName = parsed.workspaceName || parsed.wsName || teamName;
        targetWorkspaceId = parsed.workspaceId || parsed.wsId || '';
        supabaseUrl = parsed.supabaseUrl || parsed.url || '';
        supabaseKey = parsed.supabaseAnonKey || parsed.key || '';
        userRole = parsed.role || 'member';
        inviterName = parsed.invitedBy || inviterName;
        invitedName = parsed.invitedName || '';
        invitedEmail = parsed.invitedEmail || '';
      } else if (trimmed.includes('server=')) {
        const url = new URL(trimmed.replace('leeflet://', 'http://'));
        supabaseUrl = url.searchParams.get('server') || '';
        supabaseKey = url.searchParams.get('key') || '';
        targetWorkspaceId = url.searchParams.get('ws') || '';
        teamName = url.searchParams.get('name') || teamName;
        userRole = url.searchParams.get('role') || 'member';
      }
    } catch (err) {
      console.warn('Could not parse invite link:', err);
    }

    const sanitized = teamName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const defaultPath = `C:\\leeflet\\workspaces\\team-${sanitized}-${Date.now()}`;
    const newWs = await createWorkspace(teamName, defaultPath, targetWorkspaceId || undefined);

    if (newWs && newWs.id) {
      if (supabaseUrl && supabaseKey) {
        localStorage.setItem(`leeflet_supabase_url_${newWs.id}`, supabaseUrl);
        localStorage.setItem(`leeflet_supabase_anon_key_${newWs.id}`, supabaseKey);
        localStorage.setItem(`leeflet_sync_mode_${newWs.id}`, 'cloud');
      }
      localStorage.setItem(`leeflet_workspace_role_${newWs.id}`, userRole);
      localStorage.setItem(`leeflet_is_joined_workspace_${newWs.id}`, 'true');

      // Initialize team members for joined workspace
      let myProfileName = '';
      let myProfileEmail = '';
      let myProfileMascot = '';
      let myProfileAvatarUrl = '';
      try {
        const pRaw = localStorage.getItem('leeflet_user_profile_data') || localStorage.getItem('leaf_user_profile_data');
        if (pRaw) {
          const p = JSON.parse(pRaw);
          if (p.fullName && p.fullName !== 'Alex' && p.fullName !== 'Alex Rivera' && p.fullName !== 'User') {
            myProfileName = p.fullName;
          }
          if (p.email) myProfileEmail = p.email;
          if (p.avatarMascot) myProfileMascot = p.avatarMascot;
          if (p.avatarUrl) myProfileAvatarUrl = p.avatarUrl;
        }
      } catch {}

      if (!myProfileName) {
        myProfileName = invitedName || (invitedEmail ? invitedEmail.split('@')[0] : 'Team Member');
      }
      if (!myProfileEmail) {
        myProfileEmail = invitedEmail || '';
      }

      // Update local profile with invited name if fresh
      try {
        const pRaw = localStorage.getItem('leeflet_user_profile_data');
        if (!pRaw || pRaw.includes('Alex Rivera') || pRaw.includes('"fullName":""')) {
          localStorage.setItem('leeflet_user_profile_data', JSON.stringify({
            fullName: myProfileName,
            username: myProfileName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            email: myProfileEmail,
            title: userRole.charAt(0).toUpperCase() + userRole.slice(1),
            avatarMascot: myProfileMascot || 'bot-spark',
            avatarColor: 'bg-blue-600 dark:bg-blue-500',
          }));
        }
      } catch {}

      const { OWNER_MEMBER_UUID, saveStoredTeamMembers } = await import('../utils/team');
      const { pushTeamMemberToCloud, pullTeamMembersFromCloud } = await import('../services/cloudSync');

      const adminMember = {
        id: OWNER_MEMBER_UUID,
        name: inviterName,
        email: '',
        role: 'Admin' as const,
        status: 'active' as const,
        joinedAt: 'Workspace Creator',
        avatarColor: 'bg-violet-600 dark:bg-violet-500',
      };

      const selfMember = {
        id: crypto.randomUUID(),
        name: myProfileName,
        email: myProfileEmail,
        role: (userRole.charAt(0).toUpperCase() + userRole.slice(1)) as any,
        status: 'active' as const,
        joinedAt: 'Joined just now',
        avatarColor: 'bg-blue-600 dark:bg-blue-500',
        avatarMascot: myProfileMascot || undefined,
        avatarUrl: myProfileAvatarUrl || undefined,
      };

      saveStoredTeamMembers([adminMember, selfMember], newWs.id);

      if (supabaseUrl && supabaseKey) {
        await pushTeamMemberToCloud(newWs.id, selfMember);
        const { deleteWorkspaceInviteFromCloud } = await import('../services/cloudSync');
        if (myProfileEmail) {
          await deleteWorkspaceInviteFromCloud(newWs.id, myProfileEmail);
        }
        const remoteMembers = await pullTeamMembersFromCloud(newWs.id);
        if (remoteMembers.length > 0) {
          saveStoredTeamMembers(remoteMembers, newWs.id);
        }
      }

      toast.success(`Joined ${teamName} (${userRole})`);
      await initialize('joining team workspace...');
    }

    setInviteInput('');
    setIsJoiningWorkspace(false);
  };

  const handleStartRename = (ws: Workspace) => {
    setWorkspaceToRename(ws);
    setRenameInput(ws.name);
    setIsWorkspaceMenuOpen(false);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceToRename || !renameInput.trim()) return;
    await renameWorkspace(workspaceToRename.id, renameInput.trim());
    setWorkspaceToRename(null);
    setRenameInput('');
  };

  const handleStartDelete = async (ws: Workspace) => {
    setIsWorkspaceMenuOpen(false);
    const stats = await dbService.getWorkspaceStats(ws.id);
    setWorkspaceToDelete({
      id: ws.id,
      name: ws.name,
      projectCount: stats.projectCount,
      itemCount: stats.itemCount,
    });
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    await deleteWorkspace(workspaceToDelete.id);
    setWorkspaceToDelete(null);
  };

  // Global escape key to close project delete modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && projectToDelete) {
        setProjectToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectToDelete]);

  // Compute counts (reflecting active/open items)
  const inboxCount = items.filter((i: Item) => i.status === 'inbox').length;
  const queueCount = items.filter(
    (i: Item) => (i.priority === 'critical' || i.priority === 'high' || i.priority === 'medium' || i.priority === 'low' || i.type === 'idea') && i.status !== 'done' && i.status !== 'archived'
  ).length;

  const bugsCount = items.filter((i: Item) => i.type === 'bug' && i.status !== 'done' && i.status !== 'archived').length;
  const ideasCount = items.filter((i: Item) => i.type === 'idea' && i.status !== 'done' && i.status !== 'archived').length;
  const tasksCount = items.filter((i: Item) => i.type === 'task' && i.status !== 'done' && i.status !== 'archived').length;
  const researchCount = items.filter((i: Item) => i.type === 'research' && i.status !== 'done' && i.status !== 'archived').length;
  const highPriorityCount = items.filter((i: Item) => (i.priority === 'high' || i.priority === 'critical') && i.status !== 'done' && i.status !== 'archived').length;
  const completedCount = items.filter((i: Item) => i.status === 'done').length;
  const archivedCount = items.filter((i: Item) => i.status === 'archived').length;

  const railProjects = projects.filter((p: Project) => {
    if (p.isArchived) return false;
    const hasTasks = items.some((i: Item) => i.projectId === p.id && i.status !== 'archived');
    const isCurrent = viewMode.type === 'project' && viewMode.projectId === p.id;
    return hasTasks || isCurrent;
  });

  const isViewActive = (mode: ViewMode) => {
    if (mode.type !== viewMode.type) return false;
    if (mode.type === 'project' && viewMode.type === 'project') {
      return mode.projectId === viewMode.projectId;
    }
    if (mode.type === 'type_filter' && viewMode.type === 'type_filter') {
      return mode.itemType === viewMode.itemType;
    }
    if (mode.type === 'priority_filter' && viewMode.type === 'priority_filter') {
      return mode.priority === viewMode.priority;
    }
    return true;
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    await deleteProject(projectToDelete.id);
    if (viewMode.type === 'project' && viewMode.projectId === projectToDelete.id) {
      setViewMode({ type: 'inbox' });
    }
    setProjectToDelete(null);
  };

  if (isSidebarCollapsed) {
    if (sidebarCollapseMode === 'hidden') {
      return <aside className="w-0 border-r-0 overflow-hidden transition-all duration-200" />;
    }

    return (
      <aside
        className="w-14 h-full bg-[#f4f5f6] dark:bg-[#121214] border-r border-[#e5e7eb] dark:border-[#27272a] flex flex-col justify-between items-center py-2.5 select-none text-xs text-[#374151] dark:text-[#d4d4d8] shrink-0 transition-[width,border-color] duration-200 ease-in-out z-20"
      >
        {/* Top Expand / Logo button */}
        <div className="flex flex-col items-center gap-3 w-full" data-tauri-drag-region>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleSidebar}
                className="w-9 h-9 rounded-[7px] hover:bg-[#e5e7eb]/70 dark:hover:bg-[#1f1f23] flex items-center justify-center transition-colors cursor-pointer group/rail relative"
              >
                <img
                  src="/leaf_logo.png"
                  alt="leeflet"
                  className="w-5 h-5 object-contain group-hover/rail:opacity-0 transition-opacity invert dark:invert-0"
                />
                <PanelLeftOpen className="w-4 h-4 text-[#111827] dark:text-white absolute opacity-0 group-hover/rail:opacity-100 transition-opacity" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar (Ctrl + B)</TooltipContent>
          </Tooltip>

          {/* Primary View Icons */}
          <div className="flex flex-col items-center gap-1 w-full px-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode({ type: 'inbox' })}
                  className={`w-9 h-9 flex items-center justify-center rounded-[6px] transition-colors cursor-pointer relative ${
                    isViewActive({ type: 'inbox' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  {inboxCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#111827] dark:bg-white" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Backlog (Ctrl + I)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode({ type: 'my_queue' })}
                  className={`w-9 h-9 flex items-center justify-center rounded-[6px] transition-colors cursor-pointer relative ${
                    isViewActive({ type: 'my_queue' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  {queueCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">My Queue (Ctrl + Q)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setViewMode({ type: 'team' })}
                  className={`w-9 h-9 flex items-center justify-center rounded-[6px] transition-colors cursor-pointer ${
                    isViewActive({ type: 'team' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Team</TooltipContent>
            </Tooltip>
          </div>

          {/* Projects Divider & Items with active content */}
          {railProjects.length > 0 && (
            <div className="w-full flex flex-col items-center gap-1.5 px-2 pt-2 border-t border-[#e5e7eb] dark:border-[#27272a] overflow-y-auto max-h-56 custom-scrollbar">
              {railProjects.map((project) => {
                const isActive = viewMode.type === 'project' && viewMode.projectId === project.id;
                const count = items.filter(
                  (i: Item) => i.projectId === project.id && i.status !== 'done' && i.status !== 'archived'
                ).length;
                const isDragged = draggedProjectId === project.id;
                const isDragOverBefore = dragOverInfo?.id === project.id && dragOverInfo.position === 'before';
                const isDragOverAfter = dragOverInfo?.id === project.id && dragOverInfo.position === 'after';

                return (
                  <Tooltip key={project.id}>
                    <TooltipTrigger asChild>
                      <div
                        draggable={!permissions.isViewer}
                        onDragStart={(e) => {
                          if (permissions.isViewer) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('text/plain', project.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedProjectId(project.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isTopHalf = (e.clientY - rect.top) < (rect.height / 2);
                          const position = isTopHalf ? 'before' : 'after';
                          if (!dragOverInfo || dragOverInfo.id !== project.id || dragOverInfo.position !== position) {
                            setDragOverInfo({ id: project.id, position });
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverInfo?.id === project.id) {
                              setDragOverInfo(null);
                            }
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedProjectId(null);
                          setDragOverInfo(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const sourceId = e.dataTransfer.getData('text/plain') || draggedProjectId;
                          const position = dragOverInfo?.id === project.id ? dragOverInfo.position : 'before';
                          if (sourceId && sourceId !== project.id) {
                            reorderProjects(sourceId, project.id, position);
                          }
                          setDraggedProjectId(null);
                          setDragOverInfo(null);
                        }}
                        onClick={() => setViewMode({ type: 'project', projectId: project.id })}
                        className={`w-9 h-9 flex items-center justify-center rounded-[6px] transition-all cursor-pointer relative select-none ${
                          isActive
                            ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white'
                            : 'text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                        } ${isDragged ? 'opacity-30 scale-[0.95]' : ''}`}
                      >
                        {isDragOverBefore && (
                          <div className="absolute -top-1 left-0.5 right-0.5 h-0.5 bg-[#111827] dark:bg-white rounded-full z-20 pointer-events-none flex items-center shadow-xs">
                            <div className="w-1 h-1 rounded-full bg-[#111827] dark:bg-white -ml-0.5 shadow-sm" />
                          </div>
                        )}
                        {isDragOverAfter && (
                          <div className="absolute -bottom-1 left-0.5 right-0.5 h-0.5 bg-[#111827] dark:bg-white rounded-full z-20 pointer-events-none flex items-center shadow-xs">
                            <div className="w-1 h-1 rounded-full bg-[#111827] dark:bg-white -ml-0.5 shadow-sm" />
                          </div>
                        )}
                        <Folder
                          className="w-4 h-4 transition-transform hover:scale-110"
                          style={project.color ? { color: project.color } : undefined}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${!project.color ? 'bg-[#6b7280] dark:bg-[#a1a1aa]' : ''}`}
                          style={project.color ? { backgroundColor: project.color } : undefined}
                        />
                        <span className="font-medium">{project.name}</span>
                        {count > 0 && (
                          <span className="text-[#9ca3af] dark:text-[#71717a] font-normal">
                            ({count})
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Tools in Rail */}
        <div className="flex flex-col items-center gap-1 w-full px-2 pt-2 border-t border-[#e5e7eb] dark:border-[#27272a]">
          {updateStatus === 'available' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-[6px] bg-[#111827] dark:bg-[#f4f4f5] text-white dark:text-[#18181b] hover:bg-[#1f2937] dark:hover:bg-white transition-all shadow-xs cursor-pointer relative active:scale-[0.96]"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white dark:bg-[#18181b]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Update Available (v{availableVersion || 'new'})</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-[6px] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle Theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => enterMiniMode()}
                className="w-9 h-9 flex items-center justify-center rounded-[6px] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Mini Mode (M)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => useLeafStore.getState().setStandby(true)}
                className="w-9 h-9 flex items-center justify-center rounded-[6px] text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Coffee Break (Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setViewMode({ type: 'profile' })}
                className={`w-9 h-9 flex items-center justify-center rounded-[6px] transition-colors cursor-pointer ${
                  isViewActive({ type: 'profile' })
                    ? 'bg-[#e5e7eb] dark:bg-[#27272a]'
                    : 'hover:bg-[#ebecee] dark:hover:bg-[#1f1f23]'
                }`}
              >
                <div className="w-6 h-6 rounded-full border border-[#e5e7eb] dark:border-[#323238] overflow-hidden shrink-0">
                  <img
                    src={userAvatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Profile ({userProfileName})</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-52 h-full bg-[#f4f5f6] dark:bg-[#121214] border-r border-[#e5e7eb] dark:border-[#27272a] flex flex-col justify-between select-none text-xs text-[#374151] dark:text-[#d4d4d8] shrink-0 transition-colors">
        {/* Workspace Switcher Header */}
        <div
          ref={workspaceContainerRef}
          className="h-12 px-2 flex items-center justify-between gap-1 select-none shrink-0 relative"
          data-tauri-drag-region
        >
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="flex-1 flex items-center justify-between p-1.5 rounded-[6px] hover:bg-[#e5e7eb]/70 dark:hover:bg-[#1f1f23] transition-colors group text-left select-none min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <img
                  src="/leaf_logo.png"
                  alt="leeflet"
                  className="w-5 h-5 object-contain invert dark:invert-0"
                />
              </div>
              <span className="font-semibold text-xs text-[#111827] dark:text-[#f4f4f5] truncate tracking-tight">
                {workspace?.name || 'Personal Workspace'}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] group-hover:text-[#111827] dark:group-hover:text-white transition-transform shrink-0 ml-1 ${
                isWorkspaceMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={toggleSidebar}
            title="Collapse sidebar (Ctrl + B)"
            className="p-1.5 rounded-[5px] hover:bg-[#e5e7eb]/70 dark:hover:bg-[#1f1f23] text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>

          {/* Workspace Dropdown Menu */}
          {isWorkspaceMenuOpen && (
            <div
              className="absolute top-11 left-2 right-2 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-2xl p-1 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#9ca3af] dark:text-[#71717a]">
                Workspaces
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                {(workspaces.length > 0 ? workspaces : (workspace ? [workspace] : [])).map((ws) => {
                  const isActive = workspace?.id === ws.id;
                  const isWsJoined = localStorage.getItem(`leeflet_is_joined_workspace_${ws.id}`) === 'true';
                  const wsRole = localStorage.getItem(`leeflet_workspace_role_${ws.id}`);
                  const isWsAdmin = !isWsJoined || wsRole === 'Admin' || wsRole === 'Owner' || wsRole === 'admin' || wsRole === 'owner';

                  return (
                    <div
                      key={ws.id}
                      className={`w-full group/ws px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                          : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!isActive) switchWorkspace(ws.id);
                          setIsWorkspaceMenuOpen(false);
                        }}
                        className="flex items-center gap-2 truncate flex-1 text-left min-w-0"
                      >
                        <div className="w-4 h-4 rounded-[3px] bg-[#e5e7eb] dark:bg-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] flex items-center justify-center text-[9px] font-semibold shrink-0">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </button>

                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        {isActive && <Check className="w-3.5 h-3.5 text-[#111827] dark:text-[#f4f4f5] shrink-0" />}
                        {isWsAdmin && (
                          <>
                            <button
                              type="button"
                              title="Rename workspace"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(ws);
                              }}
                              className="opacity-0 group-hover/ws:opacity-100 p-1 hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] rounded text-[#6b7280] dark:text-[#a1a1aa] transition-opacity"
                            >
                              <SquarePen className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              title="Delete workspace"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDelete(ws);
                              }}
                              className="opacity-0 group-hover/ws:opacity-100 p-1 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded text-rose-600 dark:text-rose-400 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#f3f4f6] dark:border-[#27272a] pt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setIsCreatingWorkspace(true);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-[4px] text-xs text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>New Workspace...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setIsJoiningWorkspace(true);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-[4px] text-xs text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center gap-2 transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Join Team via Link...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setViewMode({ type: 'settings' });
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-[4px] text-xs text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                  <span>Workspace Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
          {/* Primary Views */}
          <div className="space-y-0.5">
            <button
              onClick={() => setViewMode({ type: 'inbox' })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors font-medium text-xs ${
                isViewActive({ type: 'inbox' })
                  ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white'
                  : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                <span>Backlog</span>
              </div>
              {inboxCount > 0 && (
                <span className="text-[11px] text-[#6b7280] dark:text-[#71717a] font-normal">
                  {inboxCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode({ type: 'my_queue' })}
              className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors font-medium text-xs ${
                isViewActive({ type: 'my_queue' })
                  ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white'
                  : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                <span>My Queue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    enterMiniMode();
                  }}
                  className="hidden group-hover:flex items-center justify-center p-0.5 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white rounded transition-colors"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
                {queueCount > 0 && (
                  <span className="text-[11px] text-[#6b7280] dark:text-[#71717a] font-normal">
                    {queueCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => setViewMode({ type: 'team' })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors font-medium text-xs ${
                isViewActive({ type: 'team' })
                  ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white'
                  : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                <span>Team</span>
              </div>
            </button>
          </div>

          {/* PROJECTS SECTION */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a]">
              <div
                className="flex items-center gap-1 cursor-pointer hover:text-[#111827] dark:hover:text-white select-none"
                onClick={() => {
                  const next = !isProjectsCollapsed;
                  setIsProjectsCollapsed(next);
                  localStorage.setItem('leaf_sidebar_projects_collapsed', String(next));
                }}
              >
                {isProjectsCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                )}
                <span>Projects</span>
              </div>
              {isCurrentUserAdmin && (
                <button
                  onClick={() => setProjectModalOpen(true)}
                  className="hover:text-[#111827] dark:hover:text-white p-0.5 rounded-[4px] hover:bg-[#ebecee] dark:hover:bg-[#27272a]"
                >
                  <Plus className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                </button>
              )}
            </div>

            {!isProjectsCollapsed && (
              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  <div className="px-2.5 py-1 text-[11px] text-[#9ca3af] dark:text-[#71717a] italic">
                    No projects yet
                  </div>
                ) : (
                  projects.map((project: Project) => {
                    const count = items.filter(
                      (i: Item) => i.projectId === project.id && i.status !== 'done' && i.status !== 'archived'
                    ).length;
                    const active = isViewActive({ type: 'project', projectId: project.id });
                    const isDragged = draggedProjectId === project.id;
                    const isDragOverBefore = dragOverInfo?.id === project.id && dragOverInfo.position === 'before';
                    const isDragOverAfter = dragOverInfo?.id === project.id && dragOverInfo.position === 'after';

                    return (
                      <div
                        key={project.id}
                        draggable={!permissions.isViewer}
                        onDragStart={(e) => {
                          if (permissions.isViewer) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('text/plain', project.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedProjectId(project.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isTopHalf = (e.clientY - rect.top) < (rect.height / 2);
                          const position = isTopHalf ? 'before' : 'after';
                          if (!dragOverInfo || dragOverInfo.id !== project.id || dragOverInfo.position !== position) {
                            setDragOverInfo({ id: project.id, position });
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            if (dragOverInfo?.id === project.id) {
                              setDragOverInfo(null);
                            }
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedProjectId(null);
                          setDragOverInfo(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const sourceId = e.dataTransfer.getData('text/plain') || draggedProjectId;
                          const position = dragOverInfo?.id === project.id ? dragOverInfo.position : 'before';
                          if (sourceId && sourceId !== project.id) {
                            reorderProjects(sourceId, project.id, position);
                          }
                          setDraggedProjectId(null);
                          setDragOverInfo(null);
                        }}
                        className={`group relative flex items-center justify-between px-2 py-1.5 rounded-[6px] transition-colors text-xs select-none ${
                          active
                            ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                            : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                        } ${isDragged ? 'opacity-30 scale-[0.99]' : ''}`}
                      >
                        {/* Floating Insertion Indicator Line */}
                        {isDragOverBefore && (
                          <div className="absolute -top-1 left-1 right-1 h-0.5 bg-[#111827] dark:bg-white rounded-full z-20 pointer-events-none flex items-center shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#111827] dark:bg-white -ml-0.5 shadow-sm" />
                          </div>
                        )}
                        {isDragOverAfter && (
                          <div className="absolute -bottom-1 left-1 right-1 h-0.5 bg-[#111827] dark:bg-white rounded-full z-20 pointer-events-none flex items-center shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#111827] dark:bg-white -ml-0.5 shadow-sm" />
                          </div>
                        )}

                        {/* Grip Drag Handle */}
                        {!permissions.isViewer && (
                          <div
                            className="cursor-grab active:cursor-grabbing text-[#d1d5db] dark:text-[#52525b] opacity-0 group-hover:opacity-100 group-hover:text-[#9ca3af] dark:group-hover:text-[#a1a1aa] transition-all shrink-0 -ml-0.5 mr-1"
                          >
                            <GripVertical className="w-3 h-3" />
                          </div>
                        )}

                        <button
                          onClick={() => setViewMode({ type: 'project', projectId: project.id })}
                          className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer min-w-0"
                        >
                          <Folder
                            className={`w-3.5 h-3.5 shrink-0 ${!project.color ? (active ? 'text-[#111827] dark:text-white' : 'text-[#6b7280] dark:text-[#a1a1aa]') : ''}`}
                            style={project.color ? { color: project.color } : undefined}
                          />
                          <span className="truncate">{project.name}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {count > 0 && (
                            <span className={`text-[11px] text-[#6b7280] dark:text-[#71717a] font-normal ${isCurrentUserAdmin ? 'group-hover:hidden' : ''}`}>
                              {count}
                            </span>
                          )}
                          {isCurrentUserAdmin && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectModalOpen(true, project);
                                }}
                                className="hidden group-hover:flex items-center justify-center p-0.5 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white rounded transition-colors"
                              >
                                <SquarePen className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(project);
                                }}
                                className="hidden group-hover:flex items-center justify-center p-0.5 text-[#9ca3af] hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* VIEWS SECTION (All Icons Monochrome) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#71717a]">
              <div
                className="flex items-center gap-1 cursor-pointer hover:text-[#111827] dark:hover:text-white select-none"
                onClick={() => {
                  const next = !isViewsCollapsed;
                  setIsViewsCollapsed(next);
                  localStorage.setItem('leaf_sidebar_views_collapsed', String(next));
                }}
              >
                {isViewsCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                )}
                <span>Views</span>
              </div>
            </div>

            {!isViewsCollapsed && (
              <div className="space-y-0.5">
                <button
                  onClick={() => setViewMode({ type: 'type_filter', itemType: 'bug' as ItemType })}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                    isViewActive({ type: 'type_filter', itemType: 'bug' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bug className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Bugs</span>
                  </div>
                  {bugsCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{bugsCount}</span>}
                </button>

                <button
                  onClick={() => setViewMode({ type: 'type_filter', itemType: 'idea' as ItemType })}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                    isViewActive({ type: 'type_filter', itemType: 'idea' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Ideas</span>
                  </div>
                  {ideasCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{ideasCount}</span>}
                </button>

                <button
                  onClick={() => setViewMode({ type: 'type_filter', itemType: 'task' as ItemType })}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                    isViewActive({ type: 'type_filter', itemType: 'task' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Tasks</span>
                  </div>
                  {tasksCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{tasksCount}</span>}
                </button>

                <button
                  onClick={() => setViewMode({ type: 'type_filter', itemType: 'research' as ItemType })}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                    isViewActive({ type: 'type_filter', itemType: 'research' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Research</span>
                  </div>
                  {researchCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{researchCount}</span>}
                </button>

                <button
                  onClick={() => setViewMode({ type: 'priority_filter', priority: 'high' as Priority })}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                    isViewActive({ type: 'priority_filter', priority: 'high' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>High Priority</span>
                  </div>
                  {highPriorityCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{highPriorityCount}</span>}
                </button>

                <button
                  onClick={() => setViewMode({ type: 'completed' })}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                    isViewActive({ type: 'completed' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Completed</span>
                  </div>
                  {completedCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{completedCount}</span>}
                </button>

                <button
                  onClick={() => setViewMode({ type: 'archived' })}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs ${
                    isViewActive({ type: 'archived' })
                      ? 'bg-[#e5e7eb] dark:bg-[#27272a] text-[#111827] dark:text-white font-medium'
                      : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
                    <span>Archived</span>
                  </div>
                  {archivedCount > 0 && <span className="text-[11px] text-[#6b7280] dark:text-[#71717a]">{archivedCount}</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Footer Controls */}
        <div className="p-3 border-t border-[#e5e7eb] dark:border-[#27272a] space-y-1">
          {updateStatus === 'available' && (
            <button
              type="button"
              onClick={() => setUpdateModalOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#111827] dark:bg-[#f4f4f5] text-white dark:text-[#18181b] hover:bg-[#1f2937] dark:hover:bg-white transition-all text-xs font-semibold shadow-xs cursor-pointer select-none active:scale-[0.98] mb-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ArrowUpCircle className="w-3.5 h-3.5 text-white dark:text-[#18181b] shrink-0" />
                <span className="truncate">Update Available</span>
              </div>
              <span className="text-[10px] font-mono bg-white/20 dark:bg-black/10 text-white dark:text-[#18181b] px-1.5 py-0.5 rounded font-bold shrink-0">
                v{availableVersion || 'new'}
              </span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white transition-colors text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10.5px] text-[#9ca3af] dark:text-[#71717a] font-normal capitalize">
              {theme}
            </span>
          </button>

          {/* Mini Mode */}
          <button
            onClick={enterMiniMode}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white transition-colors text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <Minimize2 className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span>Mini Mode</span>
            </div>
            <kbd className="w-4 h-4 flex items-center justify-center rounded-[3px] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] shrink-0 leading-none">
              M
            </kbd>
          </button>

          {/* Coffee Break / Mask */}
          <button
            onClick={() => useLeafStore.getState().setStandby(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs font-medium text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa]" />
              <span>Coffee Break</span>
            </div>
            <kbd className="w-4 h-4 flex items-center justify-center rounded-[3px] bg-[#ebecee] dark:bg-[#27272a] border border-[#e5e7eb] dark:border-[#3f3f46] font-mono text-[9px] font-semibold text-[#6b7280] dark:text-[#a1a1aa] shrink-0 leading-none">
              Z
            </kbd>
          </button>



          {/* User Profile */}
          <button
            onClick={() => setViewMode({ type: 'profile' })}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors text-xs font-medium ${
              isViewActive({ type: 'profile' })
                ? 'bg-[#ebecee] dark:bg-[#27272a] text-[#111827] dark:text-white font-semibold'
                : 'text-[#4b5563] dark:text-[#a1a1aa] hover:bg-[#ebecee] dark:hover:bg-[#1f1f23] hover:text-[#111827] dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full border border-[#e5e7eb] dark:border-[#323238] overflow-hidden shrink-0">
                <img
                  src={userAvatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="truncate">{userProfileName}</span>
            </div>
            <span className="text-[10.5px] text-[#9ca3af] dark:text-[#71717a] font-normal shrink-0">
              {workspace ? localStorage.getItem(`leeflet_workspace_role_${workspace.id}`) || (localStorage.getItem(`leeflet_is_joined_workspace_${workspace.id}`) === 'true' ? 'Member' : 'Admin') : 'Admin'}
            </span>
          </button>
        </div>
      </aside>

      {/* Project Delete Confirmation Modal */}
      {projectToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setProjectToDelete(null);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-[6px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-4 h-4" />
                <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  Delete Project
                </h2>
              </div>
              <button
                onClick={() => setProjectToDelete(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-[#111827] dark:text-white">"{projectToDelete.name}"</span> and all items associated with it? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] text-xs font-medium shadow-subtle transition-all"
              >
                Delete Project
              </button>
              </div>
            </div>
          </div>
        )}

      {/* Create Workspace Modal */}
      {isCreatingWorkspace && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreatingWorkspace(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <form
            onSubmit={handleCreateWorkspace}
            className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5]">
                <Building2 className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                <h2 className="text-xs font-bold">Create New Workspace</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingWorkspace(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#a1a1aa] mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Acme Corp or Side Project"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] focus:ring-1 focus:ring-[#9ca3af] dark:focus:ring-[#52525b] transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setIsCreatingWorkspace(false)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newWorkspaceName.trim()}
                className="px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join Team Workspace Modal */}
      {isJoiningWorkspace && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsJoiningWorkspace(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <form
            onSubmit={handleJoinWorkspace}
            className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5]">
                <Link2 className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                <h2 className="text-xs font-bold">Join Team Workspace</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsJoiningWorkspace(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#a1a1aa] mb-1.5">
                Invite Link or Code
              </label>
              <input
                type="text"
                autoFocus
                placeholder="leeflet://join#data=... or invite code"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] focus:ring-1 focus:ring-[#9ca3af] dark:focus:ring-[#52525b] transition-colors"
              />
              <p className="text-[10px] text-[#9ca3af] dark:text-[#71717a] mt-1.5 leading-relaxed">
                Paste the invite link shared by your workspace administrator to connect directly to your team.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setIsJoiningWorkspace(false)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inviteInput.trim()}
                className="px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Connect & Join
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Workspace Modal */}
      {workspaceToRename && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setWorkspaceToRename(null);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <form
            onSubmit={handleConfirmRename}
            className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-[#111827] dark:text-[#f4f4f5]">
                <SquarePen className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa]" />
                <h2 className="text-xs font-bold">Rename Workspace</h2>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceToRename(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#4b5563] dark:text-[#a1a1aa] mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                autoFocus
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-[6px] bg-[#f9fafb] dark:bg-[#202024] border border-[#e5e7eb] dark:border-[#27272a] text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] focus:ring-1 focus:ring-[#9ca3af] dark:focus:ring-[#52525b] transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setWorkspaceToRename(null)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!renameInput.trim() || renameInput.trim() === workspaceToRename.name}
                className="px-3.5 py-1.5 bg-[#111827] dark:bg-white text-white dark:text-[#111827] rounded-[6px] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      {workspaceToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setWorkspaceToDelete(null);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-[8px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-2.5">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-4 h-4" />
                <h2 className="text-xs font-bold text-[#111827] dark:text-[#f4f4f5]">
                  Delete Workspace
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceToDelete(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-[#111827] dark:text-white">"{workspaceToDelete.name}"</span>?
            </p>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-[6px] p-3 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
              <div className="font-semibold text-[11px] uppercase tracking-wider">The following will be permanently erased:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11.5px]">
                <li><span className="font-semibold">{workspaceToDelete.projectCount}</span> project{workspaceToDelete.projectCount !== 1 ? 's' : ''}</li>
                <li><span className="font-semibold">{workspaceToDelete.itemCount}</span> task{workspaceToDelete.itemCount !== 1 ? 's' : ''} and backlog items</li>
                <li>All checklists, attachments, and settings</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]">
              <button
                type="button"
                onClick={() => setWorkspaceToDelete(null)}
                className="px-3 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] text-xs font-medium hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] text-xs font-semibold shadow-subtle transition-all"
              >
                Delete Workspace and All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
