import { BREED_BY_ID } from '@/features/dogs/breeds';
import type { HealthData, VetArticle } from '@/features/health/api';
import type { TrainingModule } from '@/features/training/api';
import type { DogRow, JournalEntryRow } from '@/lib/database.types';
import { ageInMonths, daysBetween, todayIso } from '@/utils/date';

import type { Insight } from './insight';

export interface RuleInputs {
  dog: DogRow;
  health: HealthData | undefined;
  streak: number;
  activeModule: TrainingModule | null;
  nextModule: TrainingModule | null;
  journal: JournalEntryRow[] | undefined;
  breedArticles: VetArticle[];
}

/** Deterministic, offline insights from the same data the AI sees. Always returns three. */
export function ruleBasedInsights({ dog, health, streak, activeModule, nextModule, journal, breedArticles }: RuleInputs): Insight[] {
  const today = todayIso();
  return [healthInsight(dog, health, breedArticles, today), trainingInsight(dog, streak, activeModule, nextModule), lifeStageInsight(dog, journal, today)];
}

/** 1. Health: overdue or upcoming vaccinations first, then breed guidance, then routine checks. */
function healthInsight(dog: DogRow, health: HealthData | undefined, breedArticles: VetArticle[], today: string): Insight {
  const overdue = health?.vaccinations.filter((v) => v.due_date && v.due_date < today) ?? [];
  const upcoming = health?.vaccinations.filter((v) => v.due_date && v.due_date >= today && daysBetween(today, v.due_date) <= 30) ?? [];
  const breed = dog.breed_id ? BREED_BY_ID.get(dog.breed_id) : undefined;

  if (overdue.length) {
    return { kind: 'health', priority: 'high', title: 'חיסון באיחור', body: `${overdue.map((v) => v.name).join(', ')} של ${dog.name} באיחור. קבעו תור לווטרינר בהקדם.` };
  }
  if (upcoming.length) {
    return { kind: 'health', priority: 'normal', title: 'חיסון מתקרב', body: `${upcoming[0]!.name} של ${dog.name} מתוכנן בחודש הקרוב.` };
  }
  if (!health?.vaccinations.length) {
    return { kind: 'health', priority: 'normal', title: 'תעדו את פנקס החיסונים', body: `הוסיפו את החיסונים של ${dog.name} כדי לקבל תזכורות בזמן. חיסון כלבת שנתי הוא חובה בישראל.` };
  }
  if (breed && breedArticles[0]) {
    return { kind: 'health', priority: 'normal', title: `בריאות ה${breed.label}`, body: `${breedArticles[0].summary} כדאי לשוחח על כך עם הווטרינר בביקור הבא.` };
  }
  const weights = health?.weights ?? [];
  const last = weights[weights.length - 1];
  return !last || daysBetween(last.measured_on, today) > 30
    ? { kind: 'health', priority: 'normal', title: 'זמן לשקילה', body: `שקילה חודשית עוזרת לזהות מוקדם שינויים אצל ${dog.name}.` }
    : { kind: 'health', priority: 'normal', title: 'בדיקת שיניים', body: `הציצו בשיניים ובחניכיים של ${dog.name} השבוע – ריח רע או אבנית הם סיבה לבדיקה.` };
}

/** 2. Training: keep the active module going, or suggest the next one. */
function trainingInsight(dog: DogRow, streak: number, activeModule: TrainingModule | null, nextModule: TrainingModule | null): Insight {
  if (activeModule) {
    return {
      kind: 'training',
      priority: 'normal',
      title: streak > 1 ? `רצף של ${streak} ימים!` : `להמשיך: ${activeModule.title}`,
      body: `אימון קצר של 5 דקות היום ב״${activeModule.title}״ ישמור על המומנטום של ${dog.name}.`,
    };
  }
  if (nextModule) return { kind: 'training', priority: 'normal', title: `מודול מומלץ: ${nextModule.title}`, body: nextModule.summary };
  return { kind: 'training', priority: 'normal', title: 'כל המודולים הושלמו', body: `כל הכבוד! שמרו על המיומנויות של ${dog.name} עם חזרות קצרות בסביבות חדשות.` };
}

/** 3. Behavior / nutrition: a pattern of hard days in the journal, otherwise advice for the life stage. */
function lifeStageInsight(dog: DogRow, journal: JournalEntryRow[] | undefined, today: string): Insight {
  const months = ageInMonths(dog.birth_date, today);
  const recentBad = journal?.filter((j) => j.mood === 'bad' && daysBetween(j.entry_date, today) <= 7) ?? [];
  if (recentBad.length >= 2) {
    return { kind: 'behavior', priority: 'normal', title: 'שבוע מאתגר', body: `ביומן נרשמו ${recentBad.length} ימים קשים. שאלו את היועץ החכם על דפוס שחוזר – הוא רואה את הרשומות.` };
  }
  if (months < 4) return { kind: 'behavior', priority: 'normal', title: 'חלון הסוציאליזציה', body: `${dog.name} בתקופה הרגישה ללמידה. חוויה חיובית חדשה אחת ביום – אדם, משטח או צליל.` };
  if (months < 24) return { kind: 'behavior', priority: 'normal', title: 'גיל ההתבגרות', body: `בגיל הזה ${dog.name} עשוי/ה ״לשכוח״ פקודות. סבלנות, אימונים קצרים והרבה העשרה.` };
  if (months >= 96) return { kind: 'nutrition', priority: 'normal', title: 'תזונה לגיל המבוגר', body: `לכלבים מבוגרים כדאי לבדוק עם הווטרינר התאמת קלוריות ותמיכה במפרקים.` };
  return { kind: 'behavior', priority: 'normal', title: 'העשרה מנטלית', body: `10 דקות של עבודת ריח מעייפות את ${dog.name} כמו טיול ארוך. נסו לפזר חטיפים בבית.` };
}
