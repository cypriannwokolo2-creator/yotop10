import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Link from 'next/link';
import React from 'react';

const mockToggle = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/lib/api', () => ({
  API: {
    toggleReaction: (...args: unknown[]) => mockToggle(...args),
  },
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('./icons/Icon', () => ({
  Icon: (props: { name: string; fill?: string; size?: number }) =>
    React.createElement('span', { 'data-testid': `icon-${props.name}`, 'data-fill': props.fill }),
}));

vi.mock('@/hooks/useRequireAuth', () => ({
  useRequireAuth: () => ({
    requireAuth: (action: () => void) => {
      action();
      return true;
    },
    user: null,
  }),
}));

import { FireButton } from './FireButton';

describe('FireButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToggle.mockResolvedValue({ success: true, fire_count: 1, user_reacted: true });
  });

  it('renders count and aria-pressed=false initially', () => {
    render(<FireButton targetType="comment" targetId="a1" initialCount={7} initialReacted={false} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.textContent).toContain('7');
  });

  it('toggles optimistically: visual state flips before API resolves', async () => {
    let resolveApi: (v: unknown) => void = () => {};
    mockToggle.mockReturnValue(new Promise((res) => { resolveApi = res; }));

    render(<FireButton targetType="comment" targetId="a2" initialCount={3} initialReacted={false} />);
    const btn = screen.getByRole('button');

    fireEvent.click(btn);

    // Optimistic: pressed + count bumped while the API is still pending.
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.textContent).toContain('4');
    expect(mockToggle).toHaveBeenCalledWith('comment', 'a2');

    resolveApi(undefined);
    await waitFor(() => expect(mockToggle).toHaveBeenCalled());
  });

  it('rolls back visual state and toasts on API failure', async () => {
    mockToggle.mockRejectedValue(new Error('network down'));

    render(<FireButton targetType="post" targetId="a3" initialCount={10} initialReacted={false} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.textContent).toContain('10');
  });

  it('un-fires optimistically when already reacted', async () => {
    render(<FireButton targetType="list_item" targetId="a4" initialCount={5} initialReacted />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(btn);
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.textContent).toContain('4');
  });

  it('stopPropagation so card-level links do not navigate on fire', () => {
    render(
      <Link href="https://example.com/somewhere">
        <FireButton targetType="post" targetId="a5" initialCount={0} />
      </Link>
    );
    const btn = screen.getByRole('button');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    let prevented = false;
    event.preventDefault = () => { prevented = true; };
    btn.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it('applies sm sizing (h-[34px]) for compact contexts', () => {
    render(<FireButton targetType="post" targetId="a6" size="sm" />);
    expect(screen.getByRole('button').className).toContain('h-[34px]');
  });

  it('applies md sizing (h-10) by default', () => {
    render(<FireButton targetType="post" targetId="a7" />);
    expect(screen.getByRole('button').className).toContain('h-10');
  });
});
