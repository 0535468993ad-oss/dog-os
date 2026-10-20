import { Stack } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card, Screen } from '@/components/ui';
import { isBusinessInfoComplete } from '@/config/business';
import { spacing } from '@/constants/theme';
import { formatDate } from '@/utils/date';

import { BusinessFooter } from './components';
import { LEGAL_DOCUMENTS, type LegalDocId } from './documents';

export function LegalDocumentScreen({ doc }: { doc: LegalDocId }) {
  const document = LEGAL_DOCUMENTS[doc];

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: document.title }} />
      <AppText variant="title" accessibilityRole="header">
        {document.title}
      </AppText>
      <AppText variant="caption" color="textSecondary">{`גרסה: ${formatDate(document.version)}`}</AppText>

      {!isBusinessInfoComplete ? (
        <Card tone="warning">
          <AppText variant="label" color="warning">
            טיוטה: פרטי העסק טרם הושלמו והמסמך ממתין לבדיקה משפטית.
          </AppText>
        </Card>
      ) : null}

      {document.sections.map((section) => (
        <View key={section.heading} style={{ gap: spacing.xs }}>
          <AppText variant="heading" accessibilityRole="header">
            {section.heading}
          </AppText>
          {section.paragraphs.map((paragraph) => (
            <AppText key={paragraph}>{paragraph}</AppText>
          ))}
        </View>
      ))}

      <BusinessFooter />
    </Screen>
  );
}
