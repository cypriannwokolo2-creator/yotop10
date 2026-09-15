import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticleDetailClient from './client';
import { API } from '@/lib/api';
import { absoluteUrl } from '@/lib/urls';
import { buildArticleMetadata, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = String(resolvedParams.slug);

  try {
    const data = await API.getArticle(slug, { noCount: true });
    const article = data.article;

    const ageHours = (Date.now() - new Date(article.created_at).getTime()) / 3600000;
    const isStale = (article.comment_count === 0 || !article.comment_count) && (article.view_count === 0 || !article.view_count) && ageHours > 48;
    const isThin = ((article.body?.length || 0) < 200) && ageHours > 24;
    const isUnpublished = article.status !== 'approved';
    const isNoindex = isStale || isThin || isUnpublished;

    const description = article.body?.substring(0, 160) ?? '';
    const dynamicOgImageUrl = absoluteUrl(`/articles/${slug}/opengraph-image`);
    const image = {
      url: dynamicOgImageUrl,
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: `${article.title} — YoTop10`,
      type: 'image/png',
    };

    const base = buildArticleMetadata({
      slug,
      title: article.title,
      description,
      path: `/articles/${slug}`,
      image,
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.updated_at || article.published_at || article.created_at,
      authorName: article.author_display_name || article.author_username,
      section: article.category_name || article.category_slug,
      tags: ['article', article.category_slug].filter(Boolean),
    });

    return {
      ...base,
      robots: {
        index: !isNoindex,
        follow: true,
      },
    };
  } catch {
    return { title: 'Article Not Found', robots: { index: false, follow: true } };
  }
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const slug = String(resolvedParams.slug);

  let initialArticle = null;
  try {
    const data = await API.getArticle(slug, { noCount: true });
    initialArticle = data.article;
  } catch {
    notFound();
  }

  if (!initialArticle) {
    notFound();
  }

  return <ArticleDetailClient slug={slug} initialArticle={initialArticle} />;
}
