import { useMemo, useState } from 'react';

import { FOOD_CATALOG } from '../data/foodCatalog';
import type { CatalogFilter } from '../types';
import { filterCatalog, withRecommendedFirst } from '../utils/catalogFilter';

/** Catalog browsing state: category, search text and the matching products, recommended first. */
export function useCatalogExplorer(recommendedIds: readonly string[]) {
  const [filter, setFilter] = useState<CatalogFilter>('ALL');
  const [query, setQuery] = useState('');
  const results = useMemo(() => withRecommendedFirst(filterCatalog(FOOD_CATALOG, filter, query), recommendedIds), [filter, query, recommendedIds]);
  return { filter, setFilter, query, setQuery, results };
}
