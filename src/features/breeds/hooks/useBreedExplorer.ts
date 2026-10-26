import { useMemo, useState } from 'react';

import { searchBreeds, type BreedFilters, type BreedSort } from '../services/breedSearchService';

/** The explorer's query, filters and sort, and the matching breeds. */
export function useBreedExplorer() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<BreedFilters>({});
  const [sort, setSort] = useState<BreedSort>('RELEVANCE');
  const results = useMemo(() => searchBreeds(query, filters, sort), [query, filters, sort]);
  return {
    query,
    setQuery,
    filters,
    /** Merges a filter change; undefined clears that filter. */
    updateFilters: (patch: Partial<BreedFilters>) => setFilters((current) => ({ ...current, ...patch })),
    clearFilters: () => setFilters({}),
    sort,
    setSort,
    results,
  };
}
