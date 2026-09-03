import React, { useState, useEffect, useRef } from 'react';
import { ProjectComponent, TeamMember } from '../types';
import { useComponentStore } from '../store/useComponentStore';
import { getActiveTeamMembers } from '../utils/team';
import { resolveAvatarUrl } from '../utils/avatars';
import { X, Layers, Check, ChevronDown, Trash2, User, Crown } from 'lucide-react';
import { ColorPicker, MODERN_COLOR_PRESETS } from './ui/ColorPicker';

interface ComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  workspaceId: string;
  editingComponent?: ProjectComponent | null;
}

export const ComponentModal: React.FC<ComponentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  workspaceId,
  editingComponent,
}) => {
  const { createComponent, updateComponent, deleteComponent, getComponentsForProject } = useComponentStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isMemberDropOpen, setIsMemberDropOpen] = useState(false);
  const [isLeadDropOpen, setIsLeadDropOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const memberDropRef = useRef<HTMLDivElement>(null);
  const leadDropRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(editingComponent);

  // Load team members
  useEffect(() => {
    if (isOpen) {
      const members = getActiveTeamMembers(workspaceId);
      setTeamMembers(members);
    }
  }, [isOpen, workspaceId]);

  // Populate fields when editing or reset when creating
  useEffect(() => {
    if (isOpen) {
      if (editingComponent) {
        setName(editingComponent.name);
        setDescription(editingComponent.description || '');
        setColor(editingComponent.color || '#3b82f6');
        setLeadId(editingComponent.leadId ?? null);
        setMemberIds(editingComponent.memberIds || []);
      } else {
        setName('');
        setDescription('');
        // Auto-assign random vibrant color if none chosen
        const existingColors = new Set(existingComps.map((c) => c.color).filter(Boolean));
        const available = MODERN_COLOR_PRESETS.filter((p) => !existingColors.has(p.value));
        const pool = available.length > 0 ? available : MODERN_COLOR_PRESETS;
        const randomChoice = pool[Math.floor(Math.random() * pool.length)];
        setColor(randomChoice.value);
        setLeadId(null);
        setMemberIds([]);
      }
      setIsDeleting(false);
      setIsSaving(false);
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [isOpen, editingComponent]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (memberDropRef.current && !memberDropRef.current.contains(e.target as Node)) {
        setIsMemberDropOpen(false);
      }
      if (leadDropRef.current && !leadDropRef.current.contains(e.target as Node)) {
        setIsLeadDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Same-name validation within the same project
  const existingComps = getComponentsForProject(projectId);
  const isDuplicateName = Boolean(name.trim()) && existingComps.some(
    (c) => c.id !== editingComponent?.id && c.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

  const toggleMember = (memberId: string) => {
    setMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
    if (memberIds.includes(memberId) && leadId === memberId) {
      setLeadId(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || isDuplicateName || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        workspaceId,
        projectId,
        name: name.trim(),
        description: description.trim(),
        color: color || MODERN_COLOR_PRESETS[Math.floor(Math.random() * MODERN_COLOR_PRESETS.length)].value,
        leadId,
        memberIds,
      };

      if (isEditing && editingComponent) {
        await updateComponent({ ...editingComponent, ...payload });
      } else {
        await createComponent(payload);
        try {
          localStorage.setItem('leeflet_has_created_component', 'true');
          window.dispatchEvent(new Event('leeflet_component_created'));
        } catch {}
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingComponent) return;
    if (confirm(`Delete module "${editingComponent.name}"? Tasks assigned to it will remain in the project.`)) {
      setIsDeleting(true);
      try {
        await deleteComponent(editingComponent.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (!isOpen) return null;

  const selectedMembers = teamMembers.filter((m) => memberIds.includes(m.id));
  const leadMember = teamMembers.find((m) => m.id === leadId);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-[12px] border border-[#e5e7eb] dark:border-[#27272a] shadow-modal p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f3f4f6] dark:border-[#27272a] pb-3">
          <div className="flex items-center gap-2">
            <Layers
              className="w-4 h-4 text-[#6b7280] dark:text-[#a1a1aa] transition-colors"
              style={color ? { color } : undefined}
            />
            <h2 className="text-sm font-bold text-[#111827] dark:text-[#f4f4f5]">
              {isEditing ? 'Edit Module' : 'New Module'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* Name */}
          <div>
            <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-1">
              Module Name *
            </label>
            <input
              ref={nameRef}
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Auth & Security, Admin, Billing..."
              className={`w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border rounded-[6px] text-[#111827] dark:text-[#f4f4f5] focus:bg-white dark:focus:bg-[#27272a] focus:outline-none ${
                isDuplicateName
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-[#e5e7eb] dark:border-[#27272a]'
              }`}
            />
            {isDuplicateName && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                A module with this name already exists in this project.
              </p>
            )}
          </div>

          {/* Color Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#374151] dark:text-[#d4d4d8]">
                Module Color
              </label>
              {Boolean(color) && color !== '#3b82f6' && (
                <button
                  type="button"
                  onClick={() => setColor('#3b82f6')}
                  className="text-[10px] text-[#6b7280] hover:text-[#111827] dark:text-[#a1a1aa] dark:hover:text-white transition-colors cursor-pointer"
                >
                  Reset to default
                </button>
              )}
            </div>
            <ColorPicker
              value={color}
              onChange={setColor}
              allowDefault={true}
            />
          </div>

          {/* Members */}
          <div>
            <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-1">
              Members <span className="font-normal text-[#6b7280] dark:text-[#a1a1aa]">(optional)</span>
            </label>
            <div className="relative" ref={memberDropRef}>
              <button
                type="button"
                onClick={() => setIsMemberDropOpen(!isMemberDropOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-xs text-left hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                  {selectedMembers.length === 0 ? (
                    <span className="text-[#9ca3af] dark:text-[#71717a]">Select team members...</span>
                  ) : (
                    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                      {selectedMembers.map((m) => {
                        const avatarUrl = resolveAvatarUrl(m.avatarMascot || m.avatarUrl || m.avatarColor, m.name || m.id);
                        return (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#f3f4f6] dark:bg-[#27272a] text-[11px] text-[#374151] dark:text-[#ededef] shrink-0"
                          >
                            {avatarUrl ? (
                              <img src={avatarUrl} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                            ) : (
                              <span
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                                style={{ backgroundColor: m.avatarColor || '#6b7280' }}
                              >
                                {m.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="truncate max-w-[80px]">{m.name.split(' ')[0]}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
              </button>

              {isMemberDropOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-lg z-20 py-1 max-h-44 overflow-y-auto custom-scrollbar">
                  {teamMembers.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-[#9ca3af]">No team members found</div>
                  ) : (
                    teamMembers.map((m) => {
                      const selected = memberIds.includes(m.id);
                      const avatarUrl = resolveAvatarUrl(m.avatarMascot || m.avatarUrl || m.avatarColor, m.name || m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            toggleMember(m.id);
                            setIsMemberDropOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors ${
                            selected ? 'text-[#111827] dark:text-[#ededef] font-medium' : 'text-[#4b5563] dark:text-[#a1a1aa]'
                          }`}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} className="w-5 h-5 rounded-full object-cover shrink-0" />
                          ) : (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                              style={{ backgroundColor: m.avatarColor || '#6b7280' }}
                            >
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="text-xs flex-1 truncate">{m.name}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lead */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-1">
                Module Lead <span className="font-normal text-[#6b7280] dark:text-[#a1a1aa]">(auto-assignee for tasks)</span>
              </label>
              <div className="relative" ref={leadDropRef}>
                <button
                  type="button"
                  onClick={() => setIsLeadDropOpen(!isLeadDropOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-xs text-left hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {leadMember ? (
                      <>
                        <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                          style={{ backgroundColor: leadMember.avatarColor || '#6b7280' }}
                        >
                          {leadMember.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-xs text-[#111827] dark:text-[#ededef] truncate">{leadMember.name}</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-[#9ca3af] dark:text-[#71717a]" />
                        <span className="text-xs text-[#9ca3af] dark:text-[#71717a]">No lead — shared ownership</span>
                      </>
                    )}
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                </button>

                {isLeadDropOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[8px] shadow-lg z-20 py-1">
                    <button
                      type="button"
                      onClick={() => { setLeadId(null); setIsLeadDropOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] text-xs transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>No lead</span>
                      {!leadId && <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                    </button>
                    {selectedMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setLeadId(m.id); setIsLeadDropOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors ${
                          leadId === m.id ? 'text-[#111827] dark:text-[#ededef] font-medium' : 'text-[#4b5563] dark:text-[#a1a1aa]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                          style={{ backgroundColor: m.avatarColor || '#6b7280' }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-xs flex-1 truncate">{m.name}</span>
                        {leadId === m.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="font-semibold text-[#374151] dark:text-[#d4d4d8] block mb-1">
              Description <span className="font-normal text-[#6b7280] dark:text-[#a1a1aa]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this module cover?"
              rows={2}
              className="w-full px-3 py-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#111827] dark:text-[#f4f4f5] placeholder-[#9ca3af] focus:bg-white dark:focus:bg-[#27272a] focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f6] dark:border-[#27272a]">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 py-1.5 px-2 rounded-[6px] hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting…' : 'Delete'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-[#e5e7eb] dark:border-[#27272a] text-[#374151] dark:text-[#d4d4d8] rounded-[6px] font-semibold hover:bg-[#f9fafb] dark:hover:bg-[#27272a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isDuplicateName || isSaving}
                className="px-4 py-1.5 bg-[#111827] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-[#e4e4e7] text-white dark:text-[#111827] rounded-[6px] font-semibold shadow-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Module'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
