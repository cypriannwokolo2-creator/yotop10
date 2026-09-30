import { apiFetch } from '../client';

/** Payload of POST /api/reactions — see backend/src/routes/reactions.ts. */
export interface ToggleReactionResponse {
  success: boolean;
  action: 'added' | 'removed';
  target_type: 'comment' | 'post' | 'list_item';
  target_id: string;
  fire_count: number;
  count: number;
  user_reacted: boolean;
}

export const reactionsApi = {
  toggleReaction: (target_type: 'comment' | 'post' | 'list_item', target_id: string) =>
    apiFetch<ToggleReactionResponse>('/reactions', {
      method: 'POST',
      body: JSON.stringify({ target_type, target_id }),
    }),

  getReactionState: (targets: Array<{ type: string; id: string }>, options?: RequestInit) =>
    apiFetch<{ targets: Array<{ type: string; id: string; user_reacted: boolean }> }>(
      `/reactions/state?targets=${encodeURIComponent(JSON.stringify(targets))}`,
      options
    ),
};
