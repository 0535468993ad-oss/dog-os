import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { CareUrgency, OrganSystem, VetCategory } from '@/lib/database.types';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Urgency is always conveyed by text + icon, never by color alone.
export const URGENCY: Record<CareUrgency, { label: string; action: string; tone: 'danger' | 'warning' | 'success'; icon: IconName }> = {
  emergency: { label: 'חירום', action: 'פנו מיד למרפאה וטרינרית', tone: 'danger', icon: 'alert-circle' },
  vet_visit: { label: 'ביקור וטרינר', action: 'קבעו תור לווטרינר בהקדם (תוך 24–48 שעות)', tone: 'warning', icon: 'medkit' },
  home_care: { label: 'טיפול ביתי', action: 'אפשר לעקוב בבית – ופנו לווטרינר אם אין שיפור או מופיע סימן מדאיג', tone: 'success', icon: 'home' },
};

export const VET_CATEGORY_LABELS: Record<VetCategory, string> = {
  emergency: 'עזרה ראשונה וחירום',
  condition: 'מחלות ומצבים',
  breed_health: 'בריאות לפי גזע',
  preventive: 'רפואה מונעת',
  medication: 'תרופות ובטיחות',
};

export const ORGAN_SYSTEM_LABELS: Record<OrganSystem, string> = {
  cardiovascular: 'לב וכלי דם',
  respiratory: 'נשימה',
  gastrointestinal: 'עיכול',
  dermatological: 'עור',
  neurological: 'מערכת העצבים',
  musculoskeletal: 'שלד ומפרקים',
  urinary: 'דרכי השתן',
  endocrine: 'הורמונים ומטבוליזם',
  ocular: 'עיניים',
  otic: 'אוזניים',
  dental: 'שיניים',
  multisystem: 'רב-מערכתי',
};

export const MEDICAL_DISCLAIMER =
  'המידע כללי ולמטרות הסברה בלבד, ואינו מחליף בדיקה, אבחון או טיפול של וטרינר. במצב חירום פנו מיד למרפאה.';
