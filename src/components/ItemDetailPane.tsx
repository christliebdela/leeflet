import React, { useState, useEffect, useRef } from 'react';
import { useLeafStore } from '../store/useLeafStore';
import {
  X,
  ExternalLink,
  Heading,
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Bug,
  Lightbulb,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Link,
  Code,
  Paperclip,
  Trash2,
  Download,
  Plus,
  Check,
  Eye,
  Folder,
  ChevronDown,
} from 'lucide-react';
import { Item, ItemType, Priority, Status, ChecklistItem, Attachment } from '../types';
import {
  formatFullDate,
  formatFileSize,
  ITEM_TYPE_CONFIG,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from '../utils/format';
import { Checkbox } from './ui/Checkbox';
import { openStickyNoteWindow } from '../utils/window';

const TYPE_ICONS: Record<ItemType, React.FC<{ className?: string }>> = {
  task: CheckSquare,
  bug: Bug,
  idea: Lightbulb,
  improvement: Sparkles,
  research: BookOpen,
  question: HelpCircle,
  note: FileText,
};

export const ItemDetailPane: React.FC = () => {
  const {
    items,
    projects,
    selectedItemId,
    setSelectedItemId,
    updateItem,
    deleteItem,
  } = useLeafStore();

  const isPaneOpen = Boolean(selectedItemId);
  const currentItem = items.find((i: Item) => i.id === selectedItemId);

  const [activeItem, setActiveItem] = useState<Item | null>(null);

  // Keep the most recent item cached while open or sliding out
  useEffect(() => {
    if (currentItem) {
      setActiveItem(currentItem);
    }
  }, [currentItem]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [type, setType] = useState<ItemType>('task');
  const [priority, setPriority] = useState<Priority>('none');
  const [status, setStatus] = useState<Status>('inbox');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const [openMenu, setOpenMenu] = useState<'project' | 'type' | 'priority' | 'status' | null>(null);

  const paneRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metadataRef = useRef<HTMLDivElement>(null);

  // Sync form state when active item updates
  useEffect(() => {
    if (activeItem) {
      if (document.activeElement !== titleInputRef.current && activeItem.title !== title) {
        setTitle(activeItem.title);
      }
      if (document.activeElement !== textareaRef.current && (activeItem.content || '') !== content) {
        setContent(activeItem.content || '');
      }
      setProjectId(activeItem.projectId);
      setType(activeItem.type);
      setPriority(activeItem.priority);
      setStatus(activeItem.status);
      setChecklist(activeItem.checklist || []);
      setAttachments(activeItem.attachments || []);
    }
  }, [activeItem?.id, activeItem?.updatedAt]);

  const handleClose = () => {
    setSelectedItemId(null);
  };

  // Close image preview on Escape key and handle click outside metadata popovers / sheet
  useEffect(() => {
    if (!isPaneOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewAttachment) {
          setPreviewAttachment(null);
          return;
        }
        if (openMenu) {
          setOpenMenu(null);
          return;
        }
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (metadataRef.current && !metadataRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }

      if (paneRef.current && !paneRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        // Don't close if clicking an item card (item card switches selection smoothly)
        if (target.closest('[data-item-card]')) {
          return;
        }
        // Don't close if clicking a modal/dropdown/popover
        if (target.closest('[data-modal]')) {
          return;
        }
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPaneOpen, previewAttachment, openMenu]);

  const fallbackItem: Item = {
    id: '',
    projectId: '',
    title: '',
    content: '',
    type: 'task',
    priority: 'none',
    status: 'inbox',
    tags: [],
    checklist: [],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const itemToRender = activeItem || fallbackItem;

  // Auto-save helper
  const triggerAutoSave = (patch: Partial<Item>) => {
    if (!itemToRender.id) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const updated: Item = {
        ...itemToRender,
        title: (patch.title !== undefined ? patch.title : title).trim() || 'Untitled',
        content: patch.content !== undefined ? patch.content : content,
        projectId: patch.projectId !== undefined ? patch.projectId : projectId,
        type: patch.type !== undefined ? patch.type : type,
        priority: patch.priority !== undefined ? patch.priority : priority,
        status: patch.status !== undefined ? patch.status : status,
        checklist: patch.checklist !== undefined ? patch.checklist : checklist,
        attachments: patch.attachments !== undefined ? patch.attachments : attachments,
        updatedAt: new Date().toISOString(),
      };
      await updateItem(updated);
      setSaveStatus('saved');
    }, 400);
  };

  const handleFieldChange = async (field: keyof Item, value: any) => {
    if (!itemToRender.id) return;
    const updated: Item = {
      ...itemToRender,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    await updateItem(updated);
  };

  // Checklist Actions
  const addChecklistItem = () => {
    if (!newChecklistText.trim() || !itemToRender.id) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      itemId: itemToRender.id,
      title: newChecklistText.trim(),
      isCompleted: false,
      position: checklist.length,
    };
    const next = [...checklist, newItem];
    setChecklist(next);
    setNewChecklistText('');
    triggerAutoSave({ checklist: next });
  };

  const toggleChecklist = (id: string) => {
    const next = checklist.map((c) =>
      c.id === id ? { ...c, isCompleted: !c.isCompleted } : c
    );
    setChecklist(next);
    triggerAutoSave({ checklist: next });
  };

  const removeChecklistItem = (id: string) => {
    const next = checklist.filter((c) => c.id !== id);
    setChecklist(next);
    triggerAutoSave({ checklist: next });
  };

  // Attachments Actions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !itemToRender.id) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          itemId: itemToRender.id,
          fileName: file.name,
          filePath: base64Data,
          fileSize: file.size,
          mimeType: file.type,
          createdAt: new Date().toISOString(),
        };
        const next = [...attachments, newAttachment];
        setAttachments(next);
        triggerAutoSave({ attachments: next });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    const next = attachments.filter((a) => a.id !== id);
    setAttachments(next);
    triggerAutoSave({ attachments: next });
  };

  // Format Text helper
  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    setContent(newContent);
    triggerAutoSave({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const TypeIcon = TYPE_ICONS[type] || CheckSquare;
  const typeConfig = ITEM_TYPE_CONFIG[type] || ITEM_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.inbox;

  return (
    <>
      <div
        className={`transition-all duration-300 ease-out overflow-hidden flex shrink-0 ${
          isPaneOpen ? 'w-[380px] mr-6 my-2' : 'w-0 mr-0 my-2 pointer-events-none'
        }`}
      >
        <aside
          ref={paneRef}
          className={`w-[380px] h-full bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-modal flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out select-none ${
            isPaneOpen ? 'translate-x-0' : 'translate-x-[400px]'
          }`}
        >
        {/* Top bar */}
        <div className="p-4 border-b border-[#f3f4f6] dark:border-[#27272a] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                triggerAutoSave({ title: e.target.value });
              }}
              placeholder="Item title..."
              className="flex-1 text-base font-bold text-[#111827] dark:text-[#f4f4f5] focus:outline-none bg-transparent hover:bg-[#f9fafb] dark:hover:bg-[#1f1f23] px-1.5 py-1 rounded-[6px] transition-colors"
            />

            <div className="flex items-center gap-1 text-[#6b7280] dark:text-[#a1a1aa]">
              <button
                onClick={() => openStickyNoteWindow(itemToRender.id)}
                title="Detach into Floating Panel"
                className="p-1.5 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClose}
                title="Close"
                className="p-1.5 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metadata Badges Row with Icons & Color Dots */}
          <div className="grid grid-cols-2 gap-2 text-xs relative" ref={metadataRef}>
            {/* Project Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'project' ? null : 'project')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Folder className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                  <span className="truncate">{selectedProject?.name || 'No Project'}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {openMenu === 'project' && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 max-h-48 overflow-y-auto custom-scrollbar">
                  <button
                    onClick={() => {
                      setProjectId('');
                      handleFieldChange('projectId', '');
                      setOpenMenu(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                      !projectId
                        ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
                        : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                    }`}
                  >
                    <span>No Project</span>
                    {!projectId && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setProjectId(p.id);
                        handleFieldChange('projectId', p.id);
                        setOpenMenu(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between truncate transition-colors ${
                        projectId === p.id
                          ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
                          : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{p.name}</span>
                      </div>
                      {projectId === p.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'type' ? null : 'type')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <TypeIcon className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0" />
                  <span className="capitalize truncate">{typeConfig.label}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {openMenu === 'type' && (
                <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5">
                  {(['task', 'bug', 'idea', 'improvement', 'research', 'question', 'note'] as ItemType[]).map((t) => {
                    const ItemIcon = TYPE_ICONS[t];
                    const cfg = ITEM_TYPE_CONFIG[t];
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setType(t);
                          handleFieldChange('type', t);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs capitalize flex items-center justify-between transition-colors ${
                          type === t
                            ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          <span>{cfg.label}</span>
                        </div>
                        {type === t && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.dotColor}`} />
                  <span className="capitalize truncate">{priorityConfig.label}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {openMenu === 'priority' && (
                <div className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5">
                  {(['none', 'low', 'medium', 'high', 'critical'] as Priority[]).map((p) => {
                    const pCfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setPriority(p);
                          handleFieldChange('priority', p);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs capitalize flex items-center justify-between transition-colors ${
                          priority === p
                            ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${pCfg.dotColor}`} />
                          <span>{pCfg.label}</span>
                        </div>
                        {priority === p && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dotColor}`} />
                  <span className="capitalize truncate">{statusConfig.label}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {openMenu === 'status' && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5">
                  {(['inbox', 'planned', 'in_progress', 'done', 'archived'] as Status[]).map((s) => {
                    const sCfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setStatus(s);
                          handleFieldChange('status', s);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs capitalize flex items-center justify-between transition-colors ${
                          status === s
                            ? 'bg-[#111827] text-white dark:bg-white dark:text-[#111827] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${sCfg.dotColor}`} />
                          <span>{sCfg.label}</span>
                        </div>
                        {status === s && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-[#9ca3af] dark:text-[#71717a]">
            Created {formatFullDate(itemToRender.createdAt)}
          </div>
        </div>

        {/* Editor & Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Markdown Toolbar */}
          <div className="flex items-center gap-1 py-1 px-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#4b5563] dark:text-[#a1a1aa]">
            <button
              onClick={() => applyFormatting('# ')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Heading"
            >
              <Heading className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => applyFormatting('**', '**')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => applyFormatting('*', '*')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-[#e5e7eb] dark:bg-[#27272a] mx-0.5" />
            <button
              onClick={() => applyFormatting('- ')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => applyFormatting('1. ')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => applyFormatting('- [ ] ')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Task List"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-[#e5e7eb] dark:bg-[#27272a] mx-0.5" />
            <button
              onClick={() => applyFormatting('[', '](url)')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Link"
            >
              <Link className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => applyFormatting('`', '`')}
              className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              triggerAutoSave({ content: e.target.value });
            }}
            placeholder="Add details, notes, links, or markdown content..."
            className="w-full h-44 p-2 bg-transparent text-[#111827] dark:text-[#f4f4f5] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-xs focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] resize-none font-mono placeholder:font-sans placeholder:text-[#9ca3af] dark:placeholder:text-[#71717a]"
          />

          {/* Checklist Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
              <span>Checklist</span>
              <span className="text-[10px] font-normal text-[#9ca3af] dark:text-[#71717a]">
                {checklist.filter((c: ChecklistItem) => c.isCompleted).length}/{checklist.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {checklist.map((item: ChecklistItem) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-1.5 hover:bg-[#f9fafb] dark:hover:bg-[#1f1f23] rounded-[4px] text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={item.isCompleted}
                      onChange={() => toggleChecklist(item.id)}
                    >
                      <span
                        className={`truncate ${
                          item.isCompleted
                            ? 'line-through text-[#9ca3af] dark:text-[#71717a]'
                            : 'text-[#374151] dark:text-[#e4e4e7]'
                        }`}
                      >
                        {item.title}
                      </span>
                    </Checkbox>
                  </div>
                  <button
                    onClick={() => removeChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9ca3af] hover:text-rose-600 transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add checklist input */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                  placeholder="Add checklist item..."
                  className="flex-1 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[4px] px-2 py-1 text-xs text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                />
                <button
                  onClick={addChecklistItem}
                  className="p-1 bg-[#f3f4f6] dark:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] rounded-[4px] text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
              <span>Attachments</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] font-normal text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white"
              >
                <Plus className="w-3 h-3" />
                <span>Upload</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
            </div>

            {attachments.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] p-3 text-center cursor-pointer hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors"
              >
                <Paperclip className="w-4 h-4 mx-auto text-[#9ca3af] mb-1" />
                <span className="text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
                  Drop files or click to attach
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {attachments.map((att) => {
                  const isImage =
                    att.mimeType?.startsWith('image/') ||
                    att.filePath?.startsWith('data:image/') ||
                    /\.(png|jpe?g|gif|webp|svg)$/i.test(att.fileName);

                  return (
                    <div
                      key={att.id}
                      className="group flex items-center justify-between p-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[4px] text-xs transition-colors"
                    >
                      <div
                        onClick={() => isImage && setPreviewAttachment(att)}
                        className={`flex items-center gap-2 truncate flex-1 min-w-0 ${
                          isImage ? 'cursor-pointer' : ''
                        }`}
                      >
                        {isImage && att.filePath ? (
                          <div className="w-6 h-6 rounded overflow-hidden shrink-0 border border-[#e5e7eb] dark:border-[#27272a] relative bg-black/5">
                            <img
                              src={att.filePath}
                              alt={att.fileName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        ) : (
                          <Paperclip className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            isImage
                              ? 'group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium'
                              : 'text-[#374151] dark:text-[#d4d4d8]'
                          }`}
                        >
                          {att.fileName}
                        </span>
                        {att.fileSize && (
                          <span className="text-[10px] text-[#9ca3af] shrink-0">
                            {formatFileSize(att.fileSize)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {att.filePath && (
                          <a
                            href={att.filePath}
                            download={att.fileName}
                            className="p-1 text-[#9ca3af] hover:text-[#111827] dark:hover:text-white"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => removeAttachment(att.id)}
                          className="p-1 text-[#9ca3af] hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-[#10b981]">
            <Check className="w-3.5 h-3.5" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFieldChange('status', 'archived')}
              className="px-2.5 py-1 text-xs text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[4px] transition-colors"
            >
              Archive
            </button>
            <button
              onClick={() => deleteItem(itemToRender.id)}
              className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[4px] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </aside>
    </div>

      {/* Full image preview lightbox modal */}
      {previewAttachment && (
        <div
          onClick={() => setPreviewAttachment(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-100"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3"
          >
            <div className="flex items-center justify-between w-full text-white text-xs px-2">
              <span className="truncate max-w-md font-medium">{previewAttachment.fileName}</span>
              <div className="flex items-center gap-2">
                {previewAttachment.filePath && (
                  <a
                    href={previewAttachment.filePath}
                    download={previewAttachment.fileName}
                    className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <img
              src={previewAttachment.filePath || ''}
              alt={previewAttachment.fileName}
              className="max-h-[80vh] max-w-full object-contain rounded-[6px] border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
