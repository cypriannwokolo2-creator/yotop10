'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'auto';
}

export default function ImageUpload({ 
  value, 
  onChange, 
  label, 
  className,
  aspectRatio = 'video' 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { url } = await API.uploadImage(file);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const ratioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    auto: 'min-h-[150px]'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{label}</label>}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative overflow-hidden border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group',
          ratioClasses[aspectRatio],
          value ? 'border-transparent' : 'border-muted hover:border-primary/50 bg-muted/20 hover:bg-muted/30',
          error ? 'border-red-500/50 bg-red-500/5' : ''
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleUpload} 
          className="hidden" 
          accept="image/*"
        />

        <AnimatePresence mode="wait">
          {value ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={value} 
                alt="Upload preview" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 text-white shadow-xl">
                  <Upload size={20} />
                </div>
              </div>
              <button 
                onClick={clearImage}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors z-10"
              >
                <X size={14} />
              </button>
            </motion.div>
          ) : isUploading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium animate-pulse">Engaging Upload Modules...</p>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                <Upload size={24} />
              </div>
              <div>
                <p className="font-bold text-sm tracking-tight">Drop Media or Click</p>
                <p className="text-xs text-muted-foreground mt-1">High-fidelity visuals increase reach</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="absolute bottom-3 left-3 right-3 p-2 rounded-lg bg-red-500 text-white text-[10px] font-bold text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
