import { DailyTip } from './types';

const tips: DailyTip[] = [
  { text: 'שתה כוס מים לפני כל ארוחה - זה עוזר להרגיש שובע מהר יותר', category: 'nutrition' },
  { text: 'נסה להחליף פחמימות לבנות בפחמימות מלאות - לחם מלא, אורז מלא, פסטה מלאה', category: 'nutrition' },
  { text: 'אכול לאט ולעוס היטב - המוח צריך 20 דקות להבין ששבעת', category: 'nutrition' },
  { text: 'הכן אוכל מראש ליום למחרת - זה מונע בחירות לא טובות כשאתה רעב', category: 'nutrition' },
  { text: 'הוסף ירקות לכל ארוחה - הם נותנים נפח בלי הרבה קלוריות', category: 'nutrition' },
  { text: 'החלף משקאות ממותקים במים או תה ללא סוכר', category: 'nutrition' },
  { text: 'אל תדלג על ארוחת בוקר - זה שומר על חילוף החומרים פעיל', category: 'nutrition' },
  { text: 'נסה לאכול חלבון בכל ארוחה - זה עוזר לשמור על שריר ולהרגיש שובע', category: 'nutrition' },
  { text: 'הליכה של 30 דקות ביום שורפת כ-150 קלוריות ומשפרת מצב רוח', category: 'exercise' },
  { text: 'אימון כוח בונה שריר שממשיך לשרוף קלוריות גם במנוחה', category: 'exercise' },
  { text: 'קח את המדרגות במקום המעלית - כל צעד קטן נחשב', category: 'exercise' },
  { text: 'נסה להתאמן בבוקר - מחקרים מראים שזה מעלה את חילוף החומרים לכל היום', category: 'exercise' },
  { text: 'שלב בין אימוני קרדיו ואימוני כוח לתוצאות מיטביות', category: 'exercise' },
  { text: 'גם 10 דקות של פעילות זה טוב! אל תחכה ליום מושלם', category: 'exercise' },
  { text: 'מתיחות אחרי אימון מונעות פציעות ומשפרות גמישות', category: 'exercise' },
  { text: 'שינה טובה של 7-8 שעות קריטית לירידה במשקל', category: 'habit' },
  { text: 'תעד את מה שאתה אוכל - מודעות היא הצעד הראשון לשינוי', category: 'habit' },
  { text: 'הגדר לעצמך יעדים קטנים וריאליסטיים - חצי קילו בשבוע זה מצוין', category: 'habit' },
  { text: 'אל תשקול את עצמך כל יום - משקל משתנה טבעית. שקילה שבועית עדיפה', category: 'habit' },
  { text: 'מצא חבר לאימונים - זה מעלה מוטיבציה ועקביות', category: 'habit' },
  { text: 'הירידה במשקל היא מרתון, לא ספרינט. סבלנות היא המפתח', category: 'mindset' },
  { text: 'אם נפלת מהדיאטה ליום - זה בסדר! מחר יום חדש', category: 'mindset' },
  { text: 'חגוג כל הישג קטן - ירידה של חצי קילו היא ניצחון', category: 'mindset' },
  { text: 'אל תשווה את עצמך לאחרים - כל גוף שונה ומגיב אחרת', category: 'mindset' },
  { text: 'תחשוב על הרגשה ובריאות, לא רק על מספר על המשקל', category: 'mindset' },
  { text: 'סטרס גורם לעלייה במשקל - מצא דרכים להירגע: מדיטציה, יוגה, הליכה', category: 'mindset' },
  { text: 'תכנן מראש מה תאכל במסעדה כדי להימנע מפיתויים', category: 'nutrition' },
  { text: 'החלף צלחות גדולות בצלחות קטנות - הטריק הפסיכולוגי הזה באמת עובד', category: 'habit' },
];

export function getDailyTip(): DailyTip {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return tips[dayOfYear % tips.length];
}

export function getRandomTip(): DailyTip {
  return tips[Math.floor(Math.random() * tips.length)];
}
