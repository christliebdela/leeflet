import React, { useState, useEffect } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import { X, Folder, Trash2, Check, Pipette } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

export const PROJECT_COLOR_PRESETS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Sky', value: '#0284c7' },
];

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
  const [color, setColor] = useState('#10b981');

  // Set of colors already assigned to other projects
  const assignedColors = new Set(
    projects
      .filter((p) => p.id !== editingProject?.id && p.color)
      .map((p) => p.color?.toLowerCase())
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
      setColor(editingProject.color || '#10b981');
    } else {
      setName('');
      setDescription('');
      setLocalPath('');
      // Auto-assign the first available preset color that isn't already in use
      const availablePreset = PROJECT_COLOR_PRESETS.find(
        (p) => !assignedColors.has(p.value.toLowerCase())
      );
      setColor(availablePreset ? availablePreset.value : '#10b981');
    }
  }, [editingProject, isProjectModalOpen]);

  if (!isProjectModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      await updateProject({
        ...editingProject,
        name: name.trim(),
        description: description.trim() || undefined,
        localPath: localPath.trim() || undefined,
        color,
      });
    } else {
      const proj = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        localPath: localPath.trim() || undefined,
        color,
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

  const activePresetMatch = PROJECT_COLOR_PRESETS.find(
    (p) => p.value.toLowerCase() === color.toLowerCase()
  );

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
            <Folder className="w-4 h-4" style={{ color }} />
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
              <span className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa] font-medium">
                {activePresetMatch ? activePresetMatch.name : `Custom (${color})`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap p-2 rounded-[8px] bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a]">
              {PROJECT_COLOR_PRESETS.map((preset) => {
                const isAssigned = assignedColors.has(preset.value.toLowerCase());
                const isSelected = color.toLowerCase() === preset.value.toLowerCase();

                return (
                  <Tooltip key={preset.value}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={isAssigned && !isSelected}
                        onClick={() => setColor(preset.value)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all relative ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1f] ring-[#111827] dark:ring-white scale-110 shadow-xs'
                            : isAssigned
                            ? 'opacity-25 cursor-not-allowed grayscale-[60%]'
                            : 'hover:scale-110 cursor-pointer shadow-2xs'
                        }`}
                        style={{ backgroundColor: preset.value }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[2.5]" />}
                        {isAssigned && !isSelected && (
                          <span className="w-full h-[1.5px] bg-white/80 rotate-45 absolute" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {preset.name} {isAssigned && !isSelected ? '(Already in use)' : ''}
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Custom Color Picker Swatch */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    className={`w-6 h-6 rounded-full flex items-center justify-center border border-[#d1d5db] dark:border-[#3f3f46] transition-all cursor-pointer relative overflow-hidden ${
                      !activePresetMatch
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1f] ring-[#111827] dark:ring-white scale-110 shadow-xs'
                        : 'hover:scale-110 bg-[#ebecee] dark:bg-[#27272a]'
                    }`}
                    style={{
                      backgroundColor: !activePresetMatch ? color : undefined,
                    }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {!activePresetMatch ? (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[2.5]" />
                    ) : (
                      <Pipette className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa]" />
                    )}
                  </label>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Custom Color {!activePresetMatch ? `(${color})` : ''}
                </TooltipContent>
              </Tooltip>
            </div>
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
