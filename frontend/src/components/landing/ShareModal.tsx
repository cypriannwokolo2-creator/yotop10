'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/icons/Icon';

export interface ShareData {
  title: string;
  url: string;
}

interface ShareModalProps {
  data: ShareData | null;
  onClose: () => void;
}

interface PlatformDef {
  key: string;
  label: string;
  brand: string;
}

const PLATFORMS: PlatformDef[] = [
  { key: 'facebook', label: 'Facebook', brand: 'facebook' },
  { key: 'whatsapp', label: 'WhatsApp', brand: 'whatsapp' },
  { key: 'twitter', label: 'Twitter', brand: 'x' },
  { key: 'instagram', label: 'Instagram', brand: 'instagram' },
  { key: 'tiktok', label: 'TikTok', brand: 'tiktok' },
  { key: 'linkedin', label: 'LinkedIn', brand: 'linkedin' },
  { key: 'medium', label: 'Medium', brand: 'medium' },
  { key: 'reddit', label: 'Reddit', brand: 'reddit' },
  { key: 'threads', label: 'Threads', brand: 'threads' },
  { key: 'telegram', label: 'Telegram', brand: 'telegram' },
  { key: 'quora', label: 'Quora', brand: 'quora' },
  { key: 'discord', label: 'Discord', brand: 'discord' },
];

function buildShareUrl(platform: string, title: string, url: string): string {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const shareUrls: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    instagram: `https://www.instagram.com/`,
    tiktok: `https://www.tiktok.com/`,
    medium: `https://medium.com/`,
    threads: `https://www.threads.net/`,
    quora: `https://www.quora.com/`,
    discord: `https://discord.com/`,
  };
  return shareUrls[platform] || url;
}

interface Html2PdfResult {
  from(target: Element | string): Html2PdfResult;
  set(options: Record<string, unknown>): Html2PdfResult;
  save(): void;
}

declare global {
  interface Window {
    html2pdf?: () => Html2PdfResult;
  }
}

function loadHtml2Pdf(): Promise<void> {
  if (window.html2pdf) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-html2pdf]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('load failed')));
      return;
    }
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.dataset.html2pdf = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('load failed'));
    document.head.appendChild(script);
  });
}

export function ShareModal({ data, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const open = data !== null;

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  if (!data) return null;

  const copyUrl = async () => {
    const input = urlInputRef.current;
    let ok = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(data.url);
        ok = true;
      } catch {
        // Clipboard API can be unavailable (insecure context) — fall back to
        // the same execCommand path the reference site uses.
      }
    }
    if (!ok && input) {
      input.select();
      input.setSelectionRange(0, 99999);
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadContent = async (format: 'html' | 'pdf') => {
    const filename =
      (data.title || 'yotop10').replace(/[^\w\d]+/g, '_') || 'yotop10';
    if (format === 'html') {
      const htmlContent = `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      return;
    }
    setPdfError(false);
    try {
      await loadHtml2Pdf();
    } catch {
      setPdfError(true);
      return;
    }
    if (!window.html2pdf) {
      setPdfError(true);
      return;
    }
    const content =
      document.querySelector('.main-content') || document.body;
    window
      .html2pdf()
      .from(content)
      .set({
        margin: 0.5,
        filename: `${filename}.pdf`,
        html2canvas: { scale: 1.2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  return (
    <div
      className={`modal-overlay share-overlay${open ? ' active' : ''}`}
      id="shareModal"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="share-modal">
        <div className="share-header">
          <h3>Share Article</h3>
          <button
            className="close-btn"
            id="closeShareModal"
            type="button"
            aria-label="Close share dialog"
            onClick={onClose}
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="share-content">
          <div className="share-platforms">
            {PLATFORMS.map(platform => (
              <button
                key={platform.key}
                className={`share-platform ${platform.key}`}
                type="button"
                data-platform={platform.key}
                onClick={() =>
                  window.open(
                    buildShareUrl(platform.key, data.title, data.url),
                    '_blank',
                    'width=600,height=400'
                  )
                }
              >
                <Image
                  src={`/brand/${platform.brand}.svg`}
                  alt=""
                  aria-hidden
                  width={24}
                  height={24}
                />
                <span>{platform.label}</span>
              </button>
            ))}
          </div>
          <div className="share-actions">
            <div className="share-url-section">
              <input
                type="text"
                className="share-url-input"
                id="shareUrlInput"
                readOnly
                value={data.url}
                ref={urlInputRef}
              />
              <button
                className={`copy-url-btn${copied ? ' success' : ''}`}
                id="copyUrlBtn"
                type="button"
                onClick={copyUrl}
              >
                <Icon name={copied ? 'Check' : 'Copy'} size={18} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="download-section">
              <h4>Download for Offline Reading</h4>
              <div className="download-buttons">
                <button
                  className="download-btn html-download"
                  id="downloadHtml"
                  type="button"
                  onClick={() => downloadContent('html')}
                >
                  <Icon name="FileCode" size={16} />
                  <span>HTML</span>
                </button>
                <button
                  className="download-btn pdf-download"
                  id="downloadPdf"
                  type="button"
                  onClick={() => downloadContent('pdf')}
                >
                  <Icon name="FileText" size={16} />
                  <span>PDF</span>
                </button>
              </div>
              {pdfError && (
                <p
                  className="newsletter-error-text"
                  style={{
                    color: '#db2525',
                    fontSize: '0.8rem',
                    marginTop: '8px',
                  }}
                >
                  PDF export could not be loaded. Please try again.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
