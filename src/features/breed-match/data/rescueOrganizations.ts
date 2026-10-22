import type { IsraelRegion, RescueOrganization } from '../types';

// Established Israeli rescue organisations, by region. Adoption days and phone numbers change often,
// so only websites we confirmed are stored; for the rest the app suggests searching the name.

export const REGION_LABELS_HE: Readonly<Record<IsraelRegion, string>> = {
  CENTER: 'מרכז והשרון',
  NORTH: 'צפון',
  JERUSALEM: 'ירושלים',
  SOUTH: 'דרום',
};

export const RESCUE_ORGANIZATIONS: readonly RescueOrganization[] = [
  { id: 'sos-pets', nameHe: 'SOS חיות', region: 'CENTER', areaHe: 'ימי אימוץ ברמת אביב ובשרון', noteHe: 'עמותה ותיקה עם רשת בתי אומנה – אפשר לשמוע איך הכלב מתנהג בבית.', website: 'https://www.sospets.co.il' },
  { id: 'let-live', nameHe: 'תנו לחיות לחיות', region: 'CENTER', areaHe: 'מקלט במרכז הארץ', noteHe: 'מפעילה מקלט וגם בתי אומנה, ופעילה בהצלת כלבים מכלביות מוצפות.', website: 'https://www.letlive.org.il' },
  { id: 'spca-tel-aviv', nameHe: 'צער בעלי חיים בישראל – תל אביב', region: 'CENTER', areaHe: 'רחוב הרצל 159, תל אביב', noteHe: 'האגודה הוותיקה בארץ, עם תהליך אימוץ מסודר וליווי אחריו.', website: 'https://www.spca.co.il' },
  { id: 'spca-ramat-gan', nameHe: 'צער בעלי חיים רמת גן', region: 'CENTER', areaHe: 'רמת גן', noteHe: 'אגודה מקומית עם כלבים לאימוץ מהאזור.' },
  { id: 'herzliya-netanya', nameHe: 'הרצליה ונתניה אוהבות חיות', region: 'CENTER', areaHe: 'ימי אימוץ בכלביות העירוניות בהרצליה ובנתניה', noteHe: 'מתנדבים שמוציאים כלבים מהכלביות העירוניות לאימוץ ולאומנה.' },
  { id: 'gilboa-loves', nameHe: 'גלבוע אוהבת חיות', region: 'NORTH', areaHe: 'כפר תקווה, קריית טבעון', noteHe: 'ימי אימוץ בתיאום מראש.' },
  { id: 'bashan-shelter', nameHe: 'כלביית הבשן', region: 'NORTH', areaHe: 'הגליל העליון והגולן', noteHe: 'פועלת מאז 1993 ומקבלת כלבים מכל הגליל והגולן. סל האימוץ כולל עיקור או סירוס, שבב וחיסונים.', website: 'https://bashanshelter.blogspot.com' },
  { id: 'spca-haifa', nameHe: 'צער בעלי חיים חיפה', region: 'NORTH', areaHe: 'חיפה והקריות', noteHe: 'אגודה מקומית עם כלבים לאימוץ מהצפון.' },
  { id: 'spca-jerusalem', nameHe: 'צער בעלי חיים ירושלים', region: 'JERUSALEM', areaHe: 'ירושלים והסביבה', noteHe: 'אגודה מקומית; כדאי לשאול על כלבים שכבר נמצאים באומנה.' },
  { id: 'spca-beer-sheva', nameHe: 'צער בעלי חיים באר שבע', region: 'SOUTH', areaHe: 'באר שבע והנגב', noteHe: 'אגודה מקומית; בדרום יש הרבה מעורבים כנענים וכלבי ציד־ראייה שזקוקים לבית.' },
];

/** What the adoption basket buys, and why fostered dogs are the safer bet. */
export const ADOPTION_BASKET_HE: readonly string[] = [
  'סל אימוץ עולה בדרך כלל 700–1,000 ₪, וכולל חיסונים, שבב, תילוע ועיקור או סירוס – טיפולים ששווים יותר מזה בקליניקה פרטית.',
  'כלב מבית אומנה הוא כלב שמכירים: יודעים אם הוא נקי בבית, איך הוא נשאר לבד, ואיך הוא מגיב לילדים, לכלבים ולחתולים.',
  'בקשו מהעמותה בדיקת דם לליישמניה ולארליכיה – מחלות נפוצות בישראל שמשנות את תוכנית הטיפול.',
];
