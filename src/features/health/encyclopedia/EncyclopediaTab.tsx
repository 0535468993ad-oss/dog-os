import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Checkbox, ChipGroup, Disclaimer, EmptyState, ErrorState, LoadingState, TextField } from '@/components/ui';
import { BREED_BY_ID } from '@/features/dogs/breeds';
import { useActiveDog } from '@/features/dogs/hooks';
import type { VetCategory } from '@/lib/database.types';
import { spacing } from '@/theme';
import { toUserMessage } from '@/utils/errors';

import { useVetKnowledge } from '../hooks';
import { MEDICAL_DISCLAIMER, VET_CATEGORY_LABELS } from '../labels';
import { emergencyArticles, filterVetArticles } from '../logic/vetSearch';
import { EmergencyStrip } from './EmergencyStrip';
import { VetArticleCard } from './VetArticleCard';

const CATEGORY_OPTIONS: { value: VetCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'הכל' },
  ...(Object.keys(VET_CATEGORY_LABELS) as VetCategory[]).map((value) => ({ value, label: VET_CATEGORY_LABELS[value] })),
];

/** Veterinary encyclopedia tab: emergency shortcuts, search, category and breed filters. */
export function EncyclopediaTab() {
  const knowledge = useVetKnowledge();
  const { activeDog } = useActiveDog();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<VetCategory | 'all'>('all');
  const [myBreedOnly, setMyBreedOnly] = useState(false);

  const breedId = activeDog?.breed_id ?? null;
  const breedLabel = breedId ? BREED_BY_ID.get(breedId)?.label : null;

  const filtered = useMemo(
    () => filterVetArticles(knowledge.data?.articles ?? [], { query, category, breedId: myBreedOnly ? breedId : null }),
    [knowledge.data, query, category, myBreedOnly, breedId],
  );

  if (knowledge.isLoading) return <LoadingState />;
  if (knowledge.error || !knowledge.data) return <ErrorState message={toUserMessage(knowledge.error)} onRetry={() => void knowledge.refetch()} />;

  return (
    <View style={styles.list}>
      <Disclaimer>{MEDICAL_DISCLAIMER}</Disclaimer>
      <EmergencyStrip articles={emergencyArticles(knowledge.data.articles)} />
      <TextField label="חיפוש מהיר" value={query} onChangeText={setQuery} placeholder="מחלה, סימפטום, גזע…" returnKeyType="search" />
      <ChipGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} accessibilityLabel="סינון לפי קטגוריה" scrollable />
      {breedId && breedLabel ? <Checkbox checked={myBreedOnly} onChange={setMyBreedOnly} label={`רק מה שרלוונטי ל${breedLabel}`} /> : null}

      <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
        {`${filtered.length} ערכים`}
      </AppText>

      {filtered.length === 0 ? (
        <EmptyState icon="search" title="לא נמצאו ערכים" body="נסו מילת חיפוש אחרת או הסירו סינון." />
      ) : (
        filtered.map((article) => <VetArticleCard key={article.id} article={article} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
});
