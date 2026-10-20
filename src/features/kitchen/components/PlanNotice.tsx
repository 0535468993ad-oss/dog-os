import { AppText, BulletList, GlassCard } from '@/components/ui';

import type { EmergencyPortionPlan } from '../types';

type NoticePlan = Exclude<EmergencyPortionPlan, { status: 'ready' }> | null;

/** Why there's no recipe yet: no weight, a weight out of range, or a missing protein or carb. */
export function PlanNotice({ plan }: { plan: NoticePlan }) {
  return (
    <GlassCard>
      {plan?.status === 'missing' ? (
        <>
          <AppText variant="subheading">כדי להרכיב ארוחה עדינה, צריך עוד קצת:</AppText>
          <BulletList items={plan.missingHe} />
          <AppText variant="caption" color="textSecondary">
            סמנו למעלה מה יש לכם בבית, והכמויות יופיעו כאן.
          </AppText>
        </>
      ) : (
        <AppText color="textSecondary">
          {plan?.status === 'invalid_weight'
            ? 'החישוב מתאים לכלבים במשקל 1 עד 90 ק״ג. בדקו את המשקל שהזנתם.'
            : 'הזינו את המשקל של הכלב, ונחשב בשבילכם כמה לתת בכל ארוחה.'}
        </AppText>
      )}
    </GlassCard>
  );
}
