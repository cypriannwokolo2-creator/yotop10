import { Suspense } from 'react';
import { SearchSkeleton } from '@/components/SearchSkeleton';

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      {children}
    </Suspense>
  );
}
