import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, ChipGroup, IconButton, TextField } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import { useCatalogExplorer } from '../hooks/useCatalogExplorer';
import type { CatalogFilter } from '../types';
import { CATALOG_FILTER_LABELS } from '../utils/catalogFilter';
import { ProductCard } from './ProductCard';

const FILTER_OPTIONS = (Object.keys(CATALOG_FILTER_LABELS) as CatalogFilter[]).map((value) => ({ value, label: CATALOG_FILTER_LABELS[value] }));

interface CatalogExplorerModalProps {
  open: boolean;
  selectedId: string | undefined;
  recommendedIds: readonly string[];
  onPick: (productId: string) => void;
  onClose: () => void;
}

/** Full-screen catalog: category chips, live search and product cards (recommended first). */
export function CatalogExplorerModal({ open, selectedId, recommendedIds, onPick, onClose }: CatalogExplorerModalProps) {
  const catalog = useCatalogExplorer(recommendedIds);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} accessibilityViewIsModal>
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header" style={styles.title}>
            קטלוג מזון ותוספים
          </AppText>
          <IconButton icon="close" accessibilityLabel="סגירת הקטלוג" onPress={onClose} />
        </View>
        <View style={styles.controls}>
          <TextField label="חיפוש" value={catalog.query} onChangeText={catalog.setQuery} placeholder="שם מוצר או מותג" returnKeyType="search" />
          <ChipGroup options={FILTER_OPTIONS} value={catalog.filter} onChange={catalog.setFilter} accessibilityLabel="סינון לפי סוג" scrollable />
          <AppText variant="caption" color="textSecondary" accessibilityLiveRegion="polite">{`${catalog.results.length} מוצרים · המחירים משוערים, כדאי לבדוק בחנות`}</AppText>
        </View>
        <FlatList
          data={catalog.results}
          keyExtractor={(product) => product.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<AppText color="textSecondary">לא נמצא מוצר כזה. נסו מילה אחרת.</AppText>}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              selected={item.id === selectedId}
              recommended={recommendedIds.includes(item.id)}
              onSelect={() => {
                onPick(item.id);
                onClose();
              }}
            />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  title: {
    flex: 1,
  },
  controls: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  list: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});
