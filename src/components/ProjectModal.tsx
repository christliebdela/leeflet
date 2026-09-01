import React, { useState, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { X, Folder, Trash2 } from 'lucide-react';
import { ColorPicker, MODERN_COLOR_PRESETS } from './ui/ColorPicker';

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
    } else {
      setName('');
      setDescription('');
      setLocalPath('');
      setColor('');
    }
  }, [editingProject, isProjectModalOpen]);

  const workspace = useLeafStore((s) => s.workspace);
  const isJoinedWorkspace = workspace?.id ? localStorage.getItem(`leeflet_is_joined_workspace_${workspace.id}`) === 'true' : false;
  const workspaceRole = workspace?.id ? localStorage.getItem(`leeflet_workspace_role_${workspace.id}`) : null;
  const isCurrentUserAdmin = !isJoinedWorkspace || workspaceRole === 'Admin' || workspaceRole === 'Owner' || workspaceRole === 'admin' || workspaceRole === 'owner';

  if (!isProjectModalOpen || !isCurrentUserAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      await updateProject({
        ...editingProject,
        name: name.trim(),
        description: description.trim() || undefined,
        localPath: localPath.trim() || undefined,
        color: color.trim() || '',
      });
    } else {
      const proj = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        localPath: localPath.trim() || undefined,
        color: color.trim() || '',
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
              className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-[#f4f4f5] focus:bg-white dark:focus:bg-[#27272a] focus:outline-none"
            />
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
                className="px-4 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[6px] font-semibold shadow-subtle"
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
