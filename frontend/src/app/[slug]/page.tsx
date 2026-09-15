import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostDetailClient from './client';
import { API } from '@/lib/api';
import { RESERVED_ROUTES } from '@/lib/reservedRoutes';
import { absoluteUrl } from '@/lib/urls';
import { toPublicSlug } from '@/lib/username';
import { buildArticleMetadata, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = String(resolvedParams.slug);

  if (RESERVED_ROUTES.has(slug)) {
    return { title: 'Post Not Found', robots: { index: false, follow: true } };
  }

  try {
    const data = await API.getPost(slug, { noCount: true });
    const post = data.post;
    const description = post.intro?.substring(0, 160) ?? '';

    const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
    const isStale = (post.comment_count === 0 || !post.comment_count) && (post.view_count === 0 || !post.view_count) && ageHours > 48;
    const isThin = ((post.intro?.length || 0) < 100) && ageHours > 24;
    const isUnpublished = post.status !== 'approved';
    const isNoindex = isStale || isThin || isUnpublished;

    const dynamicOgImageUrl = absoluteUrl(`/${slug}/opengraph-image`);
    const image = {
      url: dynamicOgImageUrl,
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: `${post.title} — YoTop10`,
      type: 'image/png',
    };

    const base = buildArticleMetadata({
      slug,
      title: post.title,
      description,
      path: `/${slug}`,
      image,
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || post.published_at || post.created_at,
      authorName: post.author_display_name || post.author_username,
      authorUrl: absoluteUrl(`/a/${toPublicSlug(post.author_username)}`),
      section: post.category_name || post.category_slug,
      tags: [post.post_type, post.category_slug].filter(Boolean),
    });

    return {
      ...base,
      robots: {
        index: !isNoindex,
        follow: true,
      },
    };
  } catch {
    return { title: 'Post Not Found', robots: { index: false, follow: true } };
  }
}

export default async function PostDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = String(resolvedParams.slug);

  if (RESERVED_ROUTES.has(slug)) {
    notFound();
  }

  try {
    const [postData, commentsData] = await Promise.all([
      API.getPost(slug),
      API.getComments(slug),
    ]);

    const { post, items } = postData;
    const { comments } = commentsData;

    const ld = items.length > 0 ? {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ItemList",
          "@id": absoluteUrl(`/${slug}#list`),
          "name": post.title,
          "description": post.intro?.substring(0, 200) || '',
          "numberOfItems": items.length,
          "itemListElement": items.map((item, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": {
              "@type": "Thing",
              "name": item.title,
              "description": ((item.justification as string) || '').substring(0, 300),
            },
          })),
          "author": { "@type": "Person", "name": post.author_display_name || post.author_username, "url": absoluteUrl(`/a/${toPublicSlug(post.author_username)}`) },
          "datePublished": post.created_at,
          "image": post.hero_image_url || absoluteUrl(`/${slug}/opengraph-image`),
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": absoluteUrl('/') },
            { "@type": "ListItem", "position": 2, "name": post.category_name || post.category_slug, "item": absoluteUrl(`/c/${post.category_slug}`) },
            { "@type": "ListItem", "position": 3, "name": post.title, "item": absoluteUrl(`/${slug}`) },
          ],
        },
      ],
    } : null;

    return (
      <>
        {ld && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/<\//gi, '<\\/') }}
          />
        )}
        <PostDetailClient
          slug={slug}
          initialPost={post}
          initialItems={items}
          initialComments={comments}
        />
      </>
    );
  } catch {
    notFound();
  }
}
