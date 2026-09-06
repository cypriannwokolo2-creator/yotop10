'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { apiFetch } from '@/lib/api';

interface QueryMessage {
  id: string;
  type: 'feature' | 'bug';
  message: string;
  created_at: string;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function QueryClient() {
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [type, setType] = useState<'feature' | 'bug'>('feature');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, confirm]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    setError('');

    const msg: QueryMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      message: trimmed,
      created_at: new Date().toISOString(),
    };

    try {
      await apiFetch('/queries', {
        method: 'POST',
        body: JSON.stringify({ type, message: trimmed }),
      });
      setMessages((prev) => [...prev, msg]);
      setText('');
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 sm:py-12 min-h-[calc(100vh-56px)] flex flex-col">
        <nav className="mb-6">
          <Link
            href="/settings"
            className="text-sm text-orange-400 hover:text-orange-300 transition"
          >
            &larr; Back to Settings
          </Link>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
            <Icon name="MessageSquareWarning" size={20} />
          </div>
          <h1 className="text-xl font-semibold text-white">
            Feature Requests & Bug Reports
          </h1>
        </div>
        <p className="text-sm text-zinc-500 mb-6 ml-[52px]">
          Tell us what you&apos;d like to see or what&apos;s broken. We read every message.
        </p>

        <div className="flex items-center gap-2 mb-4">
          {(['feature', 'bug'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                type === t
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                  : 'bg-white/[0.03] text-zinc-500 border border-transparent hover:text-zinc-300 hover:bg-white/[0.06]'
              }`}
            >
              {t === 'feature' ? 'Feature Request' : 'Bug Report'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[120px] max-h-[400px] pr-1">
          {messages.length === 0 && !confirm && (
            <p className="text-zinc-600 text-sm text-center py-8">
              No messages yet. Send us your first one below.
            </p>
          )}

          {messages.map((m) => (
            <div key={m.id} className="flex flex-col items-end">
              <div className="max-w-[80%] bg-orange-500/15 border border-orange-500/20 rounded-2xl rounded-br-md px-4 py-3">
                <p className="text-xs text-orange-400 font-medium mb-1">
                  {m.type === 'feature' ? 'Feature Request' : 'Bug Report'}
                </p>
                <p className="text-sm text-white whitespace-pre-wrap">{m.message}</p>
              </div>
              <span className="text-2xs text-zinc-600 mt-1 mr-1">
                {formatTime(m.created_at)}
              </span>
            </div>
          ))}

          {confirm && (
            <div className="flex flex-col items-start">
              <div className="max-w-[80%] bg-white/[0.03] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-sm text-zinc-400">
                  Message received! We&apos;ll get back to you.
                </p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              type === 'feature'
                ? 'Describe the feature you want...'
                : 'Describe the bug...'
            }
            rows={4}
            className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white shrink-0 transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name={sending ? 'Loader' : 'Send'} size={18} className={sending ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
