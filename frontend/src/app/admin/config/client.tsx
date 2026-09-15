'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';

type ListOrder = 'asc' | 'desc';

export default function AdminConfigClient() {
  const [order, setOrder] = useState<ListOrder>('asc');
  const [savedOrder, setSavedOrder] = useState<ListOrder>('asc');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ config: { list_order?: ListOrder } }>('/admin/config');
      const current = data.config?.list_order === 'desc' ? 'desc' : 'asc';
      setOrder(current);
      setSavedOrder(current);
    } catch {
      setError('Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    if (order === savedOrder) return;
    setSaving(true);
    setError('');
    try {
      const data = await apiFetch<{ success: boolean; config: { list_order?: ListOrder } }>('/admin/config', {
        method: 'PUT',
        body: JSON.stringify({ list_order: order }),
      });
      const current = data.config?.list_order === 'desc' ? 'desc' : 'asc';
      setOrder(current);
      setSavedOrder(current);
      toast.success('Ranking order updated. Lists now display ' + (current === 'desc' ? '10 → 1 (countdown).' : '1 → 10.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const dirty = order !== savedOrder;

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2>Site Configuration</h2>
      <p style={{ color: '#666', fontSize: '13px' }}>
        Applies instantly to the homepage, post pages, explore, categories, share cards and API responses.
        Rank numbers stay attached to their items — only the display order flips. Side-based debates and single facts are unaffected.
      </p>
      {error && <div style={{ background: '#ffebee', padding: '8px', borderRadius: '4px', margin: '12px 0', color: '#c62828' }}>{error}</div>}

      <h3 style={{ marginTop: '20px' }}>Top-10 list display order</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        {(['asc', 'desc'] as const).map((value) => {
          const active = order === value;
          return (
            <label
              key={value}
              style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                border: active ? '2px solid #f97316' : '1px solid #ddd',
                borderRadius: '8px', padding: '12px', cursor: 'pointer',
                background: active ? '#fff7ed' : '#fff',
              }}
            >
              <input type="radio" name="list_order" value={value} checked={active} onChange={() => setOrder(value)} style={{ marginTop: '4px' }} />
              <span>
                <strong>{value === 'asc' ? 'Ascending — 1 → 10' : 'Descending — 10 → 1 (countdown)'}</strong>
                <br />
                <span style={{ fontSize: '13px', color: '#555' }}>
                  {value === 'asc'
                    ? 'Champion first. The #1 ranked item leads every list.'
                    : 'Countdown style. The lowest rank leads and #1 closes the list.'}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button onClick={handleSave} disabled={saving || !dirty} style={{ padding: '10px 24px', fontSize: '14px', cursor: dirty && !saving ? 'pointer' : 'not-allowed', opacity: dirty ? 1 : 0.5 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {dirty && <span style={{ fontSize: '12px', color: '#b45309', alignSelf: 'center' }}>Unsaved changes</span>}
      </div>
      {!dirty && <p style={{ fontSize: '12px', color: '#666' }}>Currently serving: <strong>{savedOrder === 'desc' ? 'Descending (10 → 1)' : 'Ascending (1 → 10)'}</strong></p>}
    </div>
  );
}
