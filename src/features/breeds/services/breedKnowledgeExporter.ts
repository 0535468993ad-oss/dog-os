import { BOAS_LABELS_HE, COAT_LABELS_HE, DRIVE_KEYS, DRIVE_LABELS_HE, EXPERIENCE_LABELS_HE, LIVING_LABELS_HE, RISK_LABELS_HE, SEVERITY_LABELS_HE, SIZE_LABELS_HE } from '../data/breedLabels';
import type { BreedProfile } from '../types';

// The breed profiles as Markdown knowledge chunks for the AI advisor's library (supabase/knowledge/*.json,
// validated by scripts/lib/knowledgeSource.ts). One chunk per breed and section keeps each one focused for
// semantic search. Chunks ship unverified: the advisor grounds answers only in reviewed rows.

export type BreedSection = 'identity' | 'temperament' | 'behavior' | 'medical';

export interface BreedKnowledgeChunk {
  slug: string;
  category: 'ETHOLOGY_BEHAVIOR';
  title_he: string;
  content_he: string;
  source_reference: string;
  verified: false;
}

export const BREED_KNOWLEDGE_SOURCE = 'Dog OS – מודיעין גזעים (סטנדרטי FCI, דירוג AKC 2024, ספרות וטרינרית), src/features/breeds/data – ממתין לבדיקה מקצועית';

const range = (r: { min: number; max: number }, unit: string) => `${r.min}–${r.max} ${unit}`;
const list = (items: readonly string[]) => items.map((item) => `- ${item}`).join('\n');

const SECTION_TITLES_HE: Readonly<Record<BreedSection, string>> = {
  identity: 'תעודת זהות והיסטוריה',
  temperament: 'יצרים ואופי',
  behavior: 'אתגרי התנהגות',
  medical: 'פרופיל וטרינרי',
};

/** The Markdown body of one section of a breed profile. */
export function sectionMarkdown(profile: BreedProfile, section: BreedSection): string {
  const { genesis, phenotype, drives, behavior, clinical, fci } = profile;
  switch (section) {
    case 'identity':
      return [
        `## ${profile.names.he} (${profile.names.en})`,
        fci === null
          ? 'אין לגזע תקן FCI.'
          : [`קבוצת FCI ${fci.group} – ${fci.groupNameHe}`, fci.section !== undefined ? `סעיף ${fci.section}` : null, fci.standardNumber !== undefined ? `סטנדרט מספר ${fci.standardNumber}` : null].filter(Boolean).join(', ') + '.',
        `מוצא: ${genesis.countryOfOrigin}, ${genesis.centuryOfOrigin}. ייעוד מקורי: ${genesis.originalUtilityAndFunction}`,
        `דמויות מפתח: ${genesis.founderOrHistoricalKeyFigures}`,
        `אבות הגזע:\n${list(genesis.ancestorBreeds)}`,
        genesis.historicalContextNarrativeHe,
        `גודל: ${SIZE_LABELS_HE[phenotype.sizeCategory]}; זכר ${range(phenotype.maleWeightKg, 'ק״ג')}, ${range(phenotype.maleHeightCm, 'ס״מ')}; נקבה ${range(phenotype.femaleWeightKg, 'ק״ג')}, ${range(phenotype.femaleHeightCm, 'ס״מ')}. ${COAT_LABELS_HE[phenotype.coatType]}, נשירה ${phenotype.sheddingLevel}/5.`,
      ].join('\n\n');
    case 'temperament':
      return [
        `## ${profile.names.he}: יצרים ואופי`,
        list(DRIVE_KEYS.map((key) => `${DRIVE_LABELS_HE[key]}: ${drives[key]}/5`)),
        `אנרגיה: כ־${drives.energyStaminaHoursDaily} שעות פעילות ביום. גירוי מחשבתי: ${drives.mentalStimulationRequirementHe}`,
        `התאמה: ${LIVING_LABELS_HE[profile.suitability.living]}, ${EXPERIENCE_LABELS_HE[profile.suitability.experience]}. הדירוגים הם נטיות של הגזע ולא תחזית לכלב מסוים.`,
      ].join('\n\n');
    case 'behavior':
      return [
        `## ${profile.names.he}: אתגרי התנהגות`,
        `חרדת נטישה: ${RISK_LABELS_HE[behavior.separationAnxietyRisk]}. תגובתיות ברצועה: ${RISK_LABELS_HE[behavior.leashReactivityPredisposition]}. שמירה על משאבים: ${RISK_LABELS_HE[behavior.resourceGuardingTendency]}.`,
        `נביחות ${behavior.vocalizationProfile.tendency}/5. גורמים נפוצים:\n${list(behavior.vocalizationProfile.commonTriggersHe)}`,
        `כשחסר גירוי: ${behavior.understimulationFalloutHe}`,
        `גישה מומלצת: ${behavior.recommendedHandlingStyleHe}`,
      ].join('\n\n');
    case 'medical': {
      const conditions = clinical.geneticVulnerabilities.map(
        (condition) => `### ${condition.conditionNameHe} (${condition.conditionNameEn})\n${condition.pathologySummaryHe}\nחומרה: ${SEVERITY_LABELS_HE[condition.severity]}. בדיקה מומלצת: ${condition.recommendedScreeningProtocol}`,
      );
      return [
        `## ${profile.names.he}: פרופיל וטרינרי`,
        ...conditions,
        `תסובב קיבה: ${clinical.bloatGdvRisk.hasHighPredisposition ? 'נטייה גבוהה' : 'ללא נטייה מוגברת מוכרת'}. ${clinical.bloatGdvRisk.chestConformationNotesHe}`,
        `MDR1 והרדמה: ${clinical.anesthesiaMdr1Risk.precautionsHe}`,
        clinical.brachycephalicBoasGrade ? `מבנה פנים שטוח (BOAS): ${BOAS_LABELS_HE[clinical.brachycephalicBoasGrade]}.` : '',
        `תוחלת חיים ממוצעת: ${range(clinical.averageLongevityYears, 'שנים')}. מידע כללי על נטיות הגזע – לא אבחנה; כל החלטה רפואית עם וטרינר.`,
      ]
        .filter(Boolean)
        .join('\n\n');
    }
  }
}

/** A full breed profile as one Markdown document. */
export function breedToMarkdown(profile: BreedProfile): string {
  return (['identity', 'temperament', 'behavior', 'medical'] as const).map((section) => sectionMarkdown(profile, section)).join('\n\n');
}

/** Every breed as four section chunks, ready for knowledge_chunks. */
export function breedKnowledgeChunks(profiles: readonly BreedProfile[]): BreedKnowledgeChunk[] {
  return profiles.flatMap((profile) =>
    (['identity', 'temperament', 'behavior', 'medical'] as const).map((section) => ({
      slug: `breed-${profile.id}-${section}`,
      category: 'ETHOLOGY_BEHAVIOR' as const,
      title_he: `${profile.names.he} – ${SECTION_TITLES_HE[section]}`,
      content_he: sectionMarkdown(profile, section),
      source_reference: BREED_KNOWLEDGE_SOURCE,
      verified: false as const,
    })),
  );
}
