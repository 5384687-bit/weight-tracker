'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Flame, Clock, Zap, Play, Pause, RotateCcw, X, ChevronDown, ChevronUp, SkipForward, Eye, Dumbbell } from 'lucide-react';
import { exerciseLibrary, categoryLabels, difficultyLabels } from '../lib/exercises';
import type { ExerciseTemplate, ExerciseStep } from '../lib/exercises';
import { saveExerciseEntry, generateId, getActiveProfileId } from '../lib/storage';

function parseDurationToSeconds(step: ExerciseStep): number {
  const text = step.duration || step.reps || '';
  const minMatch = text.match(/(\d+)\s*דקות/);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const minMatch2 = text.match(/(\d+)\s*דקה/);
  if (minMatch2) return parseInt(minMatch2[1]) * 60;
  const secMatch = text.match(/(\d+)\s*שניות/);
  if (secMatch) return parseInt(secMatch[1]);
  const repMatch = text.match(/(\d+)\s*חזרות/);
  if (repMatch) return Math.max(30, parseInt(repMatch[1]) * 3);
  const comboMatch = text.match(/(\d+)\s*שניות\s*עבודה/);
  if (comboMatch) return 60;
  return 45;
}

const exerciseDemos: Record<string, { frames: string[]; description: string }> = {
  'הליכה': {
    frames: [
      '🚶‍♂️ ← הליכה בקצב רגיל',
      '🚶 ← יד ימין קדימה, רגל שמאל קדימה',
      '🚶‍♂️ ← יד שמאל קדימה, רגל ימין קדימה',
    ],
    description: 'גב ישר, כתפיים אחורה, מבט קדימה. נשימה חופשית דרך האף.',
  },
  'הליכה מהירה': {
    frames: [
      '🏃‍♂️💨 ← הליכה מהירה עם תנופת ידיים',
      '🚶‍♂️💪 ← ידיים כפופות ב-90 מעלות',
      '🏃‍♂️⚡ ← צעדים ארוכים ומהירים',
    ],
    description: 'ידיים כפופות ב-90 מעלות, תנופה חזקה. צעדים ארוכים, נחיתה על העקב.',
  },
  'ריצה קלה': {
    frames: [
      '🏃‍♂️ ← ריצה בקצב נוח',
      '🏃 ← קצב שאפשר לדבר בו',
      '🏃‍♂️💬 ← נשימה סדירה',
    ],
    description: 'קצב שמאפשר שיחה. נחיתה על אמצע כף הרגל. ידיים רפויות לצדדים.',
  },
  'ריצה': {
    frames: [
      '🏃‍♂️💨 ← ריצה בקצב 10-12 קמ"ש',
      '🏃⚡ ← נשימה מבוקרת',
      '🏃‍♂️🔥 ← גוף נוטה קלות קדימה',
    ],
    description: 'גוף נוטה 5-10 מעלות קדימה. ידיים כפופות ב-90 מעלות. נחיתה מתחת למרכז הכובד.',
  },
  'ריצה מהירה': {
    frames: [
      '🏃‍♂️💨💨 ← ריצה מעל 12 קמ"ש',
      '🏃⚡⚡ ← הרמת ברכיים גבוהה',
      '🏃‍♂️🔥🔥 ← מאמץ מקסימלי',
    ],
    description: 'הרמת ברכיים גבוהה, דחיפה חזקה מכף הרגל. גוף נוטה קדימה. נשימה מהירה ומבוקרת.',
  },
  'ריצת אינטרוולים': {
    frames: [
      '🏃‍♂️⚡ ← דקה מהירה!',
      '🚶‍♂️😮‍💨 ← 2 דקות התאוששות',
      '🏃‍♂️💥 ← שוב מהיר!',
    ],
    description: 'חילוף בין ריצה מהירה למנוחה פעילה. בזמן המנוחה - ריצה קלה או הליכה מהירה, לא עצירה מלאה.',
  },
  'סקוואט': {
    frames: [
      '🧍 ← עמידה זקופה, רגליים ברוחב כתפיים',
      '🏋️ ← ירידה: ישבן אחורה, ברכיים 90°',
      '🧍 ← עלייה: דחיפה מהעקבים',
    ],
    description: 'רגליים ברוחב כתפיים. יורדים כאילו יושבים על כיסא. ברכיים לא עוברות את קצות האצבעות. גב ישר!',
  },
  'שכיבות סמיכה': {
    frames: [
      '💪 ← ידיים ישרות, גוף כמו קרש',
      '⬇️ ← ירידה איטית, מרפקים לצדדים',
      '⬆️ ← דחיפה חזקה למעלה',
    ],
    description: 'ידיים ברוחב כתפיים. גוף ישר מהראש ועד הרגליים. יורדים עד שהחזה כמעט נוגע ברצפה.',
  },
  'פלאנק': {
    frames: [
      '🧘 ← על המרפקים וקצות הרגליים',
      '💪 ← בטן מכווצת, גוף ישר',
      '⏱️ ← החזק! אל תרים את הישבן',
    ],
    description: 'מרפקים מתחת לכתפיים. בטן מכווצת. קו ישר מהראש עד העקבים. נשימה רגילה.',
  },
  'ברפי': {
    frames: [
      '🧍 ← עמידה',
      '🏋️ ← ירידה לשכיבת סמיכה',
      '🦘 ← קפיצה למעלה עם ידיים!',
    ],
    description: 'עמידה → ידיים על הרצפה → רגליים אחורה → שכיבת סמיכה → רגליים קדימה → קפיצה עם ידיים למעלה.',
  },
  'יוגה': {
    frames: [
      '🧘 ← תנוחת הר - עמידה זקופה',
      '🧘‍♀️ ← כלב הפוך - V הפוך',
      '🙏 ← נשימות עמוקות',
    ],
    description: 'תנועות איטיות ומבוקרות. נשימות עמוקות. הקשבה לגוף - אל תכריח תנוחה שכואבת.',
  },
  'קפיצה בחבל': {
    frames: [
      '🤸 ← קפיצות קלות, פרקי כף היד מסובבים',
      '⬆️ ← קפיצה נמוכה, רק קצות הרגליים',
      '🔄 ← קצב קבוע, נשימה סדירה',
    ],
    description: 'קפיצה נמוכה על קצות הרגליים. סיבוב החבל מפרקי כף היד. מרפקים צמודים לגוף.',
  },
  'רכיבה על אופניים': {
    frames: [
      '🚴 ← ישיבה נכונה על האוכף',
      '🚴‍♂️💨 ← דיווש בקצב קבוע',
      '🚴⚡ ← התנגדות בינונית',
    ],
    description: 'גובה אוכף: רגל כמעט ישרה בנקודה התחתונה. גב ישר, ידיים על הכידון ללא מתח.',
  },
  'שחייה': {
    frames: [
      '🏊 ← חתירה ימנית, נשימה',
      '🏊‍♂️ ← חתירה שמאלית',
      '🏊 ← בעיטת רגליים סדירה',
    ],
    description: 'גוף אופקי במים. נשימה כל 3 חתירות. בעיטות רגליים קטנות ומהירות מהירכיים.',
  },
  "לאנג'ז": {
    frames: [
      '🧍 ← עמידה זקופה',
      '🦵 ← צעד גדול קדימה, ירידה ל-90°',
      '🧍 ← חזרה לעמידה, החלפת רגל',
    ],
    description: 'צעד גדול קדימה. שתי הברכיים ב-90 מעלות. ברך אחורית כמעט נוגעת ברצפה. גב ישר.',
  },
  'בטן': {
    frames: [
      '🛌 ← שכיבה על הגב, ברכיים כפופות',
      '💪 ← הרמת כתפיים מהרצפה',
      '🛌 ← ירידה איטית חזרה',
    ],
    description: 'ידיים מאחורי הראש (לא מושכים את הצוואר!). הרמת כתפיים בלבד. בטן מכווצת כל הזמן.',
  },
  'אימון HIIT ביתי': {
    frames: [
      '🔥 ← 40 שניות עבודה מקסימלית',
      '😮‍💨 ← 20 שניות מנוחה',
      '🔄 ← חזרה על הסבב!',
    ],
    description: 'מאמץ מקסימלי בזמן העבודה! מנוחה אקטיבית (לא יושבים). שומרים על טכניקה נכונה.',
  },
  'אימון טאבטה': {
    frames: [
      '⚡ ← 20 שניות מאמץ מקסימלי!',
      '😮‍💨 ← 10 שניות מנוחה',
      '🔁 ← 8 סבבים = 4 דקות',
    ],
    description: '20 שניות מאמץ מלא + 10 שניות מנוחה × 8 = 4 דקות. האימון הקצר והאינטנסיבי ביותר.',
  },
  'פילאטיס': {
    frames: [
      '🧘‍♀️ ← תנועות מבוקרות ואיטיות',
      '💪 ← מיקוד בשרירי הליבה',
      '🫁 ← נשימה עמוקה עם כל תנועה',
    ],
    description: 'תנועות מבוקרות ואיטיות. נשימה: שאיפה באף, נשיפה בפה. מיקוד בשרירי הבטן והגב.',
  },
  'מתיחות': {
    frames: [
      '🤸‍♀️ ← מתיחה עדינה ואיטית',
      '⏱️ ← החזקה 30 שניות לכל מתיחה',
      '😌 ← נשימות עמוקות, להרפות',
    ],
    description: 'מתיחה עד נקודת אי-נוחות קלה (לא כאב!). החזקה 30 שניות לפחות. נשימות עמוקות.',
  },
  'ריקוד': {
    frames: [
      '💃 ← תן למוזיקה להוביל!',
      '🕺 ← תנועות חופשיות',
      '🎵 ← שים שיר אהוב וזוז!',
    ],
    description: 'אין טכניקה "נכונה" - פשוט זוז! שים מוזיקה שמשמחת אותך. העיקר להזיע ולהנות.',
  },
  'עליית מדרגות': {
    frames: [
      '🪜 ← עלייה בקצב קבוע',
      '⬆️ ← דריכה מלאה על המדרגה',
      '⬇️ ← ירידה מבוקרת',
    ],
    description: 'דריכה מלאה על המדרגה (לא רק קצה). גב ישר. לא נשענים על המעקה. נשימה סדירה.',
  },
  'משקולות - פלג גוף עליון': {
    frames: [
      '💪 ← כפיפת מרפק עם משקולת',
      '🏋️ ← לחיצת כתפיים למעלה',
      '⬇️ ← הורדה איטית ומבוקרת',
    ],
    description: 'תנועות מבוקרות. הורדה איטית (2-3 שניות). אל תתנדנד - אם מתנדנד, המשקל כבד מדי.',
  },
  'משקולות - פלג גוף תחתון': {
    frames: [
      '🏋️ ← סקוואט עם משקולות',
      '🦵 ← מתים רומני - כפיפה מהמותן',
      '⬆️ ← עלייה פיצוצית!',
    ],
    description: 'גב ישר תמיד! ירידה מבוקרת, עלייה פיצוצית. ברכיים בכיוון האצבעות.',
  },
  'משקולות 5 ק"ג - זרועות': {
    frames: [
      '💪 ← בייספס קרל: כפיפת מרפק למעלה',
      '🏋️ ← לחיצת כתפיים: דחיפה מעל הראש',
      '⬇️ ← הורדה איטית ומבוקרת (2-3 שניות)',
    ],
    description: 'משקולת 5 ק"ג בכל יד. תנועות מבוקרות, הורדה איטית. אם מתנדנד - המשקל כבד מדי.',
  },
  'משקולות 5 ק"ג - חזה וגב': {
    frames: [
      '🛌 ← שכיבה: לחיצת חזה למעלה',
      '🤗 ← פרפר: ידיים פתוחות → חיבוק',
      '🏋️ ← כפיפה: חתירה לכיוון הבטן',
    ],
    description: 'לחיצת חזה בשכיבה, חתירה בכפיפה לגב. לחיצת שכמות בחתירה. גב ישר תמיד.',
  },
  'משקולות 5 ק"ג - רגליים וישבן': {
    frames: [
      '🏋️ ← סקוואט גוביילט: משקולת מול החזה',
      '🦵 ← לאנג׳ז: צעד קדימה + משקולות',
      '🍑 ← גלוט ברידג׳: הרמת אגן עם משקולת',
    ],
    description: 'סקוואט עמוק, לאנג׳ז מבוקרים, הרמת אגן. ברכיים בכיוון האצבעות. גב ישר!',
  },
  'משקולות 5 ק"ג - גוף מלא': {
    frames: [
      '🏋️ ← סקוואט + לחיצת כתפיים = סופר-סט',
      '💪 ← חתירה + לאנג׳ז + בייספס',
      '🔥 ← פלאנק עם חתירה - ליבה חזקה!',
    ],
    description: 'אימון משולב: כל תרגיל עובד על מספר שרירים. מנוחה 30-60 שניות בין סטים.',
  },
  'הליכה על הליכון': {
    frames: [
      '🚶‍♂️ ← הליכה בקצב קבוע',
      '📈 ← העלאת שיפוע לאתגר',
      '🏃‍♂️ ← הגברת מהירות בהדרגה',
    ],
    description: 'גב ישר, אל תיאחז במוטות. נשימה חופשית. העלה שיפוע לשריפת קלוריות נוספת.',
  },
  'אליפטיקל': {
    frames: [
      '🏃 ← דיווש קדימה - עבודה על ירכיים',
      '↩️ ← דיווש אחורה - עבודה על ישבן',
      '💪 ← ידיות נעות - עבודה על ידיים',
    ],
    description: 'אחיזה בידיות הנעות לאימון גוף מלא. שמור על יציבה זקופה. התנגדות גבוהה = יותר שריפה.',
  },
  'אגרוף / קיקבוקסינג': {
    frames: [
      '🥊 ← ג׳אב + קרוס - אגרופים ישרים',
      '🦵 ← בעיטה קדמית - דחיפה מהירך',
      '🔄 ← קומבינציות מהירות!',
    ],
    description: 'ידיים למעלה תמיד (שמירה). סיבוב מותן בכל אגרוף. בעיטות מהירך, לא מהברך.',
  },
  'סט בטן מתקדם': {
    frames: [
      '🧘 ← פלאנק + סיבובים צידיים',
      '🦵 ← הרמת רגליים ו-V-ups',
      '🔥 ← Mountain climbers מהירים!',
    ],
    description: 'בטן מכווצת כל הזמן. נשימה סדירה - לא לעצור. איכות > כמות.',
  },
  'אימון גומיות': {
    frames: [
      '🟡 ← גומיה על הברכיים - סקוואט',
      '💪 ← גומיה ביד - בייספס קרל',
      '🦵 ← הליכה צידית עם גומיה',
    ],
    description: 'שמור על מתח קבוע בגומיה. תנועות מבוקרות. בחר גומיה שמאתגרת אבל מאפשרת טכניקה נכונה.',
  },
  'TRX / רצועות': {
    frames: [
      '🧗 ← חתירה: גוף באלכסון, משיכה לחזה',
      '💪 ← לחיצת חזה: דחיפה מהרצועות',
      '🦵 ← סקוואט TRX: אחיזה + ירידה עמוקה',
    ],
    description: 'ככל שהגוף יותר אופקי - התרגיל קשה יותר. שמור על ליבה מכווצת. רצועות מתוחות תמיד.',
  },
  'הליכה נורדית': {
    frames: [
      '🚶‍♂️🥢 ← מקלות בידיים - תנופה מתואמת',
      '↗️ ← מקל ימני + רגל שמאלית',
      '💪 ← עבודה על 90% משרירי הגוף!',
    ],
    description: 'מקלות בגובה מותן. תנופה טבעית - יד וקרסול נגדיים. דחיפה חזקה לאחור עם המקל.',
  },
  'דיפס (שקיעות)': {
    frames: [
      '🪑 ← ידיים על קצה כיסא, גוף קדימה',
      '⬇️ ← ירידה איטית: מרפקים 90°',
      '⬆️ ← דחיפה חזקה למעלה!',
    ],
    description: 'מרפקים צמודים לגוף. ירידה מבוקרת 2-3 שניות. לא לרדת יותר מ-90° כדי לשמור על הכתפיים.',
  },
  'סופרמן (גב)': {
    frames: [
      '🛌 ← שכיבה על הבטן, ידיים מושטות',
      '🦸 ← הרמת ידיים + רגליים מהרצפה!',
      '⏱️ ← החזקה 3 שניות... ו-הורדה',
    ],
    description: 'מבט לרצפה (לא להרים ראש). לחיצת ישבן וגב בהרמה. תנועה מבוקרת ואיטית.',
  },
  'צמד כתפיים': {
    frames: [
      '💪 ← הרמה צידית: ידיים לצדדים',
      '⬆️ ← לחיצת כתפיים: דחיפה למעלה',
      '↩️ ← פרפר הפוך: כפיפה + הרמה',
    ],
    description: 'מרפקים מעט כפופים בהרמות. לא להרים מעל גובה כתפיים. תנועות מבוקרות.',
  },
  'אימון חזה ביתי': {
    frames: [
      '💪 ← שכיבת סמיכה רגילה',
      '🔷 ← ידיים בצורת יהלום - טרייספס',
      '⬆️ ← רגליים מוגבהות - חזה עליון',
    ],
    description: 'גוף ישר כמו קרש. מרפקים 45° מהגוף. ירידה עד שהחזה כמעט נוגע.',
  },
  'אימון גב ביתי': {
    frames: [
      '🦸 ← סופרמן: הרמת ידיים ורגליים',
      '🐕 ← Bird Dog: יד + רגל נגדיים',
      '🌉 ← גשר: הרמת אגן מהרצפה',
    ],
    description: 'גב ישר בכל תרגיל. תנועות איטיות ומבוקרות. נשימה רגילה - לא לעצור.',
  },
  'אימון זרועות ללא ציוד': {
    frames: [
      '🪑 ← דיפס על כיסא - טרייספס',
      '🔷 ← שכיבות צרות - טרייספס',
      '💪 ← כפיפה איזומטרית - בייספס',
    ],
    description: 'דיפס: מרפקים אחורה. שכיבות צרות: ידיים צמודות. בייספס: לחיצה סטטית מקסימלית.',
  },
  'קטלבל / כדור משקל': {
    frames: [
      '🔔 ← סווינג: נדנוד בין הרגליים',
      '⬆️ ← דחיפה מהירכיים עד גובה כתפיים',
      '🏋️ ← סקוואט גוביילט + לחיצה',
    ],
    description: 'סווינג = כוח מהירכיים, לא מהידיים! גב ישר, ברכיים כפופות. נשימה: שאיפה למטה, נשיפה למעלה.',
  },
  'מתח (Pull-ups)': {
    frames: [
      '🧗 ← תליה חופשית - אחיזה רחבה',
      '⬆️ ← משיכה: סנטר מעל המוט!',
      '⬇️ ← ירידה איטית ומבוקרת',
    ],
    description: 'שכמות למטה ולאחור. משיכה מהגב, לא מהידיים. ירידה איטית 2-3 שניות.',
  },
};

function AnimatedDemo({ demo, running }: { demo: { frames: string[]; description: string }; running: boolean }) {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setFrameIdx(f => (f + 1) % demo.frames.length);
    }, 1500);
    return () => clearInterval(iv);
  }, [running, demo.frames.length]);

  return (
    <div className="bg-gradient-to-l from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
      <p className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-1">
        <Eye size={14} /> הדגמה חיה:
      </p>
      <div className="relative min-h-[80px] flex items-center justify-center">
        {demo.frames.map((frame, i) => (
          <div key={i}
            className={`transition-all duration-500 absolute inset-0 flex items-center justify-center ${
              i === frameIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}>
            <p className="text-2xl text-center font-medium">{frame}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 my-2">
        {demo.frames.map((_, i) => (
          <button key={i} onClick={() => setFrameIdx(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === frameIdx ? 'bg-indigo-600 scale-125' : 'bg-indigo-200'
            }`} />
        ))}
      </div>
      <p className="text-xs text-indigo-700 bg-white/70 rounded-lg p-2 text-center">{demo.description}</p>
    </div>
  );
}

function WorkoutTimer({ exercise, onClose, onFinish }: { exercise: ExerciseTemplate; onClose: () => void; onFinish: (exercise: ExerciseTemplate) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const secs = parseDurationToSeconds(exercise.steps[0]);
    setRemaining(secs);
    setTotalSeconds(secs);
  }, [exercise]);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Bh4eGg3x1bnFydXmAgYKDgoB+e3l4eHl7fX+AgYGBgH58e3p5eXp7fH5/gIGBgIB+fHt6eXl6e3x+f4CBgYGAfnx7enl5ent8fn+AgYGBgH58e3p5eQ==').play(); } catch {}
            const nextStep = currentStep + 1;
            if (nextStep < exercise.steps.length) {
              setCurrentStep(nextStep);
              const nextSecs = parseDurationToSeconds(exercise.steps[nextStep]);
              setTotalSeconds(nextSecs);
              return nextSecs;
            } else {
              setRunning(false);
              setFinished(true);
              return 0;
            }
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, remaining, currentStep, exercise.steps]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  const step = exercise.steps[currentStep];
  const demo = exerciseDemos[exercise.name];

  const goToStep = (idx: number) => {
    setCurrentStep(idx);
    const secs = parseDurationToSeconds(exercise.steps[idx]);
    setTotalSeconds(secs);
    setRemaining(secs);
    setRunning(false);
    setFinished(false);
  };

  const resetAll = () => {
    setCurrentStep(0);
    const secs = parseDurationToSeconds(exercise.steps[0]);
    setTotalSeconds(secs);
    setRemaining(secs);
    setRunning(false);
    setFinished(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{exercise.name} - אימון מודרך</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        {finished ? (
          <div className="text-center py-8">
            <p className="text-6xl mb-4">🎉</p>
            <p className="text-2xl font-bold text-green-600 mb-2">כל הכבוד! סיימת!</p>
            <p className="text-gray-600 mb-1">שרפת בערך {Math.round(exercise.caloriesPerMinute * exercise.recommendedMinutes)} קלוריות</p>
            <p className="text-gray-500 text-sm mb-6">({exercise.recommendedMinutes} דקות × {exercise.caloriesPerMinute} קל&apos;/דקה)</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => onFinish(exercise)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                <Dumbbell size={18} /> שמור ועבור למעקב כושר
              </button>
              <button onClick={resetAll} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
                <RotateCcw size={18} /> התחל מחדש
              </button>
              <button onClick={onClose} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">סגור</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {exercise.steps.map((s, i) => (
                <button key={i} onClick={() => goToStep(i)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    i === currentStep ? 'bg-purple-600 text-white scale-110 shadow-md' :
                    i < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                  {i < currentStep ? '✓' : i + 1}
                </button>
              ))}
            </div>

            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-purple-800">שלב {currentStep + 1}: {step.name}</p>
                <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                  {step.duration || step.reps}
                </span>
              </div>
              <p className="text-sm text-purple-700">{step.description}</p>
            </div>

            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={remaining <= 5 && remaining > 0 ? '#ef4444' : '#8b5cf6'} strokeWidth="6"
                  strokeDasharray={`${pct * 2.83} ${283 - pct * 2.83}`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={`text-3xl font-bold ${remaining <= 5 && remaining > 0 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                  {formatTime(remaining)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
              <button onClick={resetAll}
                className="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-full"><RotateCcw size={18} /></button>
              <button onClick={() => setRunning(!running)}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3.5 rounded-full shadow-lg">
                {running ? <Pause size={24} /> : <Play size={24} />}
              </button>
              {currentStep < exercise.steps.length - 1 && (
                <button onClick={() => goToStep(currentStep + 1)}
                  className="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-full"><SkipForward size={18} /></button>
              )}
            </div>

            {demo && <AnimatedDemo demo={demo} running={running} />}
          </>
        )}
      </div>
    </div>
  );
}

function DemoPreview({ name }: { name: string }) {
  const demo = exerciseDemos[name];
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    if (!demo) return;
    const iv = setInterval(() => {
      setFrameIdx(f => (f + 1) % demo.frames.length);
    }, 2000);
    return () => clearInterval(iv);
  }, [demo]);

  if (!demo) return null;
  return (
    <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-lg p-4 mt-3 border border-blue-200">
      <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1">
        <Eye size={14} /> הדגמה:
      </p>
      <div className="relative min-h-[56px] flex items-center justify-center mb-2">
        {demo.frames.map((frame, i) => (
          <div key={i}
            className={`transition-all duration-500 absolute inset-0 flex items-center justify-center ${
              i === frameIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}>
            <p className="text-xl text-center font-medium">{frame}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mb-2">
        {demo.frames.map((_, i) => (
          <button key={i} onClick={() => setFrameIdx(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === frameIdx ? 'bg-blue-600 scale-125' : 'bg-blue-200'
            }`} />
        ))}
      </div>
      <p className="text-xs text-blue-700 text-center">{demo.description}</p>
    </div>
  );
}

export default function ExercisesLibraryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [workoutExercise, setWorkoutExercise] = useState<ExerciseTemplate | null>(null);

  const handleFinishWorkout = (exercise: ExerciseTemplate) => {
    const profileId = getActiveProfileId();
    if (profileId) {
      const entry = {
        id: generateId(),
        profileId,
        date: new Date().toISOString().split('T')[0],
        type: exercise.name,
        duration: exercise.recommendedMinutes,
        caloriesBurned: Math.round(exercise.caloriesPerMinute * exercise.recommendedMinutes),
      };
      saveExerciseEntry(entry);
    }
    router.push('/exercise');
  };

  const categories = ['all', ...Object.keys(categoryLabels)];
  const difficulties = ['all', ...Object.keys(difficultyLabels)];

  const filtered = exerciseLibrary.filter(e => {
    if (filter !== 'all' && e.category !== filter) return false;
    if (diffFilter !== 'all' && e.difficulty !== diffFilter) return false;
    return true;
  });

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  const categoryIcons: Record<string, string> = {
    cardio: '🏃', strength: '💪', flexibility: '🧘', home: '🏠',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {workoutExercise && <WorkoutTimer exercise={workoutExercise} onClose={() => setWorkoutExercise(null)} onFinish={handleFinishWorkout} />}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BookOpen className="text-indigo-500" /> ספריית תרגילים
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-2">קטגוריה:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {c === 'all' ? 'הכל' : `${categoryIcons[c]} ${categoryLabels[c]}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">רמת קושי:</p>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(d => (
                <button key={d} onClick={() => setDiffFilter(d)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${diffFilter === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {d === 'all' ? 'הכל' : difficultyLabels[d]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((exercise, i) => {
          const isExpanded = expanded === exercise.name;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : exercise.name)}
                className="w-full p-5 text-right">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-800">
                      {categoryIcons[exercise.category]} {exercise.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[exercise.difficulty]}`}>
                      {difficultyLabels[exercise.difficulty]}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
                <p className="text-gray-600 text-sm mb-3">{exercise.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Flame size={14} className="text-orange-500" />
                    {exercise.caloriesPerMinute} {"קל'/דקה"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-blue-500" />
                    {exercise.recommendedMinutes} {"דק' מומלץ"} = {Math.round(exercise.caloriesPerMinute * exercise.recommendedMinutes)} קלוריות
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-5 pb-5 pt-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-bold text-gray-700">תוכנית אימון:</h4>
                    <button onClick={() => setWorkoutExercise(exercise)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2 shadow-sm">
                      <Play size={16} /> התחל אימון מודרך
                    </button>
                  </div>

                  <DemoPreview name={exercise.name} />

                  <div className="space-y-3 mt-4">
                    {exercise.steps.map((step, j) => (
                      <div key={j} className="flex gap-3 items-start">
                        <div className="bg-indigo-100 text-indigo-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                          {j + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800">{step.name}</p>
                            {step.reps && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{step.reps}</span>}
                            {step.duration && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{step.duration}</span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-indigo-800 text-sm">
          <Zap className="inline ml-1" size={16} />
          <strong>טיפ:</strong> {"נתוני הקלוריות מבוססים על אדם במשקל 80 ק\"ג לפי נתוני Harvard Health ומחקרי MET. הצריכה בפועל משתנה לפי משקל, עצימות ומבנה גוף."}
        </p>
      </div>
    </div>
  );
}
