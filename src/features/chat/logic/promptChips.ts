/** Topic of a smart prompt; picks its color (health = emerald, toxicity = coral, general = indigo). */
export type PromptCategory = 'health' | 'toxicity' | 'general';

export interface PromptChip {
  id: string;
  category: PromptCategory;
  /** Sent to the advisor verbatim when the chip is tapped. */
  question: string;
}

/**
 * Smart prompt chips for the chat, personalized with the dog's name when there is one. Order mixes the
 * categories so the first chips on screen show all three colors.
 */
export function promptChips(dogName: string | null): PromptChip[] {
  const dog = dogName ?? 'הכלב';
  return [
    { id: 'grapes', category: 'toxicity', question: 'האם ענבים רעילים לכלבים?' },
    { id: 'paw-licking', category: 'health', question: `למה ${dog} מלקק את הכפות?` },
    { id: 'water', category: 'general', question: `כמה מים ${dog} צריך לשתות ביום?` },
    { id: 'chocolate', category: 'toxicity', question: 'מה לעשות אם כלב אכל שוקולד?' },
    { id: 'health-signs', category: 'health', question: dogName ? `על אילו בעיות בריאות לשים לב אצל ${dogName}?` : 'אילו סימנים מחייבים ביקור אצל וטרינר?' },
    { id: 'alone', category: 'general', question: dogName ? `איך לעזור ל${dogName} להירגע כשנשאר לבד?` : 'איך מתחילים לאמן גור?' },
  ];
}
