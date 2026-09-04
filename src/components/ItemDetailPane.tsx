import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
  Save,
  Undo2,
  Redo2,
  Calendar as CalendarIcon,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import { Item, ItemType, Priority, Status, ChecklistItem, Attachment, TeamMember } from '../types';
import { useComponentStore } from '../store/useComponentStore';
import { getUserPermissions } from '../utils/permissions';
import {
  formatFullDate,
  formatFileSize,
  formatDueDateLabel,
  ITEM_TYPE_CONFIG,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from '../utils/format';
import { getActiveTeamMembers, matchesAssignee, normalizeAssigneeId } from '../utils/team';
import { resolveAvatarUrl } from '../utils/avatars';
import { Checkbox } from './ui/Checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Calendar } from './ui/calendar';
import { markdownToHtml, htmlToMarkdown, autoLinkHtml } from '../utils/markdown';
import { soundService } from '../utils/audio';
import { openUrl } from '@tauri-apps/plugin-opener';

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
    workspace,
    selectedItemId,
    setSelectedItemId,
    updateItem,
    deleteItem,
    setItemToDelete,
    createProject,
  } = useLeafStore();

  const permissions = getUserPermissions(workspace?.id);

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
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const [openMenu, setOpenMenu] = useState<'project' | 'type' | 'priority' | 'status' | 'assignee' | 'component' | 'dueDate' | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [componentId, setComponentId] = useState<string | null>(null);

  // Component store
  const { getComponentsForProject, loadComponents } = useComponentStore();

  const paneRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metadataRef = useRef<HTMLDivElement>(null);
  const newProjectInputRef = useRef<HTMLInputElement>(null);
  const lastLoadedItemIdRef = useRef<string | null>(null);

  // Undo / Redo history tracking for rich editor
  const historyRef = useRef<{ stack: string[]; index: number; isPerformingUndoRedo: boolean }>({
    stack: [],
    index: -1,
    isPerformingUndoRedo: false,
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastSnapshotTimeRef = useRef<number>(0);

  const updateCanUndoRedo = () => {
    setCanUndo(historyRef.current.index > 0);
    setCanRedo(historyRef.current.index < historyRef.current.stack.length - 1);
  };

  const pushHistory = (newHtml: string, force: boolean = false) => {
    if (historyRef.current.isPerformingUndoRedo) return;
    const { stack, index } = historyRef.current;
    if (index >= 0 && stack[index] === newHtml) return;

    const now = Date.now();
    const shouldDebounce = !force && (now - lastSnapshotTimeRef.current < 600) && index > 0;

    if (shouldDebounce) {
      stack[index] = newHtml;
    } else {
      const nextStack = stack.slice(0, index + 1);
      nextStack.push(newHtml);
      if (nextStack.length > 50) nextStack.shift();
      historyRef.current.stack = nextStack;
      historyRef.current.index = nextStack.length - 1;
      lastSnapshotTimeRef.current = now;
    }
    updateCanUndoRedo();
  };

  const handleUndo = () => {
    const { stack, index } = historyRef.current;
    if (index > 0) {
      const prevIndex = index - 1;
      historyRef.current.isPerformingUndoRedo = true;
      historyRef.current.index = prevIndex;
      const prevHtml = stack[prevIndex];
      if (editorRef.current) {
        editorRef.current.innerHTML = prevHtml;
      }
      const md = htmlToMarkdown(prevHtml);
      setContent(md);
      triggerAutoSave({ content: md });
      updateCanUndoRedo();
      setTimeout(() => {
        historyRef.current.isPerformingUndoRedo = false;
      }, 20);
    }
  };

  const handleRedo = () => {
    const { stack, index } = historyRef.current;
    if (index < stack.length - 1) {
      const nextIndex = index + 1;
      historyRef.current.isPerformingUndoRedo = true;
      historyRef.current.index = nextIndex;
      const nextHtml = stack[nextIndex];
      if (editorRef.current) {
        editorRef.current.innerHTML = nextHtml;
      }
      const md = htmlToMarkdown(nextHtml);
      setContent(md);
      triggerAutoSave({ content: md });
      updateCanUndoRedo();
      setTimeout(() => {
        historyRef.current.isPerformingUndoRedo = false;
      }, 20);
    }
  };

  const handleCreateProject = async () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    try {
      const proj = await createProject({ name: trimmed });
      setProjectId(proj.id);
      handleFieldChange('projectId', proj.id);
      setNewProjectName('');
      setIsCreatingProject(false);
      setOpenMenu(null);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  // Sync form state when active item updates
  useEffect(() => {
    if (activeItem) {
      const isDifferentItem = activeItem.id !== lastLoadedItemIdRef.current;
      lastLoadedItemIdRef.current = activeItem.id;

      if (isDifferentItem) {
        setTitle(activeItem.title);
        const itemContent = activeItem.content || '';
        setContent(itemContent);
        const html = markdownToHtml(itemContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
        }
        historyRef.current = {
          stack: [html],
          index: 0,
          isPerformingUndoRedo: false,
        };
        lastSnapshotTimeRef.current = Date.now();
        updateCanUndoRedo();
      } else {
        if (document.activeElement !== titleInputRef.current && activeItem.title !== title) {
          setTitle(activeItem.title);
        }
      }

      setProjectId(activeItem.projectId);
      setType(activeItem.type);
      setPriority(activeItem.priority);
      setStatus(activeItem.status);
      setAssigneeId(activeItem.assigneeId || null);
      setComponentId(activeItem.componentId || null);
      setDueAt(activeItem.dueAt || null);
      setChecklist(activeItem.checklist || []);
      setAttachments(activeItem.attachments || []);
      setTeamMembers(getActiveTeamMembers(workspace?.id));
      // Load components for this project
      loadComponents(activeItem.projectId);
    } else {
      lastLoadedItemIdRef.current = null;
    }
  }, [activeItem?.id, activeItem?.updatedAt, workspace?.id]);

  // Precise dynamic auto-resize based on current wrapped lines & container width
  useLayoutEffect(() => {
    const el = titleInputRef.current;
    if (!el) return;

    let isDisposed = false;

    const adjustHeight = () => {
      if (isDisposed || !el) return;
      el.style.height = 'auto';
      if (el.scrollHeight > 0) {
        el.style.height = `${el.scrollHeight}px`;
      }
    };

    adjustHeight();

    // Observe width changes as pane animates / expands so height stays perfectly snug with zero gap
    const observer = new ResizeObserver(() => {
      adjustHeight();
    });

    observer.observe(el);

    const r1 = requestAnimationFrame(adjustHeight);
    const t1 = setTimeout(adjustHeight, 150);
    const t2 = setTimeout(adjustHeight, 320);

    return () => {
      isDisposed = true;
      observer.disconnect();
      cancelAnimationFrame(r1);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [title, isPaneOpen]);

  const handleClose = () => {
    setSelectedItemId(null);
  };

  // Close image preview / menu on Escape key and close metadata menu on outside click
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
  const canEdit = permissions.canEditItem(itemToRender);
  const canDelete = permissions.canDeleteItem(itemToRender);

  // Auto-save helper
  const triggerAutoSave = (patch: Partial<Item>) => {
    if (!itemToRender.id || !canEdit) return;
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const updated: Item = {
        ...itemToRender,
        title: (patch.title !== undefined ? patch.title : title).trim() || 'Untitled',
        content: patch.content !== undefined ? patch.content : content,
        projectId: patch.projectId !== undefined ? patch.projectId : projectId,
        componentId: patch.componentId !== undefined ? patch.componentId : componentId,
        type: patch.type !== undefined ? patch.type : type,
        priority: patch.priority !== undefined ? patch.priority : priority,
        status: patch.status !== undefined ? patch.status : status,
        assigneeId: patch.assigneeId !== undefined ? patch.assigneeId : assigneeId,
        dueAt: patch.dueAt !== undefined ? patch.dueAt : dueAt,
        checklist: patch.checklist !== undefined ? patch.checklist : checklist,
        attachments: patch.attachments !== undefined ? patch.attachments : attachments,
        updatedAt: new Date().toISOString(),
      };
      await updateItem(updated);
      setSaveStatus('saved');
    }, 400);
  };

  const handleFieldChange = async (field: keyof Item, value: any) => {
    if (!itemToRender.id || !canEdit) return;
    if (field === 'status' && value === 'done' && itemToRender.status !== 'done') {
      soundService.playCompletionChime();
    }
    const updated: Item = {
      ...itemToRender,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    await updateItem(updated);
  };

  // Checklist Actions
  const addChecklistItem = () => {
    if (!canEdit || !newChecklistText.trim() || !itemToRender.id) return;
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
    if (!canEdit) return;
    const target = checklist.find((c) => c.id === id);
    if (target && !target.isCompleted) {
      soundService.playCompletionChime();
    }
    const next = checklist.map((c) =>
      c.id === id ? { ...c, isCompleted: !c.isCompleted } : c
    );
    setChecklist(next);
    triggerAutoSave({ checklist: next });
  };

  const removeChecklistItem = (id: string) => {
    if (!canEdit) return;
    const next = checklist.filter((c) => c.id !== id);
    setChecklist(next);
    triggerAutoSave({ checklist: next });
  };

  // Attachments Actions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
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
    if (!canEdit) return;
    const next = attachments.filter((a) => a.id !== id);
    setAttachments(next);
    triggerAutoSave({ attachments: next });
  };

  // Rich WYSIWYG Formatting helper
  const applyRichCommand = (command: string, value: string = '') => {
    if (!canEdit) return;
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    if (command === 'code') {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || '';
      if (selectedText) {
        const escaped = selectedText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        document.execCommand('insertHTML', false, `<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">${escaped}</code>`);
      } else {
        document.execCommand('insertHTML', false, `<code class="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">code</code>`);
      }
    } else {
      document.execCommand(command, false, value);
    }

    const rawHtml = editor.innerHTML;
    pushHistory(rawHtml, true);
    const md = htmlToMarkdown(rawHtml);
    setContent(md);
    triggerAutoSave({ content: md });
  };

  const handleLinkButtonClick = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    const selectedText = selection?.toString()?.trim() || '';

    if (selectedText) {
      let finalUrl = selectedText;
      if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      document.execCommand('createLink', false, finalUrl);
    } else {
      document.execCommand(
        'insertHTML',
        false,
        '<a href="https://example.com" style="color: #60a5fa; text-decoration: underline;">https://example.com</a>\u00A0'
      );
    }

    const rawHtml = editor.innerHTML;
    pushHistory(rawHtml, true);
    const md = htmlToMarkdown(rawHtml);
    setContent(md);
    triggerAutoSave({ content: md });
  };

  // Open clicked links in user's default browser (guaranteeing single tab)
  const handleEditorClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.href) {
      e.preventDefault();
      e.stopPropagation();
      const href = anchor.href;
      try {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(href);
      } catch {
        window.open(href, '_blank');
      }
    }
  };

  const handleEditorMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor && anchor.href) {
      // Prevent contenteditable text caret from overriding link pointer
      e.stopPropagation();
    }
  };

  // Instantly format URLs into links when user presses Space or Enter, including merged edits
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Undo / Redo shortcuts
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      if (e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      } else {
        e.preventDefault();
        handleUndo();
        return;
      }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      handleRedo();
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || !selection.isCollapsed || !selection.anchorNode) return;

      const anchorNode = selection.anchorNode;

      // Case 1: Cursor is inside an existing <a> tag (user edited inside link)
      if (anchorNode.parentElement?.tagName === 'A') {
        const anchorEl = anchorNode.parentElement as HTMLAnchorElement;
        const currentLinkText = anchorEl.textContent?.trim() || '';
        if (currentLinkText) {
          e.preventDefault();
          let href = currentLinkText;
          if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
            href = 'https://' + href;
          }
          anchorEl.href = href;

          const trailingNode = e.key === ' '
            ? document.createTextNode('\u00A0')
            : document.createElement('br');

          anchorEl.after(trailingNode);

          const newRange = document.createRange();
          newRange.setStartAfter(trailingNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          if (editorRef.current) {
            const rawHtml = editorRef.current.innerHTML;
            pushHistory(rawHtml, true);
            const md = htmlToMarkdown(rawHtml);
            setContent(md);
            triggerAutoSave({ content: md });
          }
          return;
        }
      }

      // Case 2: Cursor is in a text node
      if (anchorNode.nodeType === Node.TEXT_NODE) {
        const fullText = anchorNode.textContent || '';
        const cursorOffset = selection.anchorOffset;
        const textBeforeCursor = fullText.slice(0, cursorOffset);

        // Check if there is an immediately preceding <a> tag (e.g. <a ...>text.co</a>m)
        const prevSibling = anchorNode.previousSibling as HTMLElement | null;
        let prevAnchorText = '';
        if (prevSibling && prevSibling.tagName === 'A') {
          prevAnchorText = prevSibling.textContent || '';
        }

        const combinedText = prevAnchorText + textBeforeCursor;

        // Match the last word before cursor: https://..., http://..., www...., or domain.tld
        const match = combinedText.match(/(?:^|\s)((https?:\/\/|www\.)[^\s<]+|(?:[a-zA-Z0-9-]+\.)+(com|org|net|io|dev|app|ai|co|me|xyz|tech|info|edu|gov|ca|uk|de|jp|fr|au|us|site|online|space|store)(?:\/[^\s<]*)?)$/i);

        if (match) {
          e.preventDefault();
          const matchedUrl = match[1];

          let href = matchedUrl;
          if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
            href = 'https://' + href;
          }

          // If we merged with a preceding <a> tag, remove the old <a> tag
          if (prevSibling && prevSibling.tagName === 'A') {
            prevSibling.remove();
          }

          const wordStartIndex = prevAnchorText ? 0 : cursorOffset - matchedUrl.length;

          const range = document.createRange();
          range.setStart(anchorNode, Math.max(0, wordStartIndex));
          range.setEnd(anchorNode, cursorOffset);
          range.deleteContents();

          const a = document.createElement('a');
          a.href = href;
          a.style.color = '#60a5fa';
          a.style.textDecoration = 'underline';
          a.className = 'cursor-pointer text-blue-500 hover:underline';
          a.textContent = matchedUrl;

          const trailingNode = e.key === ' '
            ? document.createTextNode('\u00A0')
            : document.createElement('br');

          range.insertNode(trailingNode);
          range.insertNode(a);

          const newRange = document.createRange();
          newRange.setStartAfter(trailingNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          if (editorRef.current) {
            const rawHtml = editorRef.current.innerHTML;
            pushHistory(rawHtml, true);
            const md = htmlToMarkdown(rawHtml);
            setContent(md);
            triggerAutoSave({ content: md });
          }
        }
      }
    }
  };

  // Ensure all bare URLs are linked when user blurs/clicks away
  const handleEditorBlur = () => {
    if (editorRef.current) {
      const linked = autoLinkHtml(editorRef.current.innerHTML);
      if (linked !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = linked;
        pushHistory(linked, true);
      }
      const md = htmlToMarkdown(editorRef.current.innerHTML);
      setContent(md);
      triggerAutoSave({ content: md });
    }
  };

  // Handle paste: Smart URL auto-linking on highlighted text or plain text
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text/plain').trim();
    if (/^(https?:\/\/|www\.)/i.test(pastedText) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(pastedText)) {
      const selection = window.getSelection();
      let finalUrl = pastedText;
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }

      if (selection && selection.toString().trim().length > 0) {
        e.preventDefault();
        document.execCommand('createLink', false, finalUrl);
        if (editorRef.current) {
          const rawHtml = editorRef.current.innerHTML;
          pushHistory(rawHtml, true);
          const md = htmlToMarkdown(rawHtml);
          setContent(md);
          triggerAutoSave({ content: md });
        }
      }
    }
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
          isPaneOpen ? 'w-[360px] pl-2 pr-3 pb-3 pt-0' : 'w-0 pl-0 pr-0 pb-0 pt-0 pointer-events-none'
        }`}
      >
        <aside
          ref={paneRef}
          className={`w-[352px] h-full bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-modal flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out select-none ${
            isPaneOpen ? 'translate-x-0' : 'translate-x-[400px]'
          }`}
        >
        {/* Top Header Actions */}
        <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[#6b7280] dark:text-[#a1a1aa]">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#9ca3af] dark:text-[#71717a] truncate">
            {selectedProject ? (
              <span className="truncate">{selectedProject.name}</span>
            ) : (
              <span>Details</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Detach panel button (commented out - keeping single mini mode)
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openStickyNoteWindow(itemToRender.id)}
                  className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Detach panel</p>
              </TooltipContent>
            </Tooltip>
            */}

            {itemToRender.githubIssueNumber && (
              <a
                href={itemToRender.githubIssueUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  if (itemToRender.githubIssueUrl) {
                    try {
                      openUrl(itemToRender.githubIssueUrl);
                    } catch {
                      window.open(itemToRender.githubIssueUrl, '_blank');
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#f4f5f6] dark:bg-[#202024] hover:bg-[#ebecee] dark:hover:bg-[#27272a] text-[#4b5563] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white border border-[#e5e7eb] dark:border-[#27272a] text-[11px] font-mono transition-colors mr-1 cursor-pointer"
                title={`View GitHub Issue #${itemToRender.githubIssueNumber}${itemToRender.githubIssueState ? ` (${itemToRender.githubIssueState})` : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-80 shrink-0">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>#{itemToRender.githubIssueNumber}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            )}

            <button
              onClick={handleClose}
              className="p-1 rounded-[4px] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] hover:text-[#111827] dark:hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Only Banner for Viewers */}
        {!canEdit && (
          <div className="mx-3 mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 rounded-[6px] text-xs font-medium shrink-0 select-none">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>View Only — You have Viewer permissions in this workspace</span>
          </div>
        )}

        {/* Title & Metadata Section */}
        <div className="px-3 pb-2.5 pt-0.5 border-b border-[#f3f4f6] dark:border-[#27272a] flex flex-col gap-2">
          {/* Full-width Title Textarea */}
          <textarea
            ref={titleInputRef}
            rows={1}
            value={title}
            readOnly={!canEdit}
            onChange={(e) => {
              if (!canEdit) return;
              setTitle(e.target.value);
              triggerAutoSave({ title: e.target.value });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                editorRef.current?.focus();
              }
            }}
            placeholder="Item title..."
            className={`w-full ${
              title.length > 50 ? 'text-[13.5px] font-bold tracking-tight leading-snug' : 'text-[15px] font-bold tracking-tight leading-snug'
            } text-[#09090b] dark:text-[#fafafa] placeholder:font-normal placeholder:text-[#9ca3af] dark:placeholder:text-[#52525b] focus:outline-none bg-transparent hover:bg-[#f9fafb] dark:hover:bg-[#1f1f23] px-1.5 py-0.5 rounded-[5px] transition-colors resize-none [field-sizing:content] max-h-[140px] overflow-y-auto custom-scrollbar m-0 block ${
              !canEdit ? 'cursor-default select-text' : ''
            }`}
          />

          {/* Metadata Badges Row with Icons & Color Dots */}
          <div className="grid grid-cols-2 gap-2 text-xs relative" ref={metadataRef}>
            {/* Project Selector */}
            <div className="relative">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setOpenMenu(openMenu === 'project' ? null : 'project')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Folder
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: selectedProject?.color || '#6b7280' }}
                  />
                  <span className="truncate">{selectedProject?.name || 'No Project'}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {openMenu === 'project' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 max-h-56 overflow-y-auto custom-scrollbar">
                  <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-0.5">
                    <button
                      onClick={() => {
                        setProjectId('');
                        handleFieldChange('projectId', '');
                        setOpenMenu(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                        !projectId
                          ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
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
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: p.color || '#6b7280' }}
                          />
                          <span className="truncate">{p.name}</span>
                        </div>
                        {projectId === p.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Inline New Project Creator */}
                  <div className="pt-1 mt-1 border-t border-[#f3f4f6] dark:border-[#27272a]">
                    {isCreatingProject ? (
                      <div className="p-1">
                        <div className="flex items-center gap-1">
                          <input
                            ref={newProjectInputRef}
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateProject();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsCreatingProject(false);
                                setNewProjectName('');
                              }
                            }}
                            placeholder="Project name..."
                            className="w-full bg-[#f9fafb] dark:bg-[#141416] border border-[#e5e7eb] dark:border-[#27272a] rounded-[4px] px-2 py-1 text-xs text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreateProject}
                            disabled={!newProjectName.trim()}
                            className="px-2 py-1 bg-[#111827] text-white dark:bg-white dark:text-[#111827] rounded-[4px] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingProject(true);
                          setTimeout(() => newProjectInputRef.current?.focus(), 50);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center gap-2 text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Project</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Type Selector */}
            <div className="relative">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setOpenMenu(openMenu === 'type' ? null : 'type')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
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
                disabled={!canEdit}
                onClick={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
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
                disabled={!canEdit}
                onClick={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
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

            {/* Component Selector */}
            {(() => {
              const projectComps = getComponentsForProject(projectId);
              if (projectComps.length === 0) return null;
              const currentComp = projectComps.find(c => c.id === componentId);
              return (
                <div className="relative">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setOpenMenu(openMenu === 'component' ? null : 'component')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {currentComp ? (
                        <>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: currentComp.color || '#71717a' }}
                          />
                          <span className="truncate">{currentComp.name}</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0 opacity-80" />
                          <span className="truncate">No Module</span>
                        </>
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                  </button>

                  {openMenu === 'component' && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5 max-h-52 overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setComponentId(null);
                          triggerAutoSave({ componentId: null });
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                          !componentId
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 opacity-60" />
                          <span>No Module</span>
                        </div>
                        {!componentId && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>

                      {projectComps.map((comp) => (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => {
                            setComponentId(comp.id);
                            triggerAutoSave({ componentId: comp.id });
                            setOpenMenu(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                            componentId === comp.id
                              ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                              : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: comp.color || '#71717a' }}
                            />
                            <span className="truncate">{comp.name}</span>
                          </div>
                          {componentId === comp.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Assignee Selector */}
            <div className="relative">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setOpenMenu(openMenu === 'assignee' ? null : 'assignee')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {assigneeId ? (
                    <span className="w-3.5 h-3.5 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden">
                      <img
                        src={resolveAvatarUrl(
                          teamMembers.find((m) => matchesAssignee(m.id, assigneeId))?.avatarMascot ||
                          teamMembers.find((m) => matchesAssignee(m.id, assigneeId))?.avatarUrl ||
                          teamMembers.find((m) => matchesAssignee(m.id, assigneeId))?.avatarColor,
                          teamMembers.find((m) => matchesAssignee(m.id, assigneeId))?.name || assigneeId
                        )}
                        alt={teamMembers.find((m) => matchesAssignee(m.id, assigneeId))?.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </span>
                  ) : (
                    <User className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#a1a1aa] shrink-0 opacity-80" />
                  )}
                  <span className="truncate">
                    {teamMembers.find((m) => matchesAssignee(m.id, assigneeId))?.name || 'Assignee'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {openMenu === 'assignee' && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] shadow-modal p-1 z-50 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      setAssigneeId(null);
                      handleFieldChange('assigneeId', null);
                      setOpenMenu(null);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                      !assigneeId
                        ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                        : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 opacity-60" />
                      <span>Unassigned</span>
                    </div>
                    {!assigneeId && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>

                  {teamMembers.map((member) => {
                    const isSelected = matchesAssignee(member.id, assigneeId);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          const normalizedId = normalizeAssigneeId(member.id);
                          setAssigneeId(normalizedId);
                          handleFieldChange('assigneeId', normalizedId);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#f4f5f6] dark:bg-[#27272a] text-[#111827] dark:text-[#f4f4f5] font-semibold'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-3.5 h-3.5 rounded-full border border-[#e5e7eb] dark:border-[#323238] shrink-0 overflow-hidden">
                            <img
                              src={resolveAvatarUrl(member.avatarMascot || member.avatarUrl || member.avatarColor, member.name || member.id)}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </span>
                          <span className="truncate">{member.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Due Date Selector */}
            <div className="relative">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setOpenMenu(openMenu === 'dueDate' ? null : 'dueDate')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#f4f5f6] dark:bg-[#27272a] border border-transparent hover:border-[#d1d5db] dark:hover:border-[#3f3f46] transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                  dueAt
                    ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-[#111827] dark:text-[#f4f4f5]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <CalendarIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span className="truncate">{formatDueDateLabel(dueAt)}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {openMenu === 'dueDate' && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[10px] shadow-2xl p-2 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="grid grid-cols-3 gap-1 pb-1.5 border-b border-[#f3f4f6] dark:border-[#27272a]">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date().toISOString().slice(0, 10);
                        setDueAt(d);
                        handleFieldChange('dueAt', d);
                        setOpenMenu(null);
                      }}
                      className="py-1 px-1 rounded-[5px] text-[11px] font-medium text-center text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      Today
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        const str = d.toISOString().slice(0, 10);
                        setDueAt(str);
                        handleFieldChange('dueAt', str);
                        setOpenMenu(null);
                      }}
                      className="py-1 px-1 rounded-[5px] text-[11px] font-medium text-center text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      Tomorrow
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        const diff = (1 - d.getDay() + 7) % 7 || 7;
                        d.setDate(d.getDate() + diff);
                        const str = d.toISOString().slice(0, 10);
                        setDueAt(str);
                        handleFieldChange('dueAt', str);
                        setOpenMenu(null);
                      }}
                      className="py-1 px-1 rounded-[5px] text-[11px] font-medium text-center text-[#374151] dark:text-[#d4d4d8] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] transition-colors"
                    >
                      Next Mon
                    </button>
                  </div>

                  {/* Shadcn Calendar Component */}
                  <Calendar
                    mode="single"
                    selected={dueAt ? new Date(dueAt + 'T00:00:00') : null}
                    onSelect={(d) => {
                      if (d) {
                        const val = format(d, 'yyyy-MM-dd');
                        setDueAt(val);
                        handleFieldChange('dueAt', val);
                      } else {
                        setDueAt(null);
                        handleFieldChange('dueAt', null);
                      }
                      setOpenMenu(null);
                    }}
                    className="p-0 border-0"
                  />

                  {dueAt && (
                    <div className="pt-1.5 border-t border-[#f3f4f6] dark:border-[#27272a] flex items-center justify-between">
                      <span className="text-[10px] text-[#6b7280] dark:text-[#a1a1aa] font-mono">
                        {dueAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDueAt(null);
                          handleFieldChange('dueAt', null);
                          setOpenMenu(null);
                        }}
                        className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        Clear Due Date
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-[#9ca3af] dark:text-[#71717a]">
            Created {formatFullDate(itemToRender.createdAt)}
          </div>
        </div>

        {/* Editor & Content Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Markdown & Rich Text Toolbar */}
          {canEdit && (
            <div className="flex items-center gap-1 py-1 px-1.5 bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-[#4b5563] dark:text-[#a1a1aa]">
              {/* Undo / Redo Actions */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-3 bg-[#e5e7eb] dark:bg-[#27272a] mx-0.5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyRichCommand('formatBlock', '<h3>')}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
                  >
                    <Heading className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Heading (###)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyRichCommand('bold')}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bold (Ctrl+B)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyRichCommand('italic')}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Italic (Ctrl+I)</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-3 bg-[#e5e7eb] dark:bg-[#27272a] mx-0.5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyRichCommand('insertUnorderedList')}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bullet list</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyRichCommand('insertOrderedList')}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Numbered list</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-3 bg-[#e5e7eb] dark:bg-[#27272a] mx-0.5" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleLinkButtonClick}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs transition-colors"
                  >
                    <Link className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Link (Ctrl+K)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyRichCommand('code')}
                    className="p-1 hover:bg-[#ebecee] dark:hover:bg-[#27272a] rounded text-xs"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Inline code</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Rich Content WYSIWYG Editor */}
          <div
            ref={editorRef}
            contentEditable={canEdit}
            suppressContentEditableWarning
            onClick={handleEditorClick}
            onMouseDown={handleEditorMouseDown}
            onPaste={handleEditorPaste}
            onKeyDown={handleEditorKeyDown}
            onBlur={handleEditorBlur}
            onInput={() => {
              if (editorRef.current) {
                const rawHtml = editorRef.current.innerHTML;
                pushHistory(rawHtml, false);
                const md = htmlToMarkdown(rawHtml);
                setContent(md);
                triggerAutoSave({ content: md });
              }
            }}
            data-placeholder="Add details, notes, links, or markdown content..."
            className={`w-full min-h-[140px] max-h-[220px] p-2.5 bg-transparent text-[#111827] dark:text-[#f4f4f5] border border-[#e5e7eb] dark:border-[#27272a] rounded-[6px] text-xs focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b] overflow-y-auto custom-scrollbar leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-[#9ca3af] dark:empty:before:text-[#71717a] empty:before:pointer-events-none max-w-none [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-1.5 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_a]:text-blue-500 [&_a]:underline [&_a]:cursor-pointer [&_a:hover]:text-blue-400 [&_a]:relative [&_a]:z-10 [&_pre]:bg-black/10 dark:[&_pre]:bg-white/10 [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_code]:bg-black/10 dark:[&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono ${
              !canEdit ? 'cursor-default select-text' : 'cursor-text'
            }`}
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
                  className="group flex items-start justify-between p-1.5 hover:bg-[#f9fafb] dark:hover:bg-[#1f1f23] rounded-[4px] text-xs transition-colors gap-2"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={item.isCompleted}
                      disabled={!canEdit}
                      onChange={() => toggleChecklist(item.id)}
                    >
                      <span
                        className={`text-xs break-words break-all [overflow-wrap:anywhere] whitespace-normal flex-1 leading-snug ${
                          item.isCompleted
                            ? 'line-through text-[#9ca3af] dark:text-[#71717a]'
                            : 'text-[#374151] dark:text-[#e4e4e7]'
                        }`}
                      >
                        {item.title}
                      </span>
                    </Checkbox>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => removeChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9ca3af] hover:text-rose-600 transition-opacity shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add checklist input */}
              {canEdit && (
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
                    className="flex-1 h-[28px] bg-[#f9fafb] dark:bg-[#1c1c1f] border border-[#e5e7eb] dark:border-[#27272a] rounded-[4px] px-2 text-xs text-[#111827] dark:text-[#f4f4f5] focus:outline-none focus:border-[#9ca3af] dark:focus:border-[#52525b]"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="w-[28px] h-[28px] flex items-center justify-center bg-[#f3f4f6] dark:bg-[#27272a] text-[#374151] dark:text-[#d4d4d8] hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46] rounded-[4px] text-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#111827] dark:text-[#f4f4f5]">
              <span>Attachments ({attachments.length})</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[11px] font-normal text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload</span>
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
            </div>

            {attachments.length === 0 ? (
              canEdit ? (
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
                <div className="p-2 text-center text-[11px] text-[#9ca3af] dark:text-[#71717a] italic">
                  No attachments
                </div>
              )
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
                        {canEdit && (
                          <button
                            onClick={() => removeAttachment(att.id)}
                            className="p-1 text-[#9ca3af] hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
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
          <div className="flex items-center gap-1.5 text-[11px] text-[#6b7280] dark:text-[#a1a1aa]">
            <Save className="w-3.5 h-3.5 opacity-80" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => handleFieldChange('status', 'archived')}
                className="px-2.5 py-1 text-xs text-[#6b7280] dark:text-[#a1a1aa] hover:bg-[#f3f4f6] dark:hover:bg-[#27272a] rounded-[4px] transition-colors"
              >
                Archive
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  const confirmPref = localStorage.getItem('leaf_pref_confirm_delete') !== 'false';
                  if (!confirmPref) {
                    deleteItem(itemToRender.id);
                  } else {
                    setItemToDelete(itemToRender);
                  }
                }}
                className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[4px] transition-colors"
              >
                Delete
              </button>
            )}
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
