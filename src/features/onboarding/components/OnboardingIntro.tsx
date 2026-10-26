import { AppText, BulletList, GlassCard } from '@/components/ui';

const WHAT_WE_LEARN_HE: readonly string[] = [
  'מה מניע אותו: אוכל, משחק או שניהם.',
  'איך הוא מתמודד עם הפתעות, עם לחץ ועם גבולות.',
  'איך הוא בחוץ, ומה הכי חשוב לכם ללמד.',
];

/** The first onboarding screen: why we ask, and that the choice of method stays with the owner. */
export function OnboardingIntro() {
  return (
    <GlassCard>
      <AppText variant="title" accessibilityRole="header">
        בואו נכיר את הכלב שלכם
      </AppText>
      <AppText>אין שני כלבים זהים. 11 שאלות קצרות, כ־2 דקות, ונתאים תוכנית אילוף בדיוק לו.</AppText>
      <BulletList items={WHAT_WE_LEARN_HE} />
      <AppText color="textSecondary">בסוף תקבלו המלצה מנומקת – וההחלטה באיזו שיטה לעבוד נשארת שלכם.</AppText>
    </GlassCard>
  );
}
