'use client';

import { useEffect, useState } from 'react';
import { Scale, UtensilsCrossed, Dumbbell, Droplets, TrendingDown, Trophy, Flame, Target, Crown, Bell, AlertTriangle } from 'lucide-react';
import { getWeightEntries, getFoodEntries, getExerciseEntries, getWaterEntries, getActiveProfile, getActiveProfileId, getProfiles } from './lib/storage';
import { WeightEntry, FoodEntry, ExerciseEntry, UserProfile } from './lib/types';
import { getDailyTip } from './lib/tips';
import { calculateBMI, getBMICategory } from './lib/bmi';
import { calculateAge, calculateTDEE, getCalorieTarget } from './lib/tdee';
import { toHebrewDate } from './lib/hebrew-date';
import Link from 'next/link';

export default function Dashboard() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayWater, setTodayWater] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ name: string; avatar: string; pct: number }[]>([]);
  const tip = getDailyTip();

  useEffect(() => {
    const p = getActiveProfile();
    setProfile(p);
    const pid = getActiveProfileId();
    if (pid) {
      setWeights(getWeightEntries(pid));
      setFoods(getFoodEntries(pid));
      setExercises(getExerciseEntries(pid));
      const today = new Date().toISOString().split('T')[0];
      const waterEntries = getWaterEntries(pid);
      const todayEntry = waterEntries.find(e => e.date === today);
      setTodayWater(todayEntry?.glasses || 0);
    }
    const allProfiles = getProfiles();
    const board = allProfiles
      .map(pr => {
        const w = getWeightEntries(pr.id).sort((a, b) => b.date.localeCompare(a.date));
        const latest = w[0]?.weight ?? pr.startWeight;
        const totalToLose = pr.startWeight - pr.targetWeight;
        const lost = pr.startWeight - latest;
        const pct = totalToLose > 0 ? Math.min(100, Math.max(0, (lost / totalToLose) * 100)) : 0;
        return { name: pr.name, avatar: pr.avatar, pct: Math.round(pct) };
      })
      .sort((a, b) => b.pct - a.pct);
    setLeaderboard(board);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayFoods = foods.filter(f => f.date === today);
  const todayExercises = exercises.filter(e => e.date === today);
  const todayCaloriesIn = todayFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
  const todayCaloriesBurned = todayExercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
  const todayExerciseMinutes = todayExercises.reduce((sum, e) => sum + e.duration, 0);

  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = sortedWeights[sortedWeights.length - 1];
  const previousWeight = sortedWeights[sortedWeights.length - 2];
  const weightChange = latestWeight && previousWeight ? latestWeight.weight - previousWeight.weight : 0;
  const totalLost = profile && latestWeight ? profile.startWeight - latestWeight.weight : 0;
  const remainingToGoal = profile && latestWeight ? latestWeight.weight - profile.targetWeight : 0;

  const streakDays = calculateStreak(foods, exercises);

  function calculateStreak(foods: FoodEntry[], exercises: ExerciseEntry[]): number {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().split('T')[0];
      if (foods.some(f => f.date === dateStr) || exercises.some(e => e.date === dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }

  const bmi = profile && latestWeight ? calculateBMI(latestWeight.weight, profile.height) : 0;
  const bmiInfo = profile ? getBMICategory(bmi, profile.gender) : { label: '', color: '' };

  const daysToTarget = profile ? Math.ceil((new Date(profile.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const categoryColors: Record<string, string> = {
    nutrition: 'bg-green-100 text-green-700 border-green-200',
    exercise: 'bg-blue-100 text-blue-700 border-blue-200',
    mindset: 'bg-purple-100 text-purple-700 border-purple-200',
    habit: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  const categoryNames: Record<string, string> = {
    nutrition: 'תזונה', exercise: 'כושר', mindset: 'מיינדסט', habit: 'הרגלים',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          שלום{profile?.name ? ` ${profile.name}` : ''}! 👋
        </h1>
        <p className="text-sm text-purple-500 mt-1">{toHebrewDate(new Date().toISOString().split('T')[0])}</p>
      </div>

      {!profile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל כדי להתחיל!</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
            צור פרופיל
          </Link>
        </div>
      )}

      <div className={`border rounded-xl p-4 ${categoryColors[tip.category]}`}>
        <p className="font-semibold text-sm mb-1">💡 טיפ יומי - {categoryNames[tip.category]}</p>
        <p>{tip.text}</p>
      </div>

      {profile && (() => {
        const reminders: { text: string; icon: string; color: string; href: string }[] = [];
        const isFriday = new Date().getDay() === 5;
        const todayWeight = weights.find(w => w.date === today);
        if (isFriday && !todayWeight) reminders.push({ text: 'היום יום שישי - הגיע הזמן להישקל! ⚖️', icon: '⚖️', color: 'bg-amber-50 border-amber-300 text-amber-800', href: '/weight' });
        if (todayFoods.length === 0) reminders.push({ text: 'עדיין לא תיעדת ארוחות היום', icon: '🍽️', color: 'bg-orange-50 border-orange-300 text-orange-800', href: '/food' });
        if (todayWater < 4) reminders.push({ text: `שתית רק ${todayWater} כוסות מים - נסה להגיע ל-8!`, icon: '💧', color: 'bg-cyan-50 border-cyan-300 text-cyan-800', href: '/water' });
        if (todayExercises.length === 0) reminders.push({ text: 'עוד לא התאמנת היום - בוא נזיז את הגוף!', icon: '💪', color: 'bg-purple-50 border-purple-300 text-purple-800', href: '/exercise' });
        if (reminders.length === 0) return null;
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Bell size={16} /> <span className="text-sm font-medium">תזכורות להיום</span>
            </div>
            {reminders.map((r, i) => (
              <Link key={i} href={r.href} className={`block border rounded-lg p-3 ${r.color} hover:opacity-80 transition-opacity`}>
                <span className="text-sm">{r.text}</span>
              </Link>
            ))}
          </div>
        );
      })()}

      {profile && profile.birthDate && profile.activityLevel && (() => {
        const age = calculateAge(profile.birthDate);
        const currentWeight = latestWeight?.weight || profile.startWeight;
        const tdee = calculateTDEE(currentWeight, profile.height, age, profile.gender, profile.activityLevel);
        const target = getCalorieTarget(tdee);
        const pct = target > 0 ? Math.min(100, (todayCaloriesIn / target) * 100) : 0;
        const net = todayCaloriesIn - todayCaloriesBurned;
        const overBudget = net > target;
        return (
          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="text-orange-500" />
                <h3 className="font-bold">תקציב קלוריות יומי</h3>
              </div>
              <div className="text-left">
                <span className={`text-2xl font-bold ${overBudget ? 'text-red-500' : 'text-green-600'}`}>{todayCaloriesIn}</span>
                <span className="text-gray-400 text-sm"> / {target}</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className={`h-4 rounded-full transition-all ${overBudget ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>TDEE: {tdee} | יעד לירידה: {target}</span>
              <span>{todayCaloriesBurned > 0 && `שרפת ${todayCaloriesBurned} | `}נשאר: {Math.max(0, target - net)}</span>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Scale className="text-blue-500" />}
          title="משקל נוכחי"
          value={latestWeight ? `${latestWeight.weight} ק"ג` : '--'}
          subtitle={weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} מהשקילה הקודמת` : ''}
          subtitleColor={weightChange <= 0 ? 'text-green-600' : 'text-red-500'}
          href="/weight"
        />
        <StatCard
          icon={<Flame className="text-orange-500" />}
          title="קלוריות היום"
          value={`${todayCaloriesIn}`}
          subtitle={todayCaloriesBurned > 0 ? `${todayCaloriesBurned} נשרפו` : 'עדיין לא אכלת היום'}
          href="/food"
        />
        <StatCard
          icon={<Dumbbell className="text-purple-500" />}
          title="אימון היום"
          value={`${todayExerciseMinutes} דק'`}
          subtitle={todayExercises.length > 0 ? `${todayExercises.length} אימונים` : 'בוא להתאמן!'}
          href="/exercise"
        />
        <StatCard
          icon={<Droplets className="text-cyan-500" />}
          title="מים היום"
          value={`${todayWater} כוסות`}
          subtitle={todayWater >= 8 ? 'מצוין! הגעת ליעד!' : `חסרות ${8 - todayWater} כוסות`}
          subtitleColor={todayWater >= 8 ? 'text-green-600' : 'text-orange-500'}
          href="/water"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profile && latestWeight && (
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-blue-500" />
              <h3 className="font-bold text-lg">התקדמות ליעד</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>יעד: {profile.targetWeight} ק"ג</span>
                  <span>התחלה: {profile.startWeight} ק"ג</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-gradient-to-l from-blue-500 to-green-500 h-4 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.targetWeight)) * 100))}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  ירדת {totalLost.toFixed(1)} ק"ג | נשאר {remainingToGoal.toFixed(1)} ק"ג
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">BMI</p>
                <p className={`text-2xl font-bold ${bmiInfo.color}`}>{bmi.toFixed(1)}</p>
                <p className={`text-sm ${bmiInfo.color}`}>{bmiInfo.label}</p>
              </div>
              {daysToTarget > 0 && (
                <p className="text-center text-sm text-gray-500">
                  {daysToTarget} ימים עד תאריך היעד
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-500" />
            <h3 className="font-bold text-lg">הישגים</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="font-semibold">{streakDays} ימים ברצף</p>
                <p className="text-sm text-gray-500">רצף תיעוד</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📉</span>
              <div>
                <p className="font-semibold">{totalLost > 0 ? totalLost.toFixed(1) : '0'} ק"ג</p>
                <p className="text-sm text-gray-500">סה"כ ירדת</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">💪</span>
              <div>
                <p className="font-semibold">{exercises.length} אימונים</p>
                <p className="text-sm text-gray-500">סה"כ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-green-500" />
            <h3 className="font-bold text-lg">יום שקילה</h3>
          </div>
          <div className="text-center">
            {(() => {
              const now = new Date();
              const daysUntilFriday = (5 - now.getDay() + 7) % 7;
              if (daysUntilFriday === 0) {
                const todayWeight = weights.find(w => w.date === today);
                return todayWeight ? (
                  <>
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-xl font-bold text-green-600">נשקלת היום!</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{todayWeight.weight} ק"ג</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl mb-2">⚖️</p>
                    <p className="text-xl font-bold text-amber-600">היום יום שישי!</p>
                    <p className="text-sm text-gray-500">הגיע הזמן להישקל</p>
                  </>
                );
              }
              return (
                <>
                  <p className="text-5xl font-bold text-blue-600 mb-2">{daysUntilFriday}</p>
                  <p className="text-gray-600">ימים עד השקילה הבאה</p>
                  <p className="text-sm text-gray-400">(יום שישי)</p>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {leaderboard.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <Link href="/competition" className="flex items-center gap-2 mb-4 hover:opacity-80">
            <Crown className="text-yellow-500" />
            <h3 className="font-bold text-lg">טבלת מובילים</h3>
            <span className="text-sm text-gray-400 mr-auto">→ לטבלה המלאה</span>
          </Link>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{medals[i] || `${i + 1}.`}</span>
                  {entry.avatar.startsWith('data:') ? (
                    <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-xl w-8 text-center">{entry.avatar}</span>
                  )}
                  <span className="font-medium flex-1">{entry.name}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-gradient-to-l from-yellow-400 to-green-500 h-2.5 rounded-full" style={{ width: `${entry.pct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-600 w-12 text-left">{entry.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickAction title="יומן יומי" description="צפה בשבוע שלך" href="/daily" icon={<Scale />} color="bg-indigo-500" />
        <QuickAction title="הוסף ארוחה" description="תעד מה אכלת היום" href="/food" icon={<UtensilsCrossed />} color="bg-green-500" />
        <QuickAction title="הוסף אימון" description="תעד את האימון שלך" href="/exercise" icon={<Dumbbell />} color="bg-purple-500" />
        <QuickAction title="טבלת תחרות" description="מי מוביל?" href="/competition" icon={<Trophy />} color="bg-yellow-500" />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, subtitleColor, href }: {
  icon: React.ReactNode; title: string; value: string; subtitle: string; subtitleColor?: string; href: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl shadow-sm p-5 border hover:shadow-md transition-shadow block">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-gray-500">{title}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {subtitle && <p className={`text-sm mt-1 ${subtitleColor || 'text-gray-500'}`}>{subtitle}</p>}
    </Link>
  );
}

function QuickAction({ title, description, href, icon, color }: {
  title: string; description: string; href: string; icon: React.ReactNode; color: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-5 border hover:shadow-md transition-shadow">
      <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}
