'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from './icons/Icon';

interface ImageUploaderProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploader({ currentUrl, onUpload, label = 'Cover Image', className = '' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    setPreview(currentUrl || null);
    setPreviewError(false);
  }, [currentUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body, credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const url = data.file?.hero_lg || data.file?.original || data.url;
      if (!url) throw new Error('No URL returned');
      setPreview(url);
      setPreviewError(false);
      onUpload(url);
      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setError(null);
    setPreviewError(false);
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }
    setPreview(trimmed);
    onUpload(trimmed);
    setUrlInput('');
  };

  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-400 hover:border-orange-500/30 hover:text-orange-400 transition disabled:opacity-50"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <Icon name="RefreshCw" size={14} className="animate-spin" />
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Icon name="Image" size={14} />
              {preview ? 'Replace' : 'Upload'}
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />

        <span className="text-2xs text-zinc-600">or paste URL</span>

        <input
          type="text"
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleUrlSubmit(); }}
          placeholder="https://example.com/image.jpg"
          className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim()}
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
        >
          <Icon name="Link" size={14} />
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

      {preview && (
        <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-40 object-cover"
            onLoad={() => setPreviewError(false)}
            onError={() => setPreviewError(true)}
          />
          {previewError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/90 p-3 text-center">
              <Icon name="ImageOff" size={20} className="text-zinc-600" />
              <p className="text-xs text-zinc-400 max-w-[90%] truncate">{preview}</p>
              <p className="text-2xs text-zinc-600">Preview failed — image may still save. Try direct link ending in .jpg/.png/.webp or <a href={preview} target="_blank" rel="noopener noreferrer" className="underline text-orange-400">open URL</a>.</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => { setPreview(null); onUpload(''); setError(null); setPreviewError(false); }}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white/80 hover:text-white transition"
            aria-label="Remove"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
