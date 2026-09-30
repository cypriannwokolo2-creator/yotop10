'use client';

import { memo, useCallback, useState, type MouseEvent } from 'react';
import { Icon } from './icons/Icon';
import { API } from '@/lib/api';
import { toast } from '@/lib/toast';

/** Payload of POST /api/reactions (backend routes/reactions.ts). */
export interface ToggleReactionResponse {
  success: boolean;
  action: 'added' | 'removed';
  target_type: 'comment' | 'post' | 'list_item';
  target_id: string;
  fire_count: number;
  count: number;
  user_reacted: boolean;
}

/**
 * Fire (vote) button — M40.2.
 *
 * Optimistic toggle: the visual state flips immediately (the button never
 * waits on the network), the API call syncs behind it, and a failure rolls
 * the state back with an error toast. While a request is in flight the
 * visual state is owned by the optimistic flip, not the response, so a
 * slow round-trip never produces a laggy-feeling tap.
 *
 * Sizing: `size="sm"` (34px target, card footers / dense rows) vs
 * `size="md"` (40px touch target, detail pages) — callers pick per context
 * so neither mobile nor desktop gets an oversized control.
 *
 * `onSync` lets a page keep its own state tree in step with the confirmed
 * server count (called only on API success).
 */
export interface FireButtonProps {
  targetType: 'comment' | 'post' | 'list_item';
  targetId: string;
  initialCount?: number;
  initialReacted?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  onSync?: (fireCount: number, reacted: boolean) => void;
}

export const FireButton = memo(function FireButton({
  targetType,
  targetId,
  initialCount = 0,
  initialReacted = false,
  size = 'md',
  label,
  onSync,
}: FireButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [reacted, setReacted] = useState(initialReacted);
  const [bump, setBump] = useState(false);

  const toggle = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const nextReacted = !reacted;
      const nextCount = count + (nextReacted ? 1 : -1);
      setReacted(nextReacted);
      setCount(nextCount);
      setBump(true);

      try {
        const data = await API.toggleReaction(targetType, targetId) as ToggleReactionResponse;
        onSync?.(data.fire_count, data.user_reacted);
      } catch {
        setReacted(!nextReacted);
        setCount(count);
        toast.error('Could not save your fire. Try again.');
      }
    },
    [reacted, count, targetType, targetId, onSync]
  );

  const height = size === 'sm' ? 'h-[34px]' : 'h-10';
  const iconSize = size === 'sm' ? 14 : 16;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <button
      type="button"
      onClick={toggle}
      onTransitionEnd={() => setBump(false)}
      aria-pressed={reacted}
      aria-label={label ?? (reacted ? 'Remove fire' : 'Fire this')}
      className={`inline-flex ${height} items-center gap-1.5 rounded-lg px-2.5 font-medium transition-colors duration-200 ${
        reacted
          ? 'border border-orange-500/50 bg-orange-500/10 text-orange-400'
          : 'border border-transparent text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <span
        className={`inline-flex ${bump ? 'scale-125' : 'scale-100'} transition-transform duration-150`}
      >
        <Icon
          name="Flame"
          size={iconSize}
          color={reacted ? '#f97316' : '#ea580c'}
          fill={reacted ? 'currentColor' : 'none'}
        />
      </span>
      <span className={`${textSize} tabular-nums`}>{count}</span>
    </button>
  );
});
