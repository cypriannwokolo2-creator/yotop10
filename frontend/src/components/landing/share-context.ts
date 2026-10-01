'use client';

import { createContext, useContext } from 'react';

export type ShareFn = (title: string, href: string) => void;

export const LandingShareContext = createContext<ShareFn>(() => {});

export function useLandingShare(): ShareFn {
  return useContext(LandingShareContext);
}
