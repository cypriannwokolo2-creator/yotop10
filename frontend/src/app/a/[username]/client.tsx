'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { Icon } from '@/components/icons/Icon';
import { useAuthStore } from '@/stores/auth';
import { useRateLimitStore } from '@/stores/rateLimit';
import { SecureMyAuthority } from '@/components/SecureMyAuthority';
import { toPublicSlug } from '@/lib/username';

interface UserProfile {
  username: string;
  canonical_url?: string;
  profile_image_url?: string | null;
  trust_level: 'newbie' | 'ghost' | 'troll' | 'neutral' | 'scholar';
  created_at: string;
  stats: {
    member_since: string;
    total_posts: number;
    total_comments: number;
    approval_rate: number | null;
    verified?: boolean;
    total_views?: number;
  };
  posts: Array<{
    id: string; title: string; slug: string; status: string; post_type: string;
    view_count?: number; comment_count: number; created_at: string;
    category: { name?: string; slug: string } | null;
    revision_guidance?: string; rejection_reason?: string;
  }>;
  comments: Array<{ id: string; content: string; post_id: string; fire_count: number; reply_count: number; created_at: string }>;
  is_own_profile: boolean;
  trust_score?: number;
}

const POST_TYPE_LABELS: Record<string, string> = {
  top_list: 'Top List', this_vs_that: 'Debate', fact_drop: 'Fact Drop',
  best_of: 'Best Of', worst_of: 'Worst Of', counter_list: 'Counter',
};

const TIER_STYLES: Record<string, { ring: string; label: string; text: string; bg: string; dot: string }> = {
  scholar: { ring: 'ring-orange-400/40', label: 'Scholar', text: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  neutral: { ring: 'ring-white/20', label: 'Neutral', text: 'text-white/80', bg: 'bg-white/5 border-white/10', dot: 'bg-white/50' },
  troll: { ring: 'ring-amber-500/30', label: 'Troll', text: 'text-amber-300/80', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  newbie: { ring: 'ring-white/10', label: 'New Member', text: 'text-white/50', bg: 'bg-white/[0.03] border-white/5', dot: 'bg-white/20' },
  ghost: { ring: 'ring-zinc-700', label: 'Inactive', text: 'text-zinc-500', bg: 'bg-white/[0.02] border-white/[0.03]', dot: 'bg-zinc-600' },
};

export default function UserProfileClient({ initialProfile }: { initialProfile: UserProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'stats'>('posts');
  const [postFilter, setPostFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const authUser = useAuthStore((s) => s.user);
  const fetchAuthUser = useAuthStore((s) => s.fetchUser);
  const rateLimitStatus = useRateLimitStore((s) => s.status);
  const rateLimitCountdown = useRateLimitStore((s) => s.countdown);
  const fetchRateStatus = useRateLimitStore((s) => s.fetchStatus);
  const tickCountdown = useRateLimitStore((s) => s.tickCountdown);
  const rateLimitErrorCount = useRateLimitStore((s) => s.errorCount);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Compute is_own_profile locally — server-side fetch can't determine identity
  const profileUsername = profile.username;
  const isOwn = profile.is_own_profile ||
    (authUser?.username === profileUsername) ||
    (authUser?.custom_display_name === profileUsername);

  const trustScore = isOwn && authUser ? authUser.trust_score : profile.trust_score ?? 0;
  const tier = TIER_STYLES[profile.trust_level] || TIER_STYLES.neutral;

  useEffect(() => {
    if (isOwn && activeTab === 'stats' && rateLimitErrorCount > 0) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(fetchRateStatus, Math.min(1000 * Math.pow(2, rateLimitErrorCount), 10000));
    }
  }, [isOwn, activeTab, rateLimitErrorCount, fetchRateStatus]);
  useEffect(() => {
    if (isOwn && activeTab === 'stats') fetchRateStatus();
  }, [isOwn, activeTab, fetchRateStatus]);
  useEffect(() => {
    if (!rateLimitStatus || activeTab !== 'stats') return;
    const interval = setInterval(tickCountdown, 1000);
    return () => clearInterval(interval);
  }, [rateLimitStatus, activeTab, tickCountdown]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible' && activeTab === 'stats') fetchRateStatus(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); clearTimeout(retryTimeoutRef.current); };
  }, [activeTab, fetchRateStatus]);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const input = e.target as HTMLInputElement;
    if (!file) return;
    // Client-side validation before network
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setImageError('Use JPEG, PNG, or WebP (max 10MB)');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError('File too large. Max 10MB');
      input.value = '';
      return;
    }
    setUploadingImage(true);
    setImageError(null);
    try {
      const uploadRes = (await API.uploadProfileImage(file)) as { success: boolean; url: string };
      if (!uploadRes?.url) throw new Error('Upload failed: no url');
      try {
        await API.updateProfileImage(uploadRes.url);
      } catch (patchErr: any) {
        setImageError(patchErr?.message?.includes('404') ? 'Profile not found, retrying...' : 'Save failed');
        throw patchErr;
      }
      await fetchAuthUser();
      setProfile((p) => (p ? { ...p, profile_image_url: uploadRes.url } : p));
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('413') || msg.includes('too large')) setImageError('File too large. Max 10MB');
      else if (msg.includes('400') || msg.includes('File type')) setImageError('Use JPEG, PNG, or WebP');
      else if (msg.includes('425') || msg.includes('retry')) setImageError('Identity initializing, retrying...');
      else setImageError('Upload failed.');
    } finally {
      setUploadingImage(false);
      input.value = '';
    }
  };

  const initials = (profile.username[0] || '?').toUpperCase();

  // Compute filtered posts based on active filter pill
  const filteredPosts = profile.posts.filter(p => {
    if (postFilter === 'all') return true;
    if (postFilter === 'approved') return p.status === 'approved';
    if (postFilter === 'pending') return p.status !== 'approved' && !p.rejection_reason;
    if (postFilter === 'rejected') return p.status === 'rejected' || !!p.rejection_reason;
    return true;
  });

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-[var(--color-bg)] text-white px-6 sm:px-8 py-12 sm:py-16">
      {/* ─── Banner ─── */}
      <div className="h-28 sm:h-36 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black border border-white/5" />

      {/* ─── Profile Header ─── */}
      <div className="flex items-start gap-6 md:gap-8 -mt-12 mb-10 px-2">
        {/* Avatar — overlapping banner */}
        <div className={`shrink-0 rounded-full ring-4 ring-[var(--color-bg)] shadow-xl ${tier.ring} p-0.5 bg-[var(--color-bg)]`}>
          {profile.profile_image_url ? (
            <Image src={profile.profile_image_url} alt="" width={96} height={96} className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover" unoptimized />
          ) : (
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 text-2xl font-bold text-zinc-400">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight truncate">{toPublicSlug(profile.username)}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize border ${tier.bg} ${tier.text}`}>
              <span className={`h-2 w-2 rounded-full ${tier.dot}`} />
              {tier.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="FileText" size={14} /> {profile.stats.total_posts} posts
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="MessageCircle" size={14} /> {profile.stats.total_comments}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="Eye" size={14} /> {profile.stats.total_views ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {profile.stats.verified && <Icon name="BadgeCheck" size={14} />} {profile.stats.approval_rate}%
            </span>
            <span suppressHydrationWarning className="inline-flex items-center gap-1.5">
              <Icon name="Calendar" size={14} /> {formatDate(profile.stats.member_since)}
            </span>
          </div>

          {/* Own profile actions */}
          {isOwn && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-orange-500">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileUpload} disabled={uploadingImage} className="hidden" />
                {uploadingImage ? <><Icon name="RefreshCw" size={14} className="animate-spin" /> Uploading...</> : <><Icon name="Camera" size={14} /> Change photo</>}
              </label>
              <button onClick={() => router.push('/settings/account')} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-orange-500">
                <Icon name="Settings" size={14} /> Settings
              </button>
              {imageError && <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">{imageError}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ─── Bento Layout: Left Rail (sticky) + Right Feed ─── */}
      <div className="lg:flex lg:gap-8">
        {/* Left rail — trust + authority (sticky on desktop) */}
        <div className="lg:w-[320px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start space-y-6 mb-8 lg:mb-0">
          {/* Trust gauge — Spectrum Slider (own profile only) */}
          {isOwn && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reputation</span>
                <span className={`text-xs font-mono font-bold ${tier.text}`}>{trustScore.toFixed(2)} · {tier.label}</span>
              </div>

              {profile.trust_level === 'newbie' || profile.trust_level === 'ghost' ? (
                <>
                  <div className="relative flex h-2.5 w-full rounded-full bg-white/5 overflow-hidden border border-dashed border-white/10">
                    <div className="bg-gradient-to-r from-orange-500/50 to-pink-500/50 opacity-50" style={{ width: `${Math.min(100, ((trustScore) / 1.0) * 45)}%` }} />
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Next: Neutral at 1.0</span>
                      <span className="font-mono text-white font-bold">{trustScore.toFixed(2)} / 1.00</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {Math.max(0, 3 - profile.posts.filter((p) => p.status === 'approved').length)} more approved posts to unlock custom name & higher limits.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600">
                      <Icon name="Zap" size={12} className="text-orange-400" /> Higher rate limits, no a_ prefix required
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="relative flex h-2.5 w-full rounded-full bg-white/10 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={trustScore}
                    aria-valuemin={0.1}
                    aria-valuemax={2.0}
                    aria-valuetext={`${tier.label} ${trustScore.toFixed(2)}`}
                  >
                    {/* Segmented track: Troll | Newbie | Neutral | Scholar */}
                    <div className="flex w-full">
                      <div className={`flex-1 ${trustScore >= 0.1 ? 'bg-amber-500/40' : 'bg-white/5'} border-r border-black/20`} />
                      <div className={`flex-1 ${trustScore >= 0.5 ? 'bg-zinc-500/40' : 'bg-white/5'} border-r border-black/20`} />
                      <div className={`flex-[1.6] ${trustScore >= 1.0 ? 'bg-white/20' : 'bg-white/5'} border-r border-black/20`} />
                      <div className={`flex-[0.4] ${trustScore >= 1.8 ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-white/5'}`} />
                    </div>
                    {/* Progress fill overlay */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, ((trustScore - 0.1) / 1.9) * 100))}%` }}
                    />
                    {/* Knob */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg ring-2 ring-white/20 transition-all duration-700 ease-out"
                      style={{ left: `calc(${Math.min(100, Math.max(0, ((trustScore - 0.1) / 1.9) * 100))}% - 6px)` }}
                    />
                    {/* Ticks */}
                    <span className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: '21%' }} />
                    <span className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: '47%' }} />
                    <span className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '89%' }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-mono text-zinc-500">
                    <span>0.1</span>
                    <span className={trustScore < 0.5 ? 'text-amber-400 font-bold' : ''}>Troll 0.5</span>
                    <span className={trustScore >= 0.5 && trustScore < 1.0 ? 'text-zinc-300 font-bold' : ''}>1.0</span>
                    <span className={trustScore >= 1.8 ? 'text-orange-400 font-bold' : ''}>Scholar 1.8</span>
                    <span>2.0</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">
                      {trustScore >= 1.8 ? 'Peak — maintain with approvals' : trustScore >= 1.0 ? `Scholar in ${(1.8 - trustScore).toFixed(2)}` : trustScore >= 0.5 ? `Neutral in ${(1.0 - trustScore).toFixed(2)}` : `Neutral in ${(0.5 - trustScore).toFixed(2)}`}
                    </span>
                    <span className="font-mono text-zinc-400">
                      {rateLimitStatus ? `${rateLimitStatus.limits.posts.remaining}/${rateLimitStatus.limits.posts.total} posts` : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SecureMyAuthority — moved from bottom to rail for own profile */}
          {isOwn && (
            <div className="hidden lg:block">
              <SecureMyAuthority />
            </div>
          )}
        </div>

        {/* Right feed — tabs + posts/comments/stats */}
        <div className="flex-1 min-w-0">
          {/* ─── Tabs ─── */}
      <div className="sticky top-14 z-10 mb-8 flex border-b border-white/5 bg-[var(--color-bg)]/80 backdrop-blur-xl -mx-4 sm:-mx-6 px-4 sm:px-6" role="tablist">
        <button role="tab" aria-selected={activeTab === 'posts'} onClick={() => setActiveTab('posts')} className={`relative px-5 sm:px-6 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'posts' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
          Posts ({profile.posts.length})
          {activeTab === 'posts' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />}
        </button>
        <button role="tab" aria-selected={activeTab === 'comments'} onClick={() => setActiveTab('comments')} className={`relative px-5 sm:px-6 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'comments' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
          Comments ({profile.comments.length})
          {activeTab === 'comments' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />}
        </button>
        {isOwn && (
          <button role="tab" aria-selected={activeTab === 'stats'} onClick={() => setActiveTab('stats')} className={`relative px-5 sm:px-6 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${activeTab === 'stats' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Icon name="ChartBar" size={14} /> Stats
            {activeTab === 'stats' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400" />}
          </button>
        )}
      </div>

      {/* ─── Posts Tab ─── */}
      {activeTab === 'posts' && (
        <div>
          {/* Status filter pills (own profile only) */}
          {isOwn && profile.posts.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {(['all', 'approved', 'pending', 'rejected'] as const).map(status => {
                const count = status === 'all' ? profile.posts.length
                  : status === 'pending' ? profile.posts.filter(p => p.status !== 'approved' && !p.rejection_reason).length
                  : status === 'rejected' ? profile.posts.filter(p => p.status === 'rejected' || p.rejection_reason).length
                  : profile.posts.filter(p => p.status === 'approved').length;
                return (
                  <button key={status} onClick={() => setPostFilter(status)} aria-pressed={postFilter === status}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      postFilter === status
                        ? status === 'approved' ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                          : status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : status === 'rejected' ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        : 'bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10 hover:text-zinc-300'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Icon name="FileText" size={32} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-sm text-zinc-500 mb-4">
                {postFilter === 'approved' ? 'No approved posts yet.' :
                 postFilter === 'pending' ? 'No pending posts.' :
                 postFilter === 'rejected' ? 'No rejected posts.' :
                 'No posts yet.'}
              </p>
              {isOwn && (
                <Link href="/new" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:shadow-xl active:scale-[0.98]">
                  <Icon name="Plus" size={14} /> Create your first post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {filteredPosts.map((post, idx) => (
                <Link key={post.id} href={post.status !== 'approved' ? `/pending/${post.id}` : `/${post.slug}`} className={`group p-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 card-deck-enter ${idx < 2 ? 'rounded-2xl glass-slab spatial-depth border border-white/5' : 'rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5'}`} style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="flex items-start gap-2 mb-3">
                    <span className={`shrink-0 rounded-md px-2 py-1 text-2xs font-bold font-mono ${
                      post.post_type === 'best_of' ? 'bg-emerald-500/10 text-emerald-400' :
                      post.post_type === 'worst_of' ? 'bg-red-500/10 text-red-400' :
                      post.post_type === 'this_vs_that' ? 'bg-purple-500/10 text-purple-400' :
                      post.post_type === 'fact_drop' ? 'bg-pink-500/10 text-pink-400' :
                      'bg-orange-500/10 text-orange-400'
                    }`}>{POST_TYPE_LABELS[post.post_type] || post.post_type.replace(/_/g, ' ')}</span>
                    {isOwn && post.status !== 'approved' && (
                      <span className={`shrink-0 rounded-md px-2 py-1 text-2xs font-semibold ${
                        post.revision_guidance ? 'bg-orange-500/10 text-orange-400' :
                        post.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{post.revision_guidance ? 'Revision' : post.status.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  <h3 className="text-[15px] sm:text-base font-bold text-white leading-snug group-hover:text-white transition mb-3 line-clamp-2">{post.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1"><Icon name="MessageCircle" size={12} /> {post.comment_count}</span>
                    <span className="inline-flex items-center gap-1"><Icon name="Eye" size={12} /> {post.view_count ?? 0}</span>
                    <span suppressHydrationWarning>{formatDate(post.created_at)}</span>
                  </div>
                  {isOwn && post.rejection_reason && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400"><strong>Reason:</strong> {post.rejection_reason}</div>
                  )}
                  {isOwn && post.revision_guidance && (
                    <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-orange-400"><strong>Feedback:</strong> {post.revision_guidance}</div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Comments Tab ─── */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {profile.comments.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="MessageCircle" size={32} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-sm text-zinc-500">No comments yet.</p>
            </div>
          ) : (
            profile.comments.map(c => (
              <div key={c.id} className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-6">
                <p className="mb-3 text-[15px] leading-relaxed text-zinc-300 line-clamp-3">{c.content}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1"><Icon name="Flame" size={12} className="text-orange-400" /> {c.fire_count}</span>
                  <span className="inline-flex items-center gap-1"><Icon name="MessageCircle" size={12} /> {c.reply_count}</span>
                  <span suppressHydrationWarning>{formatDate(c.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Stats Tab (own only) ─── */}
      {activeTab === 'stats' && isOwn && rateLimitStatus && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Engagement</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-xl font-bold font-mono text-white">{profile.stats.total_views ?? 0}</p><p className="text-xs text-zinc-500">Views</p></div>
              <div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-xl font-bold font-mono text-white">{profile.stats.total_posts}</p><p className="text-xs text-zinc-500">Posts</p></div>
              <div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-xl font-bold font-mono text-white">{profile.stats.total_comments}</p><p className="text-xs text-zinc-500">Comments</p></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Approval Rate</h3>
            {profile.stats.total_posts === 0 ? (
              <div className="flex h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="bg-white/20 transition-all" style={{ width: '100%' }} />
              </div>
            ) : profile.stats.approval_rate === null || profile.stats.approval_rate === undefined ? (
              <div className="flex h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="bg-white/20 transition-all" style={{ width: '100%' }} />
              </div>
            ) : (
              <div className="flex h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="bg-green-500 transition-all" style={{ width: `${profile.stats.approval_rate}%` }} />
                {profile.stats.approval_rate < 100 && (
                  <div className="bg-red-500/50 transition-all" style={{ width: `${100 - profile.stats.approval_rate}%` }} />
                )}
              </div>
            )}
            <div className="flex justify-between mt-2 text-xs text-zinc-500">
              {profile.stats.total_posts === 0 ? (
                <span className="text-zinc-500">No posts yet</span>
              ) : profile.stats.approval_rate === null || profile.stats.approval_rate === undefined ? (
                <span className="text-zinc-500">Awaiting reviews</span>
              ) : (
                <><span>{profile.stats.approval_rate}% approved</span><span>{100 - profile.stats.approval_rate}% rejected</span></>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Current Limits</h3>
            <div className="space-y-3">
              {(['posts', 'comments', 'counter_lists'] as const).map(key => {
                const limit = rateLimitStatus.limits[key];
                if (!limit || typeof limit.remaining === 'undefined') return null;
                const pct = limit.total !== 'Unlimited' ? Math.round((limit.remaining as number) / (limit.total as number) * 100) : 100;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-zinc-400">{key.replace('_', ' ')}</span>
                      <span className="font-mono text-zinc-500">{limit.remaining} / {limit.total}</span>
                    </div>
                    {typeof limit.total === 'number' && (
                      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-xs text-zinc-500">
              <Icon name="RefreshCw" size={12} /> Resets in: {rateLimitCountdown !== null ? `${Math.floor(rateLimitCountdown / 60)}m ${rateLimitCountdown % 60}s` : '...'}
            </p>
          </div>
        </div>
      )}

      {/* ─── Secure My Authority — mobile only (desktop in rail) ─── */}
      {isOwn && <div className="mt-8 lg:hidden"><SecureMyAuthority /></div>}
        </div>
      </div>
    </div>
  );
}
