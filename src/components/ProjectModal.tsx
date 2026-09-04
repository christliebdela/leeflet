import React, { useState, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { X, Folder, Trash2 } from 'lucide-react';
import { ColorPicker, MODERN_COLOR_PRESETS } from './ui/ColorPicker';
import { parseGitHubRepo } from '../services/github';

export const PROJECT_COLOR_PRESETS = MODERN_COLOR_PRESETS;

export const ProjectModal: React.FC = () => {
  const {
    isProjectModalOpen,
    editingProject,
    setProjectModalOpen,
    createProject,
    updateProject,
    deleteProject,
    setSelectedProjectId,
    projects,
  } = useLeafStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [color, setColor] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubSyncState, setGithubSyncState] = useState<'open' | 'all'>('open');
  const [showAdvancedGithub, setShowAdvancedGithub] = useState(false);

  // Set of colors already assigned to other projects
  const assignedColors = new Set<string>(
    projects
      .filter((p): p is typeof p & { color: string } => Boolean(p.id !== editingProject?.id && p.color))
      .map((p) => p.color.toLowerCase())
  );

  // Global window Escape key listener
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProjectModalOpen) {
        setProjectModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isProjectModalOpen, setProjectModalOpen]);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description || '');
      setLocalPath(editingProject.localPath || '');
      setColor(editingProject.color || '');
      setGithubRepo(editingProject.githubRepo || '');
      setGithubToken(editingProject.githubToken || '');
      setGithubSyncState(editingProject.githubSyncState || 'open');
      setShowAdvancedGithub(Boolean(editingProject.githubToken));
    } else {
      setName('');
      setDescription('');
      setLocalPath('');
      setColor('');
      setGithubRepo('');
      setGithubToken('');
      setGithubSyncState('open');
      setShowAdvancedGithub(false);
    }
  }, [editingProject, isProjectModalOpen]);

  const workspace = useLeafStore((s) => s.workspace);
  const isJoinedWorkspace = workspace?.id ? localStorage.getItem(`leeflet_is_joined_workspace_${workspace.id}`) === 'true' : false;
  const workspaceRole = workspace?.id ? localStorage.getItem(`leeflet_workspace_role_${workspace.id}`) : null;
  const isCurrentUserAdmin = !isJoinedWorkspace || workspaceRole === 'Admin' || workspaceRole === 'Owner' || workspaceRole === 'admin' || workspaceRole === 'owner';

  if (!isProjectModalOpen || !isCurrentUserAdmin) return null;

  const isDuplicateName = Boolean(name.trim()) && projects.some(
    (p) => p.id !== editingProject?.id && p.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isDuplicateName) return;

    const trimmedRepo = githubRepo.trim() || undefined;
    const trimmedToken = githubToken.trim() || undefined;

    if (editingProject) {
      await updateProject({
        ...editingProject,
        name: name.trim(),
        description: description.trim() || undefined,
        localPath: localPath.trim() || undefined,
        color: color.trim() || '',
        githubRepo: trimmedRepo,
        githubToken: trimmedToken,
        githubSyncState,
      });
    } else {
      const proj = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        localPath: localPath.trim() || undefined,
        color: color.trim() || '',
        githubRepo: trimmedRepo,
        githubToken: trimmedToken,
        githubSyncState,
      });
      setSelectedProjectId(proj.id);
    }

    setProjectModalOpen(false);
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    if (confirm(`Delete project "${editingProject.name}" and all its items?`)) {
      await deleteProject(editingProject.id);
      setProjectModalOpen(false);
    }
  };

  const activePresetMatch = Boolean(color)
    ? PROJECT_COLOR_PRESETS.find((p) => p.value.toLowerCase() === color.toLowerCase())
    : undefined;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setProjectModalOpen(false);
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-3">
          <div className="flex items-center gap-2">
            <Folder
              className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa] transition-colors"
              style={color ? { color } : undefined}
            />
            <h2 className="text-sm font-bold text-[#111827] dark:text-[#f4f4f5]">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
          </div>
          <button
            onClick={() => setProjectModalOpen(false)}
            className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Qlaima, Ventrix RMS, Personal..."
              className={`w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border rounded-[6px] text-[#111827] dark:text-[#f4f4f5] focus:bg-white dark:focus:bg-[#27272a] focus:outline-none ${
                isDuplicateName
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-[#e5e7eb] dark:border-[#27272a]'
              }`}
            />
            {isDuplicateName && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                A project with this name already exists.
              </p>
            )}
          </div>

          {/* Project Accent Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#374151] dark:text-[#d4d4d8]">
                Project Color
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] font-medium">
                  {activePresetMatch ? activePresetMatch.name : (color ? `Custom (${color})` : 'Default (Monochrome)')}
                </span>
                {Boolean(color) && (
                  <button
                    type="button"
                    onClick={() => setColor('')}
                    className="text-[10px] text-[#6b7280] hover:text-[#111827] dark:text-[#a1a1aa] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            </div>

            <ColorPicker
              value={color}
              onChange={setColor}
              assignedColors={assignedColors}
              allowDefault={true}
            />
          </div>

          <div>
            <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the project"
              className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-[#f4f4f5] focus:bg-white dark:focus:bg-[#27272a] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-1">
              Local Folder / Repository Path (Optional)
            </label>
            <input
              type="text"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="C:\Projects\my-project"
              className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-[#f4f4f5] focus:bg-white dark:focus:bg-[#27272a] focus:outline-none font-mono text-[11px]"
            />
          </div>

          {/* GitHub Repository Integration */}
          <div className="pt-2 border-t border-[#f3f4f6] dark:border-[#27272a]/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] flex items-center gap-1.5 text-xs">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub Repository (Optional)</span>
              </label>
              {parseGitHubRepo(githubRepo) && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {parseGitHubRepo(githubRepo)!.owner}/{parseGitHubRepo(githubRepo)!.repo}
                </span>
              )}
            </div>

            <input
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="owner/repo or https://github.com/owner/repo"
              className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-[#f4f4f5] focus:bg-white dark:focus:bg-[#27272a] focus:outline-none font-mono text-[11px]"
            />
            <div className="flex items-center justify-between text-[10px] text-[#6b7280] dark:text-[#71717a]">
              <span>Syncs issues into this project's board & backlog</span>
              <button
                type="button"
                onClick={() => setShowAdvancedGithub(!showAdvancedGithub)}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {showAdvancedGithub ? 'Hide Options' : 'Sync Options'}
              </button>
            </div>

            {showAdvancedGithub && (
              <div className="p-2.5 rounded-[6px] bg-[#f4f5f6]/80 dark:bg-[#141416] border border-[#e5e7eb] dark:border-[#27272a] space-y-2 mt-1 animate-in fade-in duration-100">
                <div>
                  <label className="text-[10px] font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-0.5">
                    Sync Scope
                  </label>
                  <select
                    value={githubSyncState}
                    onChange={(e) => setGithubSyncState(e.target.value as 'open' | 'all')}
                    className="w-full px-2 py-1 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[5px] text-[11px] text-[#111827] dark:text-[#f4f4f5] focus:outline-none cursor-pointer"
                  >
                    <option value="open">Open issues only (Recommended)</option>
                    <option value="all">All issues (including closed)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-0.5">
                    Project Personal Access Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_... (Overrides global token in Settings)"
                    className="w-full px-2 py-1 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[5px] text-[11px] font-mono text-[#111827] dark:text-[#f4f4f5] focus:outline-none"
                  />
                  <p className="text-[9.5px] text-[#6b7280] dark:text-[#71717a] mt-0.5">
                    Only required for private repositories if not set globally in Settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f6] dark:border-[#27272a]">
            {editingProject ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 py-1.5 px-2 rounded-[6px] hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProjectModalOpen(false)}
                className="px-3.5 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] font-semibold hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isDuplicateName}
                className="px-4 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[6px] font-semibold shadow-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
