import { router } from 'expo-router';

import { Button, EmptyState, Screen } from '@/components/ui';

export default function NotFoundRoute() {
  return (
    <Screen edges={['bottom']}>
      <EmptyState
        icon="paw-outline"
        title="הדף לא נמצא"
        body="ייתכן שהקישור שגוי או שהדף הוסר."
        action={<Button title="חזרה לדף הבית" onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
