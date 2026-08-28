import { Item } from '../types';

export type SyncMessage =
  | { type: 'item_updated'; item: Item; senderId: string }
  | { type: 'item_created'; item: Item; senderId: string }
  | { type: 'item_deleted'; itemId: string; senderId: string }
  | { type: 'items_reload'; senderId: string }
  | { type: 'projects_reload'; senderId: string };

// Unique ID for this specific window instance to prevent self-echo and infinite loops
export const WINDOW_ID =
  typeof window !== 'undefined'
    ? 'win_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now()
    : 'server';

const CHANNEL_NAME = 'leaf_interwindow_sync_channel';

// Single clean BroadcastChannel (standard for all webviews on same origin)
const channel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

export function broadcastSync(
  message:
    | { type: 'item_updated'; item: Item }
    | { type: 'item_created'; item: Item }
    | { type: 'item_deleted'; itemId: string }
    | { type: 'items_reload' }
    | { type: 'projects_reload' }
) {
  if (!channel) return;
  try {
    const payload: SyncMessage = {
      ...message,
      senderId: WINDOW_ID,
    };
    channel.postMessage(payload);
  } catch (err) {
    console.error('Broadcast error:', err);
  }
}

export function subscribeToSync(handler: (message: SyncMessage) => void): () => void {
  if (!channel) return () => {};

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = event.data as SyncMessage;
      // Strictly ignore messages originating from this window itself
      if (!data || data.senderId === WINDOW_ID) {
        return;
      }
      handler(data);
    } catch (err) {
      console.error('Sync handle error:', err);
    }
  };

  channel.addEventListener('message', handleMessage);
  return () => {
    channel.removeEventListener('message', handleMessage);
  };
}
