'use client';

import { useState, createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  active: string;
  setActive: (val: string) => void;
}

const TabsContext = createContext<TabsContextType>({ active: '', setActive: () => {} });

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-xl', className)}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
        active === value
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}
