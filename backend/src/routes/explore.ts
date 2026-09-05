/* eslint-disable no-restricted-syntax, @typescript-eslint/no-explicit-any -- Express middleware type chains */
import { Router } from 'express';
import { Post } from '../models/Post';
import { Article } from '../models/Article';
import { User } from '../models/User';
import { ListItem } from '../models/ListItem';
import { computeExploreScore, trackExploreView, type ExploreSignals } from '../lib/exploreScore';
import { getCategoryNameMap } from '../lib/categoryCache';

const router: Router = Router();

router.get('/', async (req: any, res: any) => {
  try {
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit as string) || 20));
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const typeFilter = (req.query.type as string) || null;

    // Map frontend filter tabs to actual post_types
    const TYPE_MAP: Record<string, string[]> = {
      list: ['top_list', 'best_of', 'worst_of', 'counter_list', 'hidden_gems', 'who_is_better'],
      vs: ['this_vs_that'],
      article: ['article'],
      fact: ['fact_drop'],
    };
    const allowedTypes = typeFilter ? (TYPE_MAP[typeFilter] || null) : null;

    const categoryNameMap = await getCategoryNameMap();
    const catName = (slug: string) => categoryNameMap.get(slug) || slug;

    const posts = await Post.find({ status: 'approved', deleted: { $ne: true } })
      .sort({ created_at: -1 })
      .limit(200)
      .lean();

    // Also fetch articles (separate model)
    const articles = await Article.find({ status: 'approved' })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    if (posts.length === 0 && articles.length === 0) {
      return res.json({ posts: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } });
    }

    const recentlyViewed: string[] = [];
    if (req.user) {
      try {
        const user = await User.findOne({ user_id: req.user.user_id }).select('last_viewed_categories').lean();
        if ((user as any)?.last_viewed_categories) {
          recentlyViewed.push(...((user as any).last_viewed_categories as string[]));
        }
      } catch { /* user not found — fresh */ }
    }

    const scores = await Promise.all(
      posts.map(async (post) => {
        const signals: ExploreSignals = {
          published_at: post.published_at || post.created_at,
          comment_count: post.comment_count || 0,
          view_count: post.view_count || 0,
          bookmark_count: (post as any).bookmark_count || 0,
          author_trust_score: 1.0,
          category_slug: (post as any).category_slug || '',
          bumped_at: post.bumped_at || null,
        };

        try {
          const userDoc = await User.findOne({ user_id: post.author_id }).select('trust_score').lean();
          if (userDoc) signals.author_trust_score = userDoc.trust_score;
        } catch { /* default 1.0 */ }

        const score = await computeExploreScore((post._id as any).toString(), signals, recentlyViewed);
        return { ...score, slug: post.slug, title: post.title, post_type: post.post_type, category_slug: signals.category_slug, author_username: post.author_username, author_display_name: post.author_display_name, comment_count: signals.comment_count, view_count: signals.view_count, format: (post as any).format || 'list_only', hero_image_url: (post as any).hero_image_url || null, created_at: post.created_at, topItems: [] as Array<{ rank: number; title: string }> };
      })
    );

    // Add articles to scores
    for (const art of articles) {
      const signals: ExploreSignals = {
        published_at: (art as any).published_at || art.created_at,
        comment_count: (art as any).comment_count || 0,
        view_count: (art as any).view_count || 0,
        bookmark_count: (art as any).bookmark_count || 0,
        author_trust_score: 1.0,
        category_slug: (art as any).category_slug || '',
        bumped_at: null,
      };
      const score = await computeExploreScore((art._id as any).toString(), signals, recentlyViewed);
      scores.push({
        ...score,
        post_id: (art._id as any).toString(),
        slug: (art as any).slug || '',
        title: (art as any).title || '',
        post_type: 'article',
        category_slug: signals.category_slug,
        author_username: (art as any).author_username || '',
        author_display_name: (art as any).author_display_name || (art as any).author_name || '',
        comment_count: signals.comment_count,
        view_count: signals.view_count,
        format: 'article',
        hero_image_url: (art as any).cover_image || null,
        created_at: art.created_at,
        topItems: [],
      });
    }

    const allItems = await ListItem.find({ post_id: { $in: posts.map((p) => p._id) } }).sort({ rank: 1 }).select('post_id rank title').lean();
    const itemsByPost: Record<string, Array<{ rank: number; title: string }>> = {};
    for (const item of allItems) {
      const pid = (item as any).post_id?.toString() || '';
      if (!itemsByPost[pid]) itemsByPost[pid] = [];
      if (itemsByPost[pid].length < 3) itemsByPost[pid].push({ rank: item.rank, title: item.title });
    }

    for (const s of scores) {
      const pid = scores.find((x) => x.post_id === s.post_id);
      if (pid) pid.topItems = itemsByPost[pid.post_id] || [];
    }

    scores.sort((a, b) => b.score - a.score);

    // If a type filter is active, skip diversity algorithm and just paginate filtered results
    if (allowedTypes) {
      const filtered = scores.filter(s => allowedTypes.includes(s.post_type));
      const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return res.json({
        posts: paginated.map((s) => ({
          id: s.post_id,
          slug: s.slug,
          title: s.title,
          post_type: s.post_type,
          category_slug: s.category_slug,
          category_name: catName(s.category_slug),
          author_username: s.author_username,
          author_display_name: s.author_display_name,
          comment_count: s.comment_count,
          view_count: s.view_count,
          format: s.format,
          hero_image_url: s.hero_image_url,
          topItems: s.topItems,
          explore_score: s.score,
          created_at: s.created_at,
        })),
        pagination: { page, limit, total: filtered.length, totalPages },
      });
    }

    // ── DIVERSITY ALGORITHM ──
    // Group by type, sorted by score within each group
    const byType: Record<string, typeof scores> = {};
    for (const s of scores) {
      const t = s.post_type || 'top_list';
      if (!byType[t]) byType[t] = [];
      byType[t].push(s);
    }

    const allTypes = Object.keys(byType);
    const totalPages = Math.max(1, Math.ceil(scores.length / limit));

    // Track how many posts of each type have been placed across all pages
    const typeCounters: Record<string, number> = {};
    for (const t of allTypes) typeCounters[t] = 0;

    // Build every page up front
    const pages: (typeof scores)[] = [];
    for (let p = 0; p < totalPages; p++) {
      const pagePosts: typeof scores = [];
      const pageUsed = new Set<string>();

      // Round 1: GUARANTEE — 1 from each type if available
      for (const t of allTypes) {
        const bucket = byType[t];
        const idx = typeCounters[t];
        if (idx < bucket.length) {
          pagePosts.push(bucket[idx]);
          pageUsed.add(bucket[idx].post_id);
          typeCounters[t]++;
        }
      }

      // Round 2: FILLERS — only from types with excess
      // A type has excess if it still has unused posts AND
      // its total count > totalPages (meaning it CAN appear more than once)
      if (pagePosts.length < limit) {
        // Collect excess posts: types that have more than 1 post per page potential
        const excessPosts: typeof scores = [];
        for (const t of allTypes) {
          const bucket = byType[t];
          if (bucket.length > totalPages) {
            // This type has excess — grab remaining unused
            for (let i = typeCounters[t]; i < bucket.length; i++) {
              if (!pageUsed.has(bucket[i].post_id)) {
                excessPosts.push(bucket[i]);
              }
            }
          }
        }

        // Sort excess by score descending and take what we need
        excessPosts.sort((a, b) => b.score - a.score);
        for (const post of excessPosts) {
          if (pagePosts.length >= limit) break;
          if (!pageUsed.has(post.post_id)) {
            pagePosts.push(post);
            pageUsed.add(post.post_id);
            typeCounters[post.post_type] = (typeCounters[post.post_type] || 0) + 1;
          }
        }
      }

      // Round 3: LAST RESORT — fill remaining from any unused post by score
      if (pagePosts.length < limit) {
        for (const post of scores) {
          if (pagePosts.length >= limit) break;
          if (!pageUsed.has(post.post_id)) {
            pagePosts.push(post);
            pageUsed.add(post.post_id);
          }
        }
      }

      pages.push(pagePosts);
    }

    // Serve the requested page
    const paginated = pages[page - 1] || [];

    res.json({
      posts: paginated.map((s) => ({
        id: s.post_id,
        slug: s.slug,
        title: s.title,
        post_type: s.post_type,
        category_slug: s.category_slug,
        category_name: catName(s.category_slug),
        author_username: s.author_username,
        author_display_name: s.author_display_name,
        comment_count: s.comment_count,
        view_count: s.view_count,
        format: s.format,
        hero_image_url: s.hero_image_url,
        topItems: s.topItems,
        explore_score: s.score,
        created_at: s.created_at,
      })),
      pagination: { page, limit, total: scores.length, totalPages },
    });
  } catch (e) {
    console.error('Explore error:', e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/view', async (req: any, res: any) => {
  try {
    const { post_id } = req.body;
    if (post_id) {
      await trackExploreView(post_id);
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
