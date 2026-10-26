import { StyleSheet, View } from 'react-native';

import { Button, ChipGroup, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';

import type { BreedFilters, BreedSort } from '../services/breedSearchService';

type FilterTag = 'APARTMENT' | 'NOVICE' | 'SMALL' | 'LOW_SHEDDING' | 'GDV' | 'BRACHY';

const FILTER_TAGS: readonly { value: FilterTag; label: string }[] = [
  { value: 'APARTMENT', label: 'מתאים לדירה' },
  { value: 'NOVICE', label: 'למתחילים' },
  { value: 'SMALL', label: 'קטן' },
  { value: 'LOW_SHEDDING', label: 'נשירה נמוכה' },
  { value: 'GDV', label: 'סיכון לתסובב קיבה' },
  { value: 'BRACHY', label: 'פנים שטוחות' },
];

const SORTS: readonly { value: BreedSort; label: string }[] = [
  { value: 'RELEVANCE', label: 'רלוונטיות' },
  { value: 'ENERGY', label: 'לפי אנרגיה' },
  { value: 'POPULARITY', label: 'פופולריות (AKC 2024, ארה״ב)' },
  { value: 'LONGEVITY', label: 'לפי תוחלת חיים' },
];

/** The active filter tags for a filter object. */
function tagsOf(filters: BreedFilters): FilterTag[] {
  const tags: FilterTag[] = [];
  if (filters.living === 'APARTMENT_FRIENDLY') tags.push('APARTMENT');
  if (filters.experience === 'NOVICE_FRIENDLY') tags.push('NOVICE');
  if (filters.sizes?.length) tags.push('SMALL');
  if (filters.maxShedding !== undefined) tags.push('LOW_SHEDDING');
  if (filters.gdvRisk) tags.push('GDV');
  if (filters.brachycephalic) tags.push('BRACHY');
  return tags;
}

/** The filter object for a set of tags. */
function filtersOf(tags: readonly FilterTag[]): BreedFilters {
  const has = (tag: FilterTag) => tags.includes(tag);
  return {
    living: has('APARTMENT') ? 'APARTMENT_FRIENDLY' : undefined,
    experience: has('NOVICE') ? 'NOVICE_FRIENDLY' : undefined,
    sizes: has('SMALL') ? ['TOY', 'SMALL'] : undefined,
    maxShedding: has('LOW_SHEDDING') ? 2 : undefined,
    gdvRisk: has('GDV') || undefined,
    brachycephalic: has('BRACHY') || undefined,
  };
}

interface BreedFilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: BreedFilters;
  onFiltersChange: (filters: BreedFilters) => void;
  sort: BreedSort;
  onSortChange: (sort: BreedSort) => void;
  onClear: () => void;
}

/** The explorer header: search in Hebrew or English, filter tags and sort chips. */
export function BreedFilterBar({ query, onQueryChange, filters, onFiltersChange, sort, onSortChange, onClear }: BreedFilterBarProps) {
  const tags = tagsOf(filters);
  return (
    <View style={styles.root}>
      <TextField label="חיפוש גזע" placeholder="למשל: רועה גרמני, GSD, Husky" value={query} onChangeText={onQueryChange} autoCorrect={false} returnKeyType="search" />
      <ChipGroup<FilterTag> multiple options={FILTER_TAGS} value={tags} onChange={(next) => onFiltersChange(filtersOf(next))} accessibilityLabel="סינון גזעים" scrollable />
      <ChipGroup options={SORTS} value={sort} onChange={onSortChange} accessibilityLabel="מיון גזעים" scrollable />
      {tags.length > 0 || query ? <Button title="ניקוי חיפוש וסינון" variant="ghost" compact onPress={onClear} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
});
