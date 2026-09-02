import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { Item, Project, ChecklistItem, Attachment } from '../types';
import { getCloudCredentials } from './cloudSync';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RealtimeCallbacks {
  onItemUpsert: (item: Partial<Item> & { id: string }) => void;
  onItemDelete: (itemId: string) => void;
  onProjectUpsert: (project: Partial<Project> & { id: string }) => void;
  onProjectDelete: (projectId: string) => void;
  onChecklistUpsert: (c: Partial<ChecklistItem> & { id: string; itemId: string }) => void;
  onChecklistDelete: (checklistId: string) => void;
  onAttachmentUpsert?: (a: Attachment) => void;
  onAttachmentDelete?: (attachmentId: string) => void;
  onReconnect: () => void; // called after reconnect to do a full catch-up sync
}

// ─── Module-level state ──────────────────────────────────────────────────────

let _client: SupabaseClient | null = null;
let _channel: RealtimeChannel | null = null;
let _activeWsId: string | null = null;
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStoredCredentials(workspaceId: string): { url: string; anonKey: string } | null {
  return getCloudCredentials(workspaceId);
}

// Map a raw PostgREST row to our Item shape (without hardcoded empty arrays for relations)
function rowToItem(row: Record<string, unknown>): Partial<Item> & { id: string } {
  return {
    id: row.id as string,
    projectId: (row.project_id as string) || '',
    title: (row.title as string) || '',
    content: (row.content as string) || '',
    type: (row.type as Item['type']) || 'task',
    status: (row.status as Item['status']) || 'inbox',
    priority: (row.priority as Item['priority']) || 'none',
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    assigneeId: (row.assignee_id as string) || null,
    isPinned: Boolean(row.is_pinned),
    dueAt: (row.due_at as string) || null,
    completedAt: (row.completed_at as string) || null,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
  };
}

// Map a raw PostgREST row to our Project shape
function rowToProject(row: Record<string, unknown>): Partial<Project> & { id: string } {
  return {
    id: row.id as string,
    name: (row.name as string) || 'Untitled',
    description: (row.description as string) || '',
    color: (row.color as string) || '',
    icon: (row.icon as string) || undefined,
    isArchived: Boolean(row.is_archived),
    createdAt: (row.created_at as string) || new Date().toISOString(),
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
  };
}

// Map a raw PostgREST row to our ChecklistItem shape
function rowToChecklist(row: Record<string, unknown>): Partial<ChecklistItem> & { id: string; itemId: string } {
  return {
    id: row.id as string,
    itemId: (row.item_id as string) || '',
    title: (row.title as string) || '',
    isCompleted: Boolean(row.is_completed),
    position: (row.sort_order as number) ?? 0,
  };
}

// Map a raw PostgREST row to our Attachment shape
function rowToAttachment(row: Record<string, unknown>): Attachment {
  return {
    id: row.id as string,
    itemId: (row.item_id as string) || '',
    fileName: (row.file_name as string) || '',
    filePath: (row.file_path as string) || '',
    fileSize: Number(row.file_size || 0),
    mimeType: (row.mime_type as string) || 'application/octet-stream',
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

// ─── Subscribe ────────────────────────────────────────────────────────────────

/**
 * Opens a Supabase Realtime WebSocket channel for the given workspace.
 * Subscribes to INSERT/UPDATE/DELETE on items, projects, checklist_items, attachments.
 * Replaces any previous subscription automatically.
 */
export function subscribeToWorkspace(workspaceId: string, callbacks: RealtimeCallbacks): void {
  const creds = getStoredCredentials(workspaceId);
  if (!creds) return;

  // Tear down any existing subscription first
  unsubscribe();

  _activeWsId = workspaceId;

  _client = createClient(creds.url, creds.anonKey, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
    auth: { persistSession: false },
    global: { headers: { apikey: creds.anonKey } },
  });

  const channelName = `workspace:${workspaceId}`;

  _channel = _client
    .channel(channelName)

    // ── Items ──────────────────────────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'items', filter: `workspace_id=eq.${workspaceId}` },
      (payload) => callbacks.onItemUpsert(rowToItem(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'items', filter: `workspace_id=eq.${workspaceId}` },
      (payload) => callbacks.onItemUpsert(rowToItem(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'items', filter: `workspace_id=eq.${workspaceId}` },
      (payload) => callbacks.onItemDelete((payload.old as { id: string }).id)
    )

    // ── Projects ───────────────────────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` },
      (payload) => callbacks.onProjectUpsert(rowToProject(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` },
      (payload) => callbacks.onProjectUpsert(rowToProject(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` },
      (payload) => callbacks.onProjectDelete((payload.old as { id: string }).id)
    )

    // ── Checklist Items ────────────────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'checklist_items' },
      (payload) => callbacks.onChecklistUpsert(rowToChecklist(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'checklist_items' },
      (payload) => callbacks.onChecklistUpsert(rowToChecklist(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'checklist_items' },
      (payload) => callbacks.onChecklistDelete((payload.old as { id: string }).id)
    )

    // ── Attachments ────────────────────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'attachments' },
      (payload) => callbacks.onAttachmentUpsert?.(rowToAttachment(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'attachments' },
      (payload) => callbacks.onAttachmentUpsert?.(rowToAttachment(payload.new as Record<string, unknown>))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'attachments' },
      (payload) => callbacks.onAttachmentDelete?.((payload.old as { id: string }).id)
    )

    // ── Workspace Members & Invites ─────────────────────────────────────────
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${workspaceId}` },
      () => callbacks.onReconnect()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'workspace_invites', filter: `workspace_id=eq.${workspaceId}` },
      () => callbacks.onReconnect()
    )

    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        if (_reconnectTimer) {
          clearTimeout(_reconnectTimer);
          _reconnectTimer = null;
          // Trigger a full catch-up sync after reconnect to fill any gaps
          callbacks.onReconnect();
        }
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        // Schedule a reconnect with 5-second backoff
        if (_reconnectTimer) clearTimeout(_reconnectTimer);
        _reconnectTimer = setTimeout(() => {
          if (_activeWsId === workspaceId) {
            subscribeToWorkspace(workspaceId, callbacks);
          }
        }, 5000);
      }
    });
}

// ─── Unsubscribe ──────────────────────────────────────────────────────────────

export function unsubscribe(): void {
  if (_reconnectTimer) {
    clearTimeout(_reconnectTimer);
    _reconnectTimer = null;
  }
  if (_channel && _client) {
    _client.removeChannel(_channel).catch(() => {});
    _channel = null;
  }
  _client = null;
  _activeWsId = null;
}

export function isSubscribed(): boolean {
  return _channel !== null && _activeWsId !== null;
}
