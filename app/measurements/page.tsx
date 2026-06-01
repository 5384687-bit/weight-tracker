'use client';

import { useEffect, useState } from 'react';
import { Ruler, Plus, Trash2, TrendingDown, AlertCircle } from 'lucide-react';
import {
  getActiveProfileId, getActiveProfile, getMeasurementEntries,
  saveMeasurementEntry, deleteMeasurementEntry, generateId,
} from '../lib/storage';
import { MeasurementEntry } from '../lib/types';
import { toHebrewDate } from '../lib/hebrew-date';
import Link from 'next/link';

const fields: { key: keyof MeasurementEntry; label: string }[] = [
  { key: 'waist', label: 'מותניים' },
  { key: 'chest', label: 'חזה' },
  { key: 'hips', label: 'ירכיים' },
  { key: 'armRight', label: 'זרוע ימין' },
  { key: 'armLeft', label: 'זרוע שמאל' },
  { key: 'thighRight', label: 'ירך ימין' },
  { key: 'thighLeft', label: 'ירך שמאל' },
  { key: 'neck', label: 'צוואר' },
];

export default function MeasurementsPage() {
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const pid = getActiveProfileId();
    setProfileId(pid);
    if (pid) {
      const e = getMeasurementEntries(pid);
      setEntries(e);
      checkReminder(e);
    }
  }, []);

  const checkReminder = (entries: MeasurementEntry[]) => {
    if (entries.length === 0) { setShowReminder(true); return; }
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = new Date(sorted[0].date);
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    setShowReminder(daysSince >= 28);
  };

  const handleAdd = () => {
    if (!profileId) return;
    const entry: MeasurementEntry = {
      id: generateId(),
      profileId,
      date,
      waist: values.waist ? parseFloat(values.waist) : undefined,
      chest: values.chest ? parseFloat(values.chest) : undefined,
      hips: values.hips ? parseFloat(values.hips) : undefined,
      armRight: values.armRight ? parseFloat(values.armRight) : undefined,
      armLeft: values.armLeft ? parseFloat(values.armLeft) : undefined,
      thighRight: values.thighRight ? parseFloat(values.thighRight) : undefined,
      thighLeft: values.thighLeft ? parseFloat(values.thighLeft) : undefined,
      neck: values.neck ? parseFloat(values.neck) : undefined,
    };
    saveMeasurementEntry(entry);
    const updated = getMeasurementEntries(profileId);
    setEntries(updated);
    setValues({});
    checkReminder(updated);
  };

  const handleDelete = (id: string) => {
    deleteMeasurementEntry(id);
    if (profileId) setEntries(getMeasurementEntries(profileId));
  };

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const previous = sorted[1];

  if (!profileId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <Ruler className="text-pink-500" /> מדידת היקפים
        </h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל קודם</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">צור פרופיל</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Ruler className="text-pink-500" /> מדידת היקפים
      </h1>

      {showReminder && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-pink-500 flex-shrink-0" />
          <p className="text-pink-800">
            {entries.length === 0
              ? 'עדיין לא מדדת היקפים. מומלץ למדוד פעם בחודש!'
              : 'עבר חודש מאז המדידה האחרונה - הגיע הזמן למדוד שוב!'}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="font-bold text-lg mb-4">מדידה חדשה (ס"מ)</h2>
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">תאריך <span className="text-purple-500">({toHebrewDate(date)})</span></label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-lg px-3 py-2 text-gray-800" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
              <input
                type="number"
                step="0.5"
                value={values[f.key] || ''}
                onChange={e => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={'ס"מ'}
                className="border rounded-lg px-3 py-2 w-full text-gray-800"
              />
            </div>
          ))}
        </div>
        <button onClick={handleAdd} className="mt-4 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2">
          <Plus size={18} /> שמור מדידה
        </button>
      </div>

      {latest && previous && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingDown className="text-green-500" /> השוואה לאחרונה
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fields.map(f => {
              const curr = latest[f.key] as number | undefined;
              const prev = previous[f.key] as number | undefined;
              if (!curr) return null;
              const diff = prev ? curr - prev : 0;
              return (
                <div key={f.key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">{f.label}</p>
                  <p className="text-xl font-bold">{curr}</p>
                  {diff !== 0 && (
                    <p className={`text-sm ${diff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="font-bold text-lg mb-4">היסטוריית מדידות</h2>
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין מדידות עדיין</p>
        ) : (
          <div className="space-y-3">
            {sorted.map(entry => (
              <div key={entry.id} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{new Date(entry.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} <span className="text-xs text-purple-500 font-normal">({toHebrewDate(entry.date)})</span></p>
                  <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {fields.map(f => {
                    const val = entry[f.key] as number | undefined;
                    if (!val) return null;
                    return (
                      <span key={f.key} className="bg-white px-2 py-1 rounded border text-gray-700">
                        {f.label}: {val} ס"מ
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
