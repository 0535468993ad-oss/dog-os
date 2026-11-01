import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Checkbox, ChipGroup, Disclaimer, EmptyState, ErrorState, LoadingState, SectionHeader, StaleDataNotice, TextField } from '@/components/ui';
import { cacheState } from '@/lib/queryView';
import { BREED_BY_ID } from '@/features/dogs/breeds';
import { useActiveDog } from '@/features/dogs/hooks';
import type { VetCategory } from '@/lib/database.types';
import { spacing } from '@/constants/theme';
import { toUserMessage } from '@/utils/errors';

import { useVetKnowledge } from '../hooks';
import { MEDICAL_DISCLAIMER, VET_CATEGORY_LABELS } from '../labels';
import { emergencyArticles, filterVetArticles, resultCountLabel } from '../logic/vetSearch';
import { EmergencyActions } from './EmergencyActions';
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
  // Offline with no device copy: the call and map actions still work, so they stay above the error.
  if (!knowledge.data) {
    return (
      <View style={styles.list}>
        <EmergencyActions />
        <ErrorState message={toUserMessage(knowledge.error)} onRetry={() => void knowledge.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <StaleDataNotice visible={cacheState(knowledge.error, true) === 'stale' || !!knowledge.data.offline} onRetry={() => void knowledge.refetch()} />
      <Disclaimer>{MEDICAL_DISCLAIMER}</Disclaimer>
      <EmergencyStrip articles={emergencyArticles(knowledge.data.articles)} />
      <EmergencyActions />
      <View style={styles.section}>
        <SectionHeader title="אנציקלופדיה וטרינרית" />
        <TextField label="חיפוש מהיר" value={query} onChangeText={setQuery} placeholder="מחלה, סימפטום, גזע…" returnKeyType="search" autoCorrect={false} />
        <ChipGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} accessibilityLabel="סינון לפי קטגוריה" scrollable />
        {breedId && breedLabel ? <Checkbox checked={myBreedOnly} onChange={setMyBreedOnly} label={`רק מה שרלוונטי ל${breedLabel}`} /> : null}
        <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">
          {resultCountLabel(filtered.length)}
        </AppText>
      </View>

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
  // The search block sits a little apart from the emergency strip above it.
  section: {
    gap: spacing.sm + 4,
    marginTop: spacing.sm,
  },
});
