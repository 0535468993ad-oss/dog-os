import type { CatalogFilter, FoodProduct } from '../types';

export const CATALOG_FILTER_LABELS: Record<CatalogFilter, string> = {
  ALL: 'הכל',
  POUCH: 'מזון מבושל בשקיות',
  DRY_KIBBLE: 'מזון יבש',
  SUPPLEMENT: 'תוספי מפרקים ובריאות',
};

const fold = (text: string) => text.toLowerCase().replace(/[׳'"״]/g, '').trim();

/** Products in the category whose Hebrew name, English name or brand contains the query. */
export function filterCatalog(products: readonly FoodProduct[], filter: CatalogFilter, query: string): FoodProduct[] {
  const q = fold(query);
  return products.filter((product) => {
    if (filter !== 'ALL' && product.category !== filter) return false;
    if (!q) return true;
    return [product.nameHe, product.nameEn, product.brand].some((text) => fold(text).includes(q));
  });
}

/** Recommended products first (in the given order), the rest after in catalog order. */
export function withRecommendedFirst(products: readonly FoodProduct[], recommendedIds: readonly string[]): FoodProduct[] {
  const rank = (product: FoodProduct) => {
    const index = recommendedIds.indexOf(product.id);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...products].sort((a, b) => rank(a) - rank(b));
}
