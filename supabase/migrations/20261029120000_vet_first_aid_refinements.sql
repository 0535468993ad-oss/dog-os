-- First-aid refinements to three emergency articles (fix forward; 20261018120300 is applied and stays as is).
-- Content only: no schema change, no new rows. Each update replaces the article's whole `actions` array.
--
-- heatstroke:  cool first, transport second; towels only if re-wetted with airflow (a towel left on traps
--              heat); stop active cooling at 39.5 °C to avoid overshooting into hypothermia. The earlier
--              blanket "no ice" line is dropped rather than restated: delaying cooling is the real risk.
-- snake-bite:  remove the collar (fast swelling of the face and neck), no human painkillers, and do not
--              assume every clinic stocks antivenom – call ahead.
-- seizures:    nothing by mouth until the dog is awake and swallowing normally.
--
-- Informational first aid, shown with the medical disclaimer; it never replaces a vet. Review by a
-- veterinarian before release is still recommended for the whole knowledge base.

update public.veterinary_knowledge_base
set actions = $json$[
  {"title":"קודם לקרר, אחר כך לנסוע","body":"העבירו לצל ושפכו מים קרירים מהברז על כל הגוף – במיוחד הבטן, בית השחי והמפשעה – עם מאוורר או רוח. אל תעכבו את הקירור בחיפוש אחרי מים מסוימים: כל מים זמינים עדיפים על המתנה."},
  {"title":"מגבת רק אם מחליפים","body":"מגבת רטובה שנשארת על הכלב מתחממת ולוכדת חום. אם משתמשים במגבות – הרטיבו והחליפו שוב ושוב, עם זרימת אוויר."},
  {"title":"לא לקרר יותר מדי","body":"אם יש מדחום – הפסיקו קירור פעיל כשהחום יורד ל־39.5°C, כדי שלא יצנח מתחת לנורמה, והמשיכו לעקוב."},
  {"title":"המשיכו לקרר בדרך","body":"נסעו לווטרינר עם מזגן פועל ומים בהישג יד. גם כלב שנראה שהשתפר צריך בדיקה – נזק לאיברים יכול להופיע מאוחר יותר."},
  {"title":"מים לשתייה","body":"הציעו מעט מים אם הכלב בהכרה מלאה. אל תשפכו מים לפה."}
]$json$::jsonb
where id = 'heatstroke';

update public.veterinary_knowledge_base
set actions = $json$[
  {"title":"שמרו על רוגע והגבילו תנועה","body":"תנועה מגבירה את פיזור הארס. אם אפשר – שאו את הכלב."},
  {"title":"הסירו קולר ורתמה","body":"הנפיחות מתפשטת מהר, במיוחד בפנים ובצוואר – קולר הדוק עלול להקשות על הנשימה."},
  {"title":"נסעו מיד לווטרינר","body":"לא בכל מרפאה יש נסיוב נגד ארס – התקשרו בדרך כדי לוודא ולהודיע שאתם מגיעים."},
  {"title":"מה לא לעשות","body":"לא לחתוך, לא למצוץ, לא לקשור חוסם עורקים, לא לשים קרח ולא לתת משככי כאבים של בני אדם."}
]$json$::jsonb
where id = 'snake-bite';

update public.veterinary_knowledge_base
set actions = $json$[
  {"title":"הרחיקו סכנות","body":"פנו חפצים, הרחיקו ממדרגות ומים. אל תכניסו יד לפה – כלבים לא בולעים את הלשון."},
  {"title":"מדדו זמן","body":"רשמו מתי התחיל ומתי נגמר. אם אפשר – צלמו וידאו לווטרינר."},
  {"title":"שקט וחושך","body":"הנמיכו אורות ורעש, וחכו שהכלב יתאושש."},
  {"title":"שום דבר דרך הפה","body":"אל תתנו אוכל, מים או תרופות עד שהכלב ער, יציב ובולע כרגיל."},
  {"title":"מתי לנסוע מיד","body":"התקף שנמשך מעל 5 דקות, כמה התקפים ברצף, או כלב שלא חוזר להכרה בין התקפים – נסעו מיד לחירום."}
]$json$::jsonb
where id = 'seizures';
