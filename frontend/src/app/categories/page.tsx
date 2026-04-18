'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API, Category } from '@/lib/api';
import { Grid, Layers, Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getCategories()
      .then((data) => setCategories(data.categories || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header Splash */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
          <Grid size={32} className="text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Explore by Category
        </h1>
        <p className="text-lg text-muted-foreground">
          Dive into endless rankings and interactive debates split safely into exactly the topic you care about.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-border rounded-3xl">
          <p className="text-muted-foreground text-lg">No category networks established yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/c/${cat.slug}`} className="group relative block overflow-hidden rounded-3xl border border-border/50 bg-card hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300">
              {/* Optional Background Image */}
              {cat.image_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${cat.image_url})` }}
                />
              )}
              
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/95 via-background/80 to-background/20" />

              <div className="relative z-20 p-8 flex flex-col h-full min-h-[260px] justify-end">
                {/* Top Badge Overlay */}
                <div className="absolute top-6 right-6 px-3 py-1 bg-background/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 shadow-sm">
                  <Layers size={14} className="text-primary" />
                  <span className="text-xs font-bold">{cat.post_count} Lists</span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {cat.icon && (
                    <span className="text-3xl drop-shadow-md bg-white/10 p-2 rounded-xl border border-white/5 backdrop-blur-md">
                      {cat.icon}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h2>
                </div>
                
                {cat.description && (
                  <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}

                {/* Subcategories */}
                {cat.children && cat.children.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-2">
                    {cat.children.map(child => (
                      <span key={child.id} className="text-xs font-semibold px-2.5 py-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                        {child.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}