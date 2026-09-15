import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/urls';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yotop10.com';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const SITE_NAME = 'YoTop10';
export const SITE_DESCRIPTION = 'The open catalog of ranked lists, debates, and sourced facts. Submit your list. Defend your rankings. Curate the best of everything.';
export const TWITTER_HANDLE = process.env.NEXT_PUBLIC_TWITTER_HANDLE || '@yotop10';

export interface OgImageRef {
  url: string;
  width?: number;
  height?: number;
  alt: string;
  type?: string;
}

export interface ArticleMetadataInput {
  slug: string;
  title: string;
  description: string;
  path: string;
  image?: OgImageRef;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  authorUrl?: string;
  section?: string;
  tags?: string[];
}

export const buildCanonical = (path: string): string => absoluteUrl(path);

export const buildOgUrl = (path: string): string => absoluteUrl(path);

export const buildOgImageObject = (image: OgImageRef) => ({
  url: image.url,
  width: image.width ?? OG_IMAGE_WIDTH,
  height: image.height ?? OG_IMAGE_HEIGHT,
  alt: image.alt,
  type: image.type ?? 'image/png',
});

export const buildArticleMetadata = (input: ArticleMetadataInput): Metadata => {
  const canonical = buildCanonical(input.path);
  const ogImages = input.image ? [buildOgImageObject(input.image)] : [];
  return {
    title: `${input.title} — ${SITE_NAME}`,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: input.title,
      description: input.description,
      siteName: SITE_NAME,
      locale: 'en_US',
      images: ogImages,
      ...(input.publishedTime || input.modifiedTime || input.authorName || input.section || input.tags
        ? {
            article: {
              ...(input.publishedTime && { publishedTime: input.publishedTime }),
              ...(input.modifiedTime && { modifiedTime: input.modifiedTime }),
              ...(input.authorName && { authors: [input.authorName] }),
              ...(input.section && { section: input.section }),
              ...(input.tags && input.tags.length > 0 && { tags: input.tags }),
            },
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: input.authorName ? TWITTER_HANDLE : undefined,
      title: input.title,
      description: input.description,
      images: ogImages,
    },
  };
};

export const buildProfileMetadata = (input: {
  username: string;
  displayName: string;
  description: string;
  path: string;
  image?: OgImageRef;
  postCount?: number;
  trustScore?: number;
}): Metadata => {
  const canonical = buildCanonical(input.path);
  const ogImages = input.image ? [buildOgImageObject(input.image)] : [];
  const trustLabel = typeof input.trustScore === 'number' ? `${input.trustScore.toFixed(2)} trust` : undefined;
  const label1 = typeof input.postCount === 'number' ? `${input.postCount} posts` : undefined;
  return {
    title: `${input.displayName} — ${SITE_NAME}`,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      url: canonical,
      title: `${input.displayName} on ${SITE_NAME}`,
      description: input.description,
      siteName: SITE_NAME,
      locale: 'en_US',
      images: ogImages,
      username: input.username,
      firstName: input.displayName.split(/\s+/)[0] || input.displayName,
      lastName: input.displayName.split(/\s+/).slice(1).join(' ') || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: `${input.displayName} on ${SITE_NAME}`,
      description: input.description,
      images: ogImages,
      ...(label1 ? { label1, data1: label1 } : {}),
      ...(trustLabel ? { label2: trustLabel, data2: trustLabel } : {}),
    },
  };
};

export const buildWebsiteMetadata = (input: {
  path: string;
  title?: string;
  description?: string;
  image?: OgImageRef;
  robots?: Metadata['robots'];
  type?: 'website' | 'article';
}): Metadata => {
  const canonical = buildCanonical(input.path);
  const ogImages = input.image ? [buildOgImageObject(input.image)] : [];
  return {
    title: input.title ? `${input.title} — ${SITE_NAME}` : `${SITE_NAME} — Fact Mine. Debate Ground.`,
    description: input.description ?? SITE_DESCRIPTION,
    alternates: { canonical },
    ...(input.robots ? { robots: input.robots } : {}),
    openGraph: {
      type: input.type ?? 'website',
      url: canonical,
      title: input.title ?? `${SITE_NAME} — Fact Mine. Debate Ground.`,
      description: input.description ?? SITE_DESCRIPTION,
      siteName: SITE_NAME,
      locale: 'en_US',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: input.title ?? `${SITE_NAME} — Fact Mine. Debate Ground.`,
      description: input.description ?? SITE_DESCRIPTION,
      images: ogImages,
    },
  };
};

export const SITE = {
  URL: SITE_URL,
  NAME: SITE_NAME,
  DESCRIPTION: SITE_DESCRIPTION,
  OG_IMAGE_DEFAULT: `${SITE_URL}/og-image.jpg`,
  TWITTER_HANDLE,
} as const;