import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Badge, GlassCard, IconButton } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

import { IKC_CLUBS, IKC_WEBSITE } from '../data/ikcClubs';
import { RESCUE_ORGANIZATIONS } from '../data/rescueOrganizations';
import type { BreedMatch } from '../types';
import { SIZE_LABELS_HE, TIER_LABELS_HE, TIER_TONES } from '../utils/labels';
import { CostSection, ListSection, MetricsSection } from './DossierSections';
import { ExternalLinkButton } from './ExternalLinkButton';

/** Full breed dossier: ratings, monthly ₪ breakdown, health clearances, red flags and where to get the dog. */
export function BreedDossierModal({ match, onClose }: { match: BreedMatch | null; onClose: () => void }) {
  return (
    <Modal visible={match !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} accessibilityViewIsModal>
        {match ? <Dossier match={match} onClose={onClose} /> : null}
      </SafeAreaView>
    </Modal>
  );
}

/** The dossier body for one match. */
function Dossier({ match, onClose }: { match: BreedMatch; onClose: () => void }) {
  const { breed } = match;
  const isRescue = breed.acquisition === 'RESCUE';
  const club = breed.ikcClubId ? IKC_CLUBS[breed.ikcClubId] : undefined;
  const shelterLinks = RESCUE_ORGANIZATIONS.flatMap((organization) => (organization.website ? [{ id: organization.id, url: organization.website, label: organization.nameHe }] : []));

  return (
    <>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="title" accessibilityRole="header">
            {breed.nameHe}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {`${breed.nameEn} · ${SIZE_LABELS_HE[breed.size]} · ${breed.weightRangeKg.min}–${breed.weightRangeKg.max} ק״ג · ${breed.lifeExpectancyYears.min}–${breed.lifeExpectancyYears.max} שנים`}
          </AppText>
        </View>
        <IconButton icon="close" accessibilityLabel="סגירת התיק" onPress={onClose} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Badge label={`${match.matchPercentage}% · ${TIER_LABELS_HE[match.tier]}`} tone={TIER_TONES[match.tier]} />
        {match.dealBreakersHe.length > 0 ? <ListSection title="דגלים אדומים" items={match.dealBreakersHe} tone="warning" /> : null}
        {match.cautionsHe.length > 0 ? <ListSection title="מה צריך להתאים" items={match.cautionsHe} /> : null}
        <GlassCard style={styles.reality}>
          <AppText variant="heading" accessibilityRole="header" color="warning">
            בדיקת מציאות
          </AppText>
          <AppText>{breed.realityCheckWarningHe}</AppText>
        </GlassCard>
        <MetricsSection metrics={breed.metrics} />
        <CostSection cost={match.monthlyCost} priceRange={breed.israeliEconomics.ikcPuppyPriceRangeILS} isRescue={isRescue} />
        <ListSection title="נקודות תורפה רפואיות" items={breed.medicalAndGenetics.commonVulnerabilitiesHe} />
        <ListSection title={isRescue ? 'מה לבקש מהעמותה' : 'בדיקות חובה להורים – לפני שמשלמים'} items={breed.medicalAndGenetics.mandatoryParentClearancesHe} />
        <GlassCard>
          <AppText variant="heading" accessibilityRole="header">
            {isRescue ? 'איפה מאמצים' : 'איפה מוצאים מגדל אחראי'}
          </AppText>
          {isRescue ? (
            shelterLinks.map((link) => <ExternalLinkButton key={link.id} url={link.url} label={link.label} />)
          ) : (
            <>
              <AppText color="textSecondary">
                {club ? `${club.nameHe} – דרך ההתאחדות הישראלית לכלבנות. בקשו את רשימת ההמלטות המאושרות.` : 'פנו להתאחדות הישראלית לכלבנות לבירור החוג האחראי על הגזע ולרשימת המלטות מאושרות.'}
              </AppText>
              <ExternalLinkButton url={IKC_WEBSITE} label="אתר ההתאחדות הישראלית לכלבנות" />
            </>
          )}
        </GlassCard>
      </ScrollView>
    </>
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
  flex: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  reality: {
    borderColor: colors.warning,
  },
});
