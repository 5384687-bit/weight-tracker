const gematria: Record<number, string> = {
  1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳',
  10: 'י׳', 11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו', 16: 'ט״ז',
  17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳', 21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג',
  24: 'כ״ד', 25: 'כ״ה', 26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳',
};

function formatHebrew(date: Date, includeYear: boolean): string {
  const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).formatToParts(date);
  const dayNum = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  const hebrewDay = gematria[dayNum] || String(dayNum);
  return includeYear ? `${hebrewDay} ${month} ${year}` : `${hebrewDay} ${month}`;
}

export function toHebrewDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    return formatHebrew(d, false);
  } catch {
    return '';
  }
}

export function toHebrewDateFull(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    return formatHebrew(d, true);
  } catch {
    return '';
  }
}

export function toHebrewDateFromDate(date: Date): string {
  try {
    return formatHebrew(date, false);
  } catch {
    return '';
  }
}
