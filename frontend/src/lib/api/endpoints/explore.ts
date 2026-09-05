import { apiFetch } from '../client';
import type { ExploreResponse } from '../types';

export const exploreApi = {
  getExplore: (page = 1, limit = 20, type?: string) =>
    apiFetch<ExploreResponse>(`/explore?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
};
