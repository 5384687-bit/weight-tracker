'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, Plus, Trash2, ChevronRight, ChevronLeft, Clock, Flame } from 'lucide-react';
import { getExerciseEntries, saveExerciseEntry, deleteExerciseEntry, generateId, getActiveProfileId } from '../lib/storage';
import { ExerciseEntry } from '../lib/types';
import { exerciseLibrary } from '../lib/exercises';
import { toHebrewDate } from '../lib/hebrew-date';
import Link from 'next/link';

export default function ExercisePage() {
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const pid = getActiveProfileId();
    setProfileId(pid);
    if (pid) setEntries(getExerciseEntries(pid));
  }, []);

  useEffect(() => {
    if (type && duration) {
      const template = exerciseLibrary.find(e => e.name === type);
      if (template) setCaloriesBurned(String(template.caloriesPerMinute * parseInt(duration)));
    }
  }, [type, duration]);

  const handleAdd = () => {
    if (!type || !duration || !profileId) return;
    const entry: ExerciseEntry = {
      id: generateId(), profileId, date: selectedDate, type,
      duration: parseInt(duration),
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
      notes: notes || undefined,
    };
    saveExerciseEntry(entry);
    setEntries(getExerciseEntries(profileId));
    setType(''); setDuration(''); setCaloriesBurned(''); setNotes('');
  };

  const handleDelete = (id: string) => {
    deleteExerciseEntry(id);
    if (profileId) setEntries(getExerciseEntries(profileId));
  };

  if (!profileId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-6"><Dumbbell className="text-purple-500" /> מעקב כושר</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל קודם</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">צור פרופיל</Link>
        </div>
      </div>
    );
  }

  const dayEntries = entries.filter(e => e.date === selectedDate);
  const totalMinutes = dayEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalBurned = dayEntries.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const quickExercises = ['הליכה', 'הליכה מהירה', 'ריצה קלה', 'ריצה', 'ריצה מהירה', 'ריצת אינטרוולים', 'רכיבה על אופניים', 'שחייה', 'סקוואט', 'יוגה', 'אימון HIIT ביתי', 'משקולות 5 ק"ג - זרועות', 'משקולות 5 ק"ג - חזה וגב', 'משקולות 5 ק"ג - רגליים וישבן', 'משקולות 5 ק"ג - גוף מלא'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Dumbbell className="text-purple-500" /> מעקב כושר
      </h1>

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="font-bold text-lg mb-4">הוסף אימון</h2>
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">בחירה מהירה:</p>
          <div className="flex flex-wrap gap-2">
            {quickExercises.map(ex => (
              <button key={ex} onClick={() => setType(ex)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${type === ex ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-600 mb-1">סוג אימון</label>
            <input type="text" value={type} onChange={e => setType(e.target.value)} placeholder="הליכה, ריצה, כוח..." className="border rounded-lg px-3 py-2 w-full text-gray-800" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">משך (דקות)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" className="border rounded-lg px-3 py-2 w-24 text-gray-800" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">קלוריות נשרפו</label>
            <input type="number" value={caloriesBurned} onChange={e => setCaloriesBurned(e.target.value)} placeholder="200" className="border rounded-lg px-3 py-2 w-28 text-gray-800" />
          </div>
          <button onClick={handleAdd} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
            <Plus size={18} /> הוסף
          </button>
        </div>
        <div className="mt-3">
          <label className="block text-sm text-gray-600 mb-1">הערות (אופציונלי)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="למשל: הרגשתי מצוין" className="border rounded-lg px-3 py-2 w-full text-gray-800" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
          <div className="text-center">
            <h2 className="font-bold text-lg">
              {isToday ? 'היום' : new Date(selectedDate).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <p className="text-xs text-purple-500">{toHebrewDate(selectedDate)}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              {totalMinutes > 0 && <span className="flex items-center gap-1"><Clock size={14} /> {totalMinutes} דקות</span>}
              {totalBurned > 0 && <span className="flex items-center gap-1"><Flame size={14} /> {totalBurned} קלוריות</span>}
            </div>
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
        </div>

        {dayEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין אימונים ליום הזה. בוא להתאמן!</p>
        ) : (
          <div className="space-y-2">
            {dayEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-800">{entry.type}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{entry.duration} דקות</span>
                    {entry.caloriesBurned && <span>{entry.caloriesBurned} קלוריות</span>}
                  </div>
                  {entry.notes && <p className="text-sm text-gray-400 mt-1">{entry.notes}</p>}
                </div>
                <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
