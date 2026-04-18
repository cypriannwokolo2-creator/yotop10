'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Search, 
  Check,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Category } from '@/lib/api';

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  error?: boolean;
}

export default function CategorySelect({ categories, value, onChange, error }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(c => c.id === value);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-semibold mb-2 ml-1 text-muted-foreground group">
        Select Domain <span className="text-primary group-hover:scale-110 inline-block transition-transform">*</span>
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-14 px-5 rounded-2xl border border-border bg-card flex items-center justify-between transition-all duration-300 hover:border-primary/40 focus:ring-4 focus:ring-primary/10 shadow-sm",
          isOpen && "border-primary/60 ring-4 ring-primary/10",
          error && "border-red-500/50 bg-red-500/[0.02]"
        )}
      >
        <div className="flex items-center gap-3">
          {selectedCategory ? (
            <>
              <span className="text-xl leading-none">{selectedCategory.icon || '📌'}</span>
              <span className="font-bold text-lg tracking-tight">{selectedCategory.name}</span>
            </>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground opacity-60">
              <LayoutGrid size={20} />
              <span className="text-lg">Classify this list...</span>
            </div>
          )}
        </div>
        <ChevronDown 
          className={cn("text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} 
          size={20} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="absolute z-50 top-full left-0 right-0 bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-4 border-b border-border/30 bg-muted/20">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="Filter universes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
              <div className="grid grid-cols-1 gap-1">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onChange(cat.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all group",
                      value === cat.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-2xl transition-transform group-hover:scale-110",
                        value === cat.id ? "text-white" : ""
                      )}>
                        {cat.icon || '📌'}
                      </span>
                      <div className="text-left">
                        <span className="font-black tracking-tight block leading-tight">{cat.name}</span>
                        {cat.slug && (
                          <span className={cn(
                            "text-[10px] uppercase font-bold tracking-widest",
                            value === cat.id ? "text-white/60" : "text-muted-foreground"
                          )}>
                            {cat.slug}
                          </span>
                        )}
                      </div>
                    </div>
                    {value === cat.id && <Check size={18} className="text-white" />}
                  </button>
                ))}
                
                {filteredCategories.length === 0 && (
                  <div className="py-12 text-center">
                    <LayoutGrid className="mx-auto text-muted-foreground/30 mb-3" size={32} />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No dimension matches</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-muted/10 border-t border-border/30 text-center">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                YoTop10 Taxonomy Protocol
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
