import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, MIN_TOUCH_AREA, radius, spacing, typography } from '@/constants/theme';

import { AppText } from '../AppText';
import { IconButton } from '../IconButton';
import { filterOptions, shouldOfferCustom, type SelectOption } from './selectLogic';
import { SelectOptionRow, selectRowStyles } from './SelectOptionRow';

interface SelectSheetProps<T extends string> {
  open: boolean;
  label: string;
  options: readonly SelectOption<T>[];
  value: T | null;
  searchable: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onPick: (value: T) => void;
  /** Set when typed values are allowed (e.g. an unlisted breed). */
  onPickCustom?: (text: string) => void;
  onClose: () => void;
}

/** Bottom sheet with optional search, a radio list of options and a "use what I typed" row. */
export function SelectSheet<T extends string>({ open, label, options, value, searchable, query, onQueryChange, onPick, onPickCustom, onClose }: SelectSheetProps<T>) {
  const matches = filterOptions(options, query);
  const customText = query.trim();
  const showCustom = shouldOfferCustom(!!onPickCustom, query, matches);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet} edges={['bottom']} accessibilityViewIsModal>
          <View style={styles.header}>
            <AppText variant="heading" accessibilityRole="header">
              {label}
            </AppText>
            <IconButton icon="close" accessibilityLabel="סגירה" onPress={onClose} />
          </View>
          {searchable ? (
            <TextInput
              value={query}
              onChangeText={onQueryChange}
              placeholder="חיפוש…"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={`חיפוש ב${label}`}
              autoFocus
              textAlign="right"
              style={styles.search}
            />
          ) : null}
          <FlatList
            data={matches}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            accessibilityRole="radiogroup"
            ListHeaderComponent={
              showCustom ? (
                <Pressable
                  onPress={() => onPickCustom?.(customText)}
                  accessibilityRole="button"
                  accessibilityLabel={`שימוש ב״${customText}״`}
                  style={({ pressed }) => [selectRowStyles.option, pressed && selectRowStyles.pressed]}
                >
                  <AppText color="primary" variant="bodyStrong">
                    {`שימוש ב״${customText}״`}
                  </AppText>
                </Pressable>
              ) : undefined
            }
            ListEmptyComponent={
              showCustom ? undefined : (
                <AppText color="textSecondary" center style={styles.empty}>
                  לא נמצאו תוצאות
                </AppText>
              )
            }
            renderItem={({ item }) => <SelectOptionRow option={item} selected={item.value === value} onPress={() => onPick(item.value)} />}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: spacing.md,
    paddingEnd: spacing.xs,
    paddingTop: spacing.sm,
  },
  search: {
    ...typography.body,
    color: colors.textPrimary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: MIN_TOUCH_AREA,
  },
  empty: {
    padding: spacing.lg,
  },
});
