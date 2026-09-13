import { profileUrl } from '@/lib/urls';

export async function GET() {
  const baseUrl = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
  let users: Array<{ username: string; updated_at?: string }> = [];
  try {
    const res = await fetch(`${baseUrl}/users/sitemap`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json() as { users: Array<{ username: string; updated_at?: string }> };
      users = data.users || [];
    }
  } catch {
    // fallback: no users
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${users.map(u => `  <url><loc>${profileUrl(u.username)}</loc><lastmod>${new Date(u.updated_at || Date.now()).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.4</priority></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
