import { router } from 'expo-router';
import Animated from 'react-native-reanimated';

import { enterAt } from '@/components/motion';
import { AppText, EmptyState, Screen } from '@/components/ui';

import { BreedCard } from '../components/BreedCard';
import { BreedFilterBar } from '../components/BreedFilterBar';
import { useBreedExplorer } from '../hooks/useBreedExplorer';

/** The breed encyclopedia: search in Hebrew or English, filter, sort and open a breed's full profile. */
export function BreedExplorerScreen() {
  const explorer = useBreedExplorer();
  return (
    <Screen edges={[]}>
      <AppText variant="title" accessibilityRole="header">
        מודיעין גזעים
      </AppText>
      <BreedFilterBar
        query={explorer.query}
        onQueryChange={explorer.setQuery}
        filters={explorer.filters}
        onFiltersChange={(filters) => explorer.updateFilters({ ...filters })}
        sort={explorer.sort}
        onSortChange={explorer.setSort}
        onClear={() => {
          explorer.setQuery('');
          explorer.clearFilters();
        }}
      />
      <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">{`${explorer.results.length} גזעים`}</AppText>
      {explorer.results.length === 0 ? (
        <EmptyState icon="search-outline" title="לא נמצא גזע" body="נסו שם אחר בעברית או באנגלית, או הסירו סינון." />
      ) : (
        explorer.results.map((profile, index) => (
          <Animated.View key={profile.id} entering={enterAt(index)}>
            <BreedCard profile={profile} onPress={() => router.push({ pathname: '/breeds/[breedId]', params: { breedId: profile.id } })} />
          </Animated.View>
        ))
      )}
    </Screen>
  );
}
