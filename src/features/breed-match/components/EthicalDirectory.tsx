import { StyleSheet, View } from 'react-native';

import { AppText, BulletList, GlassCard } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import { ANTI_SCAM_POINTS_HE, BREEDER_AUDIT_CHECKLIST_HE, IKC_CLUBS, IKC_WEBSITE } from '../data/ikcClubs';
import { ADOPTION_BASKET_HE, REGION_LABELS_HE, RESCUE_ORGANIZATIONS } from '../data/rescueOrganizations';
import type { IsraelRegion } from '../types';
import { ExternalLinkButton } from './ExternalLinkButton';

const REGIONS = Object.keys(REGION_LABELS_HE) as IsraelRegion[];

/** IKC breeders versus shelters: the anti-scam banner, the breeder audit and the rescue directory. */
export function EthicalDirectory() {
  return (
    <View style={styles.root}>
      <GlassCard style={styles.alert}>
        <AppText variant="heading" accessibilityRole="header" color="dangerText">
          &quot;גזעי בלי תעודות&quot; – למה זה לא מציאה
        </AppText>
        <BulletList items={ANTI_SCAM_POINTS_HE} />
      </GlassCard>

      <GlassCard>
        <AppText variant="heading" accessibilityRole="header">
          קונים ממגדל? חוגי הגזע של ההתאחדות
        </AppText>
        {Object.values(IKC_CLUBS).map((club) => (
          <View key={club.id} style={styles.item}>
            <AppText variant="bodyStrong">{club.nameHe}</AppText>
            <AppText variant="caption" color="textSecondary">
              {club.scopeHe}
            </AppText>
          </View>
        ))}
        <ExternalLinkButton url={IKC_WEBSITE} label="אתר ההתאחדות הישראלית לכלבנות" />
        <AppText variant="subheading">בדיקת מגדל – לפני שמשלמים</AppText>
        <BulletList items={BREEDER_AUDIT_CHECKLIST_HE} />
      </GlassCard>

      <GlassCard>
        <AppText variant="heading" accessibilityRole="header">
          מאמצים? עמותות ומקלטים לפי אזור
        </AppText>
        <BulletList items={ADOPTION_BASKET_HE} />
        {REGIONS.map((region) => (
          <View key={region} style={styles.region}>
            <AppText variant="subheading" color="accentBronze">
              {REGION_LABELS_HE[region]}
            </AppText>
            {RESCUE_ORGANIZATIONS.filter((organization) => organization.region === region).map((organization) => (
              <View key={organization.id} style={styles.item}>
                <AppText variant="bodyStrong">{organization.nameHe}</AppText>
                <AppText variant="caption" color="textSecondary">{`${organization.areaHe}. ${organization.noteHe}`}</AppText>
                {organization.website ? <ExternalLinkButton url={organization.website} label={`לאתר של ${organization.nameHe}`} /> : null}
              </View>
            ))}
          </View>
        ))}
        <AppText variant="caption" color="textSecondary">
          ימי אימוץ ומספרי טלפון משתנים – כדאי לבדוק בעמוד של העמותה לפני שמגיעים.
        </AppText>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  alert: {
    borderColor: colors.danger,
  },
  item: {
    gap: spacing.xxs,
  },
  region: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
