'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { CategoryNode, FlatCategory, flattenCategories, getRecentSlugs, pushRecentSlug, searchFlatCategories } from '@/lib/categories';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onSelect: (slug: string, name: string, path: string[]) => void;
  categories: CategoryNode[];
}

export default function CategoryPickerModal({ open, onOpenChange, value, onSelect, categories }: Props) {
  const [query, setQuery] = useState('');
  const [levelId, setLevelId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const flat = useMemo(() => flattenCategories(categories), [categories]);
  const parents = categories;

  const currentParent = levelId ? parents.find(p => p.id === levelId) || null : null;
  const levelChildren = useMemo(() => (currentParent ? currentParent.children : []), [currentParent]);

  const searchResults = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchFlatCategories(query, flat, 80);
  }, [query, flat]);

  const recents = useMemo(() => {
    if (!open || query) return [];
    const slugs = getRecentSlugs();
    return slugs
      .map(slug => flat.find(f => f.slug === slug))
      .filter(Boolean) as FlatCategory[];
  }, [open, query, flat]);

  const popular = useMemo(() => {
    if (!open || query || recents.length > 0) return [];
    return [...flat].sort((a, b) => b.post_count - a.post_count).slice(0, 6);
  }, [open, query, flat, recents]);

  const isSearching = query.trim().length >= 2;
  const listItems: Array<{ type: 'flat'; data: FlatCategory } | { type: 'parent'; data: CategoryNode } | { type: 'child'; data: CategoryNode['children'][number] & { parent: CategoryNode } }> = useMemo(() => {
    if (isSearching) return searchResults.map(d => ({ type: 'flat' as const, data: d }));
    if (levelId && currentParent) {
      return levelChildren.map(c => ({ type: 'child' as const, data: { ...c, parent: currentParent } }));
    }
    // root level: parents
    return parents.map(p => ({ type: 'parent' as const, data: p }));
  }, [isSearching, searchResults, levelId, currentParent, levelChildren, parents]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // restore level from value if possible
      if (value) {
        const found = flat.find(f => f.slug === value);
        if (found && found.parentId) setLevelId(found.parentId);
        else setLevelId(null);
      } else {
        setLevelId(null);
      }
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, value, flat]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, levelId]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  const handleSelect = (slug: string, name: string, path: string[]) => {
    pushRecentSlug(slug);
    onSelect(slug, name, path);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select category"
        className="relative w-full sm:max-w-lg bg-zinc-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[78vh] overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/5 bg-zinc-900 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Select category</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white transition"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex(prev => Math.min(prev + 1, Math.max(0, listItems.length - 1)));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const item = listItems[activeIndex];
                  if (!item) return;
                  if (item.type === 'flat') handleSelect(item.data.slug, item.data.name, item.data.path);
                  else if (item.type === 'parent') setLevelId(item.data.id);
                  else if (item.type === 'child') handleSelect(item.data.slug, item.data.name, [item.data.parent.name, item.data.name]);
                } else if (e.key === 'Backspace' && !query && levelId) {
                  e.preventDefault();
                  setLevelId(null);
                }
              }}
              placeholder="Search categories… e.g. football, AI, movies"
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none"
              aria-label="Search categories"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-white"
                aria-label="Clear search"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {/* Breadcrumb + Back */}
          <div className="flex items-center gap-2 text-xs">
            {levelId ? (
              <>
                <button
                  type="button"
                  onClick={() => setLevelId(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-400 hover:bg-white/5 hover:text-white transition"
                >
                  <Icon name="ArrowLeft" size={12} /> Back
                </button>
                <span className="text-zinc-600">/</span>
                <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLevelId(null)}
                    className="truncate text-zinc-500 hover:text-zinc-300 transition"
                  >
                    All
                  </button>
                  <Icon name="ChevronRight" size={10} className="text-zinc-700 shrink-0" />
                  <span className="truncate font-medium text-white" aria-current="page">{currentParent?.name}</span>
                  {currentParent && <span className="ml-1 hidden sm:inline text-zinc-600">· {currentParent.children.length} subcategories</span>}
                </nav>
              </>
            ) : (
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-zinc-500">
                <span className="font-medium text-white">All categories</span>
                <span className="hidden sm:inline">· {parents.length} parents · {flat.length} leaves</span>
              </nav>
            )}
          </div>
        </div>

        {/* Body */}
        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
          {/* Searching */}
          {isSearching ? (
            searchResults.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Icon name="Search" size={24} className="mx-auto mb-2 text-zinc-700" />
                <p className="text-sm text-zinc-500">No results for “{query}”</p>
                <button type="button" onClick={() => setQuery('')} className="mt-2 text-xs text-orange-400 hover:text-orange-300">Clear search</button>
              </div>
            ) : (
              <div role="listbox" aria-label="Search results" className="p-2">
                {searchResults.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  const isSelected = value === item.slug;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(item.slug, item.name, item.path)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition ${
                        isActive ? 'bg-white/10' : isSelected ? 'bg-orange-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-orange-500/15 text-orange-400' : 'bg-white/5 text-zinc-500'}`}>
                        <Icon name={(item.icon as never) || 'Folder'} size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${isSelected ? 'text-orange-400 font-medium' : 'text-white'}`}>{item.name}</span>
                        <span className="block truncate text-2xs text-zinc-500">{item.path.slice(0, -1).join(' › ')}</span>
                      </span>
                      <span className="shrink-0 flex items-center gap-2">
                        {item.post_count > 0 && <span className="rounded-full bg-white/5 px-2 py-0.5 text-2xs text-zinc-500">{item.post_count}</span>}
                        {isSelected && <Icon name="Check" size={14} className="text-orange-400" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : levelId && currentParent ? (
            // Level view: children
            <div role="listbox" aria-label={`${currentParent.name} subcategories`} className="p-2">
              {levelChildren.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">No subcategories</div>
              ) : (
                levelChildren.map((child, idx) => {
                  const isSelected = value === child.slug;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={child.slug}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(child.slug, child.name, [currentParent.name, child.name])}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition ${
                        isActive ? 'bg-white/10' : isSelected ? 'bg-orange-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-orange-500/15 text-orange-400' : 'bg-white/5 text-zinc-500'}`}>
                        <Icon name={(child.icon as never) || currentParent.icon as never || 'Folder'} size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${isSelected ? 'text-orange-400 font-medium' : 'text-white'}`}>{child.name}</span>
                        <span className="block truncate text-2xs text-zinc-500">{currentParent.name} › {child.name}</span>
                      </span>
                      <span className="shrink-0 flex items-center gap-2">
                        {child.post_count > 0 && <span className="rounded-full bg-white/5 px-2 py-0.5 text-2xs text-zinc-500">{child.post_count}</span>}
                        {isSelected ? <Icon name="Check" size={14} className="text-orange-400" /> : <span className="h-2 w-2 rounded-full bg-white/10" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            // Root level: parents + recents/popular
            <div className="p-2 space-y-4">
              {recents.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-zinc-600">Recent</div>
                  <div className="space-y-1">
                    {recents.map((item) => {
                      const isSelected = value === item.slug;
                      return (
                        <button
                          key={`recent-${item.slug}`}
                          type="button"
                          onClick={() => handleSelect(item.slug, item.name, item.path)}
                          className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 transition ${isSelected ? 'bg-orange-500/10' : 'hover:bg-white/5'}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                            <Icon name="Clock" size={14} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm ${isSelected ? 'text-orange-400 font-medium' : 'text-white'}`}>{item.name}</span>
                            <span className="block truncate text-2xs text-zinc-500">{item.path.join(' › ')}</span>
                          </span>
                          {isSelected && <Icon name="Check" size={14} className="text-orange-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {popular.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-zinc-600">Popular</div>
                  <div className="space-y-1">
                    {popular.map(item => {
                      const isSelected = value === item.slug;
                      return (
                        <button
                          key={`pop-${item.slug}`}
                          type="button"
                          onClick={() => handleSelect(item.slug, item.name, item.path)}
                          className={`w-full text-left rounded-xl px-3 py-2 flex items-center gap-3 transition ${isSelected ? 'bg-orange-500/10' : 'hover:bg-white/5'}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-500">
                            <Icon name={(item.icon as never) || 'Flame'} size={14} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm ${isSelected ? 'text-orange-400' : 'text-white'}`}>{item.name}</span>
                            <span className="block truncate text-2xs text-zinc-500">{item.path.join(' › ')} · {item.post_count} posts</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-zinc-600">
                  {recents.length > 0 || popular.length > 0 ? 'All parents' : 'Browse by parent'}
                </div>
                <div role="listbox" aria-label="Parent categories" className="space-y-1">
                  {parents.map((parent, idx) => {
                    const isActive = !isSearching && levelId === null && idx === activeIndex - (recents.length + popular.length > 0 ? 1 : 0);
                    // adjust activeIndex for recents/popular offset — simpler: use idx for parent list only when not searching
                    return (
                      <button
                        key={parent.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => setLevelId(parent.id)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition ${
                          isActive ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
                          <Icon name={(parent.icon as never) || 'Folder'} size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{parent.name}</span>
                          <span className="block truncate text-2xs text-zinc-500">{parent.children.length} subcategories · {parent.post_count + parent.children.reduce((a, c) => a + c.post_count, 0)} posts</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline text-2xs text-zinc-600">{parent.children.length} ›</span>
                          <Icon name="ChevronRight" size={14} className="text-zinc-600" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/5 bg-zinc-900 px-4 py-3 flex items-center justify-between">
          <div className="text-2xs text-zinc-600">
            {value ? (
              <span>Selected: <strong className="text-zinc-300">{flat.find(f => f.slug === value)?.path.join(' › ') || value}</strong></span>
            ) : (
              <span>Choose a subcategory — parents are for browsing</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {value && (
              <button type="button" onClick={() => { onSelect('', '', []); onOpenChange(false); }} className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 hover:text-white transition">
                Clear
              </button>
            )}
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
