import { AppText, Card } from '@/components/ui';

import { formatIls, perInstallment } from '../utils/pricing';
import { LegalLink } from './LegalLink';

interface PriceDisclosureProps {
  planName: string;
  /** Total aggregate price in ILS, VAT included. */
  totalPrice: number;
  installments: number;
  /** e.g. "חודשי" / "שנתי"; omit for a one-time purchase. */
  recurringPeriod?: string;
  nextChargeDate?: string;
}

/**
 * Mandatory pre-purchase disclosure (Consumer Protection Law): installments, amount per installment,
 * total price, recurring terms and cancellation rights. Render above every checkout button.
 */
export function PriceDisclosure({ planName, totalPrice, installments, recurringPeriod, nextChargeDate }: PriceDisclosureProps) {
  return (
    <Card tone="info" accessibilityLabel="פרטי תשלום">
      <AppText variant="subheading">{`פרטי התשלום – ${planName}`}</AppText>
      <AppText>{`מחיר כולל (כולל מע״מ): ${formatIls(totalPrice)}`}</AppText>
      <AppText>{`מספר תשלומים: ${installments}`}</AppText>
      <AppText>{`סכום כל תשלום: ${formatIls(perInstallment(totalPrice, installments))}`}</AppText>
      {recurringPeriod ? (
        <AppText>{`חיוב מתחדש: ${recurringPeriod}, עד לביטול${nextChargeDate ? `. החיוב הבא: ${nextChargeDate}` : ''}`}</AppText>
      ) : (
        <AppText>חיוב חד-פעמי, ללא חידוש אוטומטי.</AppText>
      )}
      <AppText variant="caption">
        ניתן לבטל בתוך 14 יום מהרכישה, ומינוי מתחדש – בכל עת (הביטול נכנס לתוקף תוך 3 ימי עסקים).
      </AppText>
      <LegalLink doc="refunds" label="למדיניות הביטולים וההחזרים המלאה" />
    </Card>
  );
}
