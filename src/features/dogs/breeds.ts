import type { DogSize } from '@/lib/database.types';

// Canonical breed slugs. They are stored in dogs.breed_id and matched against
// veterinary_knowledge_base.breeds for breed-specific health guidance – keep slugs stable.
export interface Breed {
  id: string;
  label: string;
  typicalSize: DogSize;
}

export const BREEDS: readonly Breed[] = [
  { id: 'mixed', label: 'מעורב', typicalSize: 'medium' },
  { id: 'canaan-dog', label: 'כלב כנעני', typicalSize: 'medium' },
  { id: 'labrador', label: 'לברדור רטריבר', typicalSize: 'large' },
  { id: 'golden-retriever', label: 'גולדן רטריבר', typicalSize: 'large' },
  { id: 'german-shepherd', label: 'רועה גרמני', typicalSize: 'large' },
  { id: 'belgian-malinois', label: 'רועה בלגי מלינואה', typicalSize: 'large' },
  { id: 'border-collie', label: 'בורדר קולי', typicalSize: 'medium' },
  { id: 'australian-shepherd', label: 'רועה אוסטרלי', typicalSize: 'medium' },
  { id: 'collie', label: 'קולי', typicalSize: 'large' },
  { id: 'shetland-sheepdog', label: 'שלטי', typicalSize: 'small' },
  { id: 'french-bulldog', label: 'בולדוג צרפתי', typicalSize: 'small' },
  { id: 'english-bulldog', label: 'בולדוג אנגלי', typicalSize: 'medium' },
  { id: 'pug', label: 'פאג', typicalSize: 'small' },
  { id: 'boxer', label: 'בוקסר', typicalSize: 'large' },
  { id: 'shih-tzu', label: 'שיצו', typicalSize: 'small' },
  { id: 'maltese', label: 'מלטזי', typicalSize: 'small' },
  { id: 'chihuahua', label: 'צ׳יוואווה', typicalSize: 'small' },
  { id: 'yorkshire-terrier', label: 'יורקשייר טרייר', typicalSize: 'small' },
  { id: 'pomeranian', label: 'פומרניאן', typicalSize: 'small' },
  { id: 'poodle', label: 'פודל (טוי/מיניאטורי)', typicalSize: 'small' },
  { id: 'standard-poodle', label: 'פודל סטנדרטי', typicalSize: 'large' },
  { id: 'bichon-frise', label: 'ביישון פריזה', typicalSize: 'small' },
  { id: 'cavalier', label: 'קבליר קינג צ׳ארלס ספניאל', typicalSize: 'small' },
  { id: 'cocker-spaniel', label: 'קוקר ספניאל', typicalSize: 'medium' },
  { id: 'beagle', label: 'ביגל', typicalSize: 'medium' },
  { id: 'dachshund', label: 'תחש', typicalSize: 'small' },
  { id: 'jack-russell', label: 'ג׳ק ראסל טרייר', typicalSize: 'small' },
  { id: 'schnauzer', label: 'שנאוצר', typicalSize: 'medium' },
  { id: 'amstaff', label: 'אמסטף', typicalSize: 'medium' },
  { id: 'doberman', label: 'דוברמן', typicalSize: 'large' },
  { id: 'rottweiler', label: 'רוטווילר', typicalSize: 'large' },
  { id: 'weimaraner', label: 'ויימרנר', typicalSize: 'large' },
  { id: 'dalmatian', label: 'דלמטי', typicalSize: 'large' },
  { id: 'husky', label: 'האסקי סיבירי', typicalSize: 'large' },
  { id: 'akita', label: 'אקיטה', typicalSize: 'large' },
  { id: 'shiba-inu', label: 'שיבה אינו', typicalSize: 'medium' },
  { id: 'great-dane', label: 'דני ענק', typicalSize: 'giant' },
  { id: 'bernese', label: 'ברנזי', typicalSize: 'giant' },
];

export const BREED_BY_ID = new Map(BREEDS.map((breed) => [breed.id, breed]));

export const SIZE_LABELS: Record<DogSize, string> = {
  small: 'קטן (עד 10 ק״ג)',
  medium: 'בינוני (10–25 ק״ג)',
  large: 'גדול (25–45 ק״ג)',
  giant: 'ענק (45+ ק״ג)',
};

export const SIZE_SHORT_LABELS: Record<DogSize, string> = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול',
  giant: 'ענק',
};
