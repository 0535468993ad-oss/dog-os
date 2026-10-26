import { AppText, Button, ChipGroup, GlassCard } from '@/components/ui';
import type { DogRow } from '@/lib/database.types';

interface DogStepProps {
  dogs: readonly Pick<DogRow, 'id' | 'name'>[];
  selectedId: string | null;
  onPick: (dogId: string) => void;
  onAddDog: () => void;
}

/** Which dog the assessment is for; with no dog yet, a way to add one first. */
export function DogStep({ dogs, selectedId, onPick, onAddDog }: DogStepProps) {
  if (dogs.length === 0) {
    return (
      <GlassCard>
        <AppText variant="heading" accessibilityRole="header">
          קודם כול, הכלב
        </AppText>
        <AppText>עוד לא הוספתם כלב. נתחיל בפרטים הבסיסיים – שם, גזע ותאריך לידה – ונחזור לכאן.</AppText>
        <Button title="הוספת כלב" icon="add" onPress={onAddDog} />
      </GlassCard>
    );
  }
  return (
    <GlassCard>
      <AppText variant="heading" accessibilityRole="header">
        את מי אנחנו מאבחנים?
      </AppText>
      <ChipGroup options={dogs.map((dog) => ({ value: dog.id, label: dog.name }))} value={selectedId} onChange={onPick} accessibilityLabel="בחירת הכלב לאבחון" />
      <Button title="הוספת כלב אחר" variant="ghost" compact onPress={onAddDog} />
    </GlassCard>
  );
}
