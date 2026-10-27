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
  { id: 'cane-corso', label: 'קאנה קורסו', typicalSize: 'giant' },
  { id: 'weimaraner', label: 'ויימרנר', typicalSize: 'large' },
  { id: 'dalmatian', label: 'דלמטי', typicalSize: 'large' },
  { id: 'husky', label: 'האסקי סיבירי', typicalSize: 'large' },
  { id: 'akita', label: 'אקיטה', typicalSize: 'large' },
  { id: 'shiba-inu', label: 'שיבה אינו', typicalSize: 'medium' },
  { id: 'great-dane', label: 'דני ענק', typicalSize: 'giant' },
  { id: 'bernese', label: 'ברנזי', typicalSize: 'giant' },
  // Added with the 75-breed intelligence catalog (src/features/breeds): every profile is pickable here.
  { id: 'pit-bull', label: 'פיטבול', typicalSize: 'medium' },
  { id: 'bull-terrier', label: 'בול טרייר', typicalSize: 'medium' },
  { id: 'staffordshire-bull-terrier', label: 'סטפורדשייר בול טרייר', typicalSize: 'medium' },
  { id: 'dogo-argentino', label: 'דוגו ארגנטינו', typicalSize: 'large' },
  { id: 'giant-schnauzer', label: 'שנאוצר ענק', typicalSize: 'large' },
  { id: 'miniature-schnauzer', label: 'שנאוצר ננסי', typicalSize: 'small' },
  { id: 'caucasian-shepherd', label: 'רועה קווקזי', typicalSize: 'giant' },
  { id: 'kangal', label: 'קנגל (רועה אנטולי)', typicalSize: 'giant' },
  { id: 'st-bernard', label: 'סן ברנרד', typicalSize: 'giant' },
  { id: 'newfoundland', label: 'ניופאונדלנד', typicalSize: 'giant' },
  { id: 'leonberger', label: 'לאונברגר', typicalSize: 'giant' },
  { id: 'bullmastiff', label: 'בולמסטיף', typicalSize: 'giant' },
  { id: 'dogue-de-bordeaux', label: 'דוג דה בורדו', typicalSize: 'giant' },
  { id: 'shar-pei', label: 'שאר פיי', typicalSize: 'medium' },
  { id: 'dutch-shepherd', label: 'רועה הולנדי', typicalSize: 'large' },
  { id: 'australian-cattle-dog', label: 'כלב בקר אוסטרלי', typicalSize: 'medium' },
  { id: 'pembroke-welsh-corgi', label: 'וולש קורגי פמברוק', typicalSize: 'small' },
  { id: 'old-english-sheepdog', label: 'רועה אנגלי עתיק (בובטייל)', typicalSize: 'large' },
  { id: 'west-highland-white-terrier', label: 'וסט היילנד וייט טרייר', typicalSize: 'small' },
  { id: 'airedale-terrier', label: 'איירדייל טרייר', typicalSize: 'large' },
  { id: 'alaskan-malamute', label: 'אלסקן מלמוט', typicalSize: 'large' },
  { id: 'samoyed', label: 'סמויד', typicalSize: 'medium' },
  { id: 'basenji', label: 'בסנג׳י', typicalSize: 'small' },
  { id: 'chow-chow', label: 'צ׳או צ׳או', typicalSize: 'medium' },
  { id: 'basset-hound', label: 'באסט האונד', typicalSize: 'medium' },
  { id: 'rhodesian-ridgeback', label: 'רודזיאן רידג׳בק', typicalSize: 'large' },
  { id: 'greyhound', label: 'גרייהאונד', typicalSize: 'large' },
  { id: 'whippet', label: 'וויפט', typicalSize: 'medium' },
  { id: 'saluki', label: 'סלוקי', typicalSize: 'medium' },
  { id: 'german-shorthaired-pointer', label: 'פוינטר גרמני קצר שיער', typicalSize: 'large' },
  { id: 'vizsla', label: 'ויזסלה הונגרי', typicalSize: 'medium' },
  { id: 'irish-setter', label: 'סטר אירי', typicalSize: 'large' },
  { id: 'english-springer-spaniel', label: 'ספרינגר ספניאל אנגלי', typicalSize: 'medium' },
  { id: 'portuguese-water-dog', label: 'כלב מים פורטוגזי', typicalSize: 'medium' },
  { id: 'boston-terrier', label: 'בוסטון טרייר', typicalSize: 'small' },
  { id: 'havanese', label: 'הוואנזי', typicalSize: 'small' },
  { id: 'papillon', label: 'פפיון', typicalSize: 'small' },
  { id: 'lhasa-apso', label: 'להסה אפסו', typicalSize: 'small' },
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
