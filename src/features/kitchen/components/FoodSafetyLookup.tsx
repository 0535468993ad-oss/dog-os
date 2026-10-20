import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';

import type { FoodSafetyResult } from '../types';
import { SafetyAlertBadge } from './SafetyAlertBadge';

interface FoodSafetyLookupProps {
  query: string;
  onChangeQuery: (text: string) => void;
  result: FoodSafetyResult | null;
}

/** "Can my dog eat this?" – a free-text field with the verdict underneath, announced as it changes. */
export function FoodSafetyLookup({ query, onChangeQuery, result }: FoodSafetyLookupProps) {
  return (
    <View style={styles.wrap}>
      <TextField
        label="מה הכלב יכול לאכול?"
        value={query}
        onChangeText={onChangeQuery}
        placeholder="למשל: ענבים, אורז, עוגת שוקולד"
        hint="כתבו שם של מזון או של מאכל שלם"
        autoCorrect={false}
        maxLength={80}
        returnKeyType="search"
      />
      <View accessibilityLiveRegion="polite">
        {result ? <SafetyAlertBadge tier={result.tier} title={result.definition?.nameHe ?? query.trim()} detailsHe={result.feedbackHe} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
});
