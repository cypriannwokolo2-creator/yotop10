'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from './icons/Icon';

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
}

export function CustomDropdown({ value, onChange, options, placeholder = 'Select', className = '' }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected ? selected.label : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm text-white outline-none transition focus:border-orange-500/50"
      >
        <span className={selected ? 'text-white' : 'text-zinc-500'}>{displayLabel}</span>
        <Icon name="ChevronDown" size={14} className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-white/10 bg-[#0a0a14] shadow-2xl shadow-black/50">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition hover:bg-white/[0.06] ${
                value === opt.value ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
