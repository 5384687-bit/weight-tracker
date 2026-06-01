'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Scale, UtensilsCrossed, Dumbbell, Droplets, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  getActiveProfile, getWeightEntries, getFoodEntries, getExerciseEntries,
  getWaterEntries, getActiveProfileId,
} from '../lib/storage';
import { UserProfile, WeightEntry, FoodEntry, ExerciseEntry } from '../lib/types';
import { toHebrewDateFromDate } from '../lib/hebrew-date';
import Link from 'next/link';

const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function getWeekDates(baseDate: Date): Date[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    return date;
  });
}

export default function DailyPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [waterEntries, setWaterEntries] = useState<{ date: string; glasses: number }[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const p = getActiveProfile();
    setProfile(p);
    const pid = getActiveProfileId();
    if (pid) {
      setWeights(getWeightEntries(pid));
      setFoods(getFoodEntries(pid));
      setExercises(getExerciseEntries(pid));
      setWaterEntries(getWaterEntries(pid));
    }
  }, []);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);
  const today = new Date().toISOString().split('T')[0];

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <CalendarDays className="text-indigo-500" /> יומן יומי
        </h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל קודם כדי להתחיל</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">
            צור פרופיל
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <CalendarDays className="text-indigo-500" /> יומן שבועי
      </h1>

      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={24} />
        </button>
        <div className="text-center">
          <p className="font-bold text-lg">
            {weekDates[0].toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })} - {weekDates[6].toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-purple-500">{toHebrewDateFromDate(weekDates[0])} - {toHebrewDateFromDate(weekDates[6])}</p>
          {weekOffset === 0 && <p className="text-sm text-blue-600">השבוע הנוכחי</p>}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {weekDates.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const isFriday = date.getDay() === 5;
          const isToday = dateStr === today;
          const dayFoods = foods.filter(f => f.date === dateStr);
          const dayExercises = exercises.filter(e => e.date === dateStr);
          const dayWeight = weights.find(w => w.date === dateStr);
          const dayWater = waterEntries.find(w => w.date === dateStr);
          const totalCal = dayFoods.reduce((s, f) => s + (f.calories || 0), 0);
          const totalMin = dayExercises.reduce((s, e) => s + e.duration, 0);

          return (
            <div
              key={dateStr}
              className={`bg-white rounded-xl shadow-sm p-4 border transition-all ${
                isToday ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
              } ${isFriday ? 'border-amber-300 bg-amber-50/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`text-center min-w-[60px] p-2 rounded-lg ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                    <p className="text-xs">{hebrewDays[i]}</p>
                    <p className="text-lg font-bold">{date.getDate()}</p>
                    <p className={`text-[10px] ${isToday ? 'text-blue-100' : 'text-purple-400'}`}>{toHebrewDateFromDate(date)}</p>
                  </div>
                  <div>
                    {isToday && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">היום</span>}
                    {isFriday && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mr-1">
                        ⚖️ יום שקילה
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {isFriday && (
                  <div className={`rounded-lg p-3 ${dayWeight ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-dashed border-gray-300'}`}>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Scale size={12} /> משקל
                    </div>
                    {dayWeight ? (
                      <p className="font-bold text-amber-700">{dayWeight.weight} ק"ג</p>
                    ) : (
                      <p className="text-gray-400 text-sm">לא נשקל</p>
                    )}
                  </div>
                )}

                <div className={`rounded-lg p-3 ${dayFoods.length > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-dashed border-gray-300'}`}>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <UtensilsCrossed size={12} /> תזונה
                  </div>
                  {dayFoods.length > 0 ? (
                    <>
                      <p className="font-bold text-green-700">{dayFoods.length} ארוחות</p>
                      {totalCal > 0 && <p className="text-xs text-green-600">{totalCal} קל'</p>}
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">לא תועד</p>
                  )}
                </div>

                <div className={`rounded-lg p-3 ${dayExercises.length > 0 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-dashed border-gray-300'}`}>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Dumbbell size={12} /> כושר
                  </div>
                  {dayExercises.length > 0 ? (
                    <>
                      <p className="font-bold text-purple-700">{totalMin} דק'</p>
                      <p className="text-xs text-purple-600">{dayExercises.map(e => e.type).join(', ')}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">לא התאמן</p>
                  )}
                </div>

                <div className={`rounded-lg p-3 ${dayWater && dayWater.glasses > 0 ? 'bg-cyan-50 border border-cyan-200' : 'bg-gray-50 border border-dashed border-gray-300'}`}>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Droplets size={12} /> מים
                  </div>
                  {dayWater && dayWater.glasses > 0 ? (
                    <p className="font-bold text-cyan-700">{dayWater.glasses} כוסות</p>
                  ) : (
                    <p className="text-gray-400 text-sm">0 כוסות</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
