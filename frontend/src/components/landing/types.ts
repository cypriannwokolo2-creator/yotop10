export interface LandingItem {
  href: string;
  title: string;
  image: string | null;
  category: string;
  author: string;
  date: string;
  excerpt: string;
  readingMeta: string;
}

export interface LandingTag {
  slug: string;
  name: string;
  count: number;
  icon: string;
}
