import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import UserProfileClient from './client';
import { toPublicSlug } from '@/lib/username';
import { profileUrl } from '@/lib/urls';

interface UserProfile {
  username: string;
  canonical_url?: string;
  profile_image_url?: string | null;
  bio?: string;
  links?: { medium?: string; x?: string; github?: string };
  trust_level: 'newbie' | 'ghost' | 'troll' | 'neutral' | 'scholar';
  created_at: string;
  stats: {
    member_since: string;
    total_posts: number;
    total_comments: number;
    approval_rate: number | null;
    verified?: boolean;
  };
  posts: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    post_type: string;
    comment_count: number;
    created_at: string;
    category: { name?: string; slug: string } | null;
    revision_guidance?: string;
    rejection_reason?: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    post_id: string;
    fire_count: number;
    reply_count: number;
    created_at: string;
  }>;
  is_own_profile: boolean;
  trust_score?: number;
}

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
  try {
    const res = await fetch(`${baseUrl}/users/${username}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'User Not Found' };
    const u = await res.json() as UserProfile;
    const bio = (u.bio || '').trim();
    const description = bio ? bio.slice(0, 160) : `Posts and debates by ${u.username} — ${u.stats.total_posts} lists, ${u.stats.total_comments} comments.`;
    return {
      title: bio ? `${u.username} — ${bio.slice(0, 40)} — YoTop10` : `${u.username} — YoTop10`,
      description,
      alternates: { canonical: profileUrl(u.username) },
      openGraph: {
        title: `${u.username} on YoTop10`,
        description: bio ? bio.slice(0, 200) : description,
        url: profileUrl(u.username),
        type: 'profile',
        images: u.profile_image_url ? [u.profile_image_url] : ['/og-image.jpg'],
      },
      twitter: { card: 'summary_large_image', title: `${u.username} on YoTop10`, description, images: u.profile_image_url ? [u.profile_image_url] : ['/og-image.jpg'] },
    };
  } catch {
    return { title: 'User Not Found' };
  }
}

export default async function UserProfileServer({ params }: PageProps) {
  const { username } = await params;

  // Strip a_ prefix to normalize URLs — prevents flash redirect
  if (username.startsWith('a_')) {
    redirect(`/a/${toPublicSlug(username)}`);
  }

  // Forward device_fingerprint cookie so backend can identify the viewer
  const cookieStore = await cookies();
  const fpCookie = cookieStore.get('device_fingerprint')?.value || '';
  const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000/api';

  let profile: UserProfile | null = null;
  try {
    const res = await fetch(`${baseUrl}/users/${username}`, {
      headers: fpCookie ? { Cookie: `device_fingerprint=${fpCookie}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) notFound();
    profile = await res.json() as UserProfile;
  } catch {
    notFound();
  }

  if (!profile) notFound();
  if (profile.canonical_url && profile.canonical_url !== `/a/${username}`) {
    redirect(profile.canonical_url);
  }

  return <UserProfileClient initialProfile={profile} />;
}
