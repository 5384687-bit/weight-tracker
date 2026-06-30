'use client';

import { useEffect, useState } from 'react';
import { Scale, UtensilsCrossed, Dumbbell, Droplets, TrendingDown, Trophy, Flame, Target, Crown, Bell } from 'lucide-react';
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

  const tipCategoryColors: Record<string, string> = {
    nutrition: 'rgba(52, 211, 153, 0.08)',
    exercise: 'rgba(96, 165, 250, 0.08)',
    mindset: 'rgba(167, 139, 250, 0.08)',
    habit: 'rgba(251, 146, 60, 0.08)',
  };
  const tipCategoryBorders: Record<string, string> = {
    nutrition: 'rgba(52, 211, 153, 0.12)',
    exercise: 'rgba(96, 165, 250, 0.12)',
    mindset: 'rgba(167, 139, 250, 0.12)',
    habit: 'rgba(251, 146, 60, 0.12)',
  };
  const categoryNames: Record<string, string> = {
    nutrition: 'תזונה', exercise: 'כושר', mindset: 'מיינדסט', habit: 'הרגלים',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="enter">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          שלום{profile?.name ? <span className="text-gradient"> {profile.name}</span> : ''}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{toHebrewDate(today)}</p>
      </div>

      {!profile && (
        <div className="card-static p-6 text-center enter" style={{ animationDelay: '80ms' }}>
          <p className="text-lg mb-3" style={{ color: 'var(--accent-warm)' }}>צור פרופיל כדי להתחיל</p>
          <Link href="/profiles" className="inline-block btn-warm px-6 py-2.5 rounded-xl">צור פרופיל</Link>
        </div>
      )}

      {/* Daily tip */}
      <div className="card-static p-4 enter" style={{ animationDelay: '100ms', background: tipCategoryColors[tip.category], borderColor: tipCategoryBorders[tip.category] }}>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-warm)' }}>טיפ יומי · {categoryNames[tip.category]}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{tip.text}</p>
      </div>

      {/* Reminders */}
      {profile && (() => {
        const reminders: { text: string; icon: string; href: string }[] = [];
        const isFriday = new Date().getDay() === 5;
        const todayWeight = weights.find(w => w.date === today);
        if (isFriday && !todayWeight) reminders.push({ text: 'היום יום שישי - הגיע הזמן להישקל', icon: '⚖️', href: '/weight' });
        if (todayFoods.length === 0) reminders.push({ text: 'עדיין לא תיעדת ארוחות היום', icon: '🍽️', href: '/food' });
        if (todayWater < 4) reminders.push({ text: `שתית רק ${todayWater} כוסות מים`, icon: '💧', href: '/water' });
        if (todayExercises.length === 0) reminders.push({ text: 'עוד לא התאמנת היום', icon: '💪', href: '/exercise' });
        if (reminders.length === 0) return null;
        return (
          <div className="space-y-1.5 enter" style={{ animationDelay: '140ms' }}>
            <div className="flex items-center gap-1.5 px-1" style={{ color: 'var(--text-tertiary)' }}>
              <Bell size={13} />
              <span className="text-xs">תזכורות</span>
            </div>
            {reminders.map((r, i) => (
              <Link key={i} href={r.href} className="card card-interactive block p-3">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.icon} {r.text}</span>
              </Link>
            ))}
          </div>
        );
      })()}

      {/* Calorie budget */}
      {profile && profile.birthDate && profile.activityLevel && (() => {
        const age = calculateAge(profile.birthDate);
        const currentWeight = latestWeight?.weight || profile.startWeight;
        const tdee = calculateTDEE(currentWeight, profile.height, age, profile.gender, profile.activityLevel);
        const target = getCalorieTarget(tdee);
        const pct = target > 0 ? Math.min(100, (todayCaloriesIn / target) * 100) : 0;
        const net = todayCaloriesIn - todayCaloriesBurned;
        const overBudget = net > target;
        return (
          <div className="card-static p-5 enter" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame size={18} style={{ color: '#fb923c' }} />
                <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>תקציב קלוריות</h3>
              </div>
              <div>
                <span className={`text-xl font-semibold ${overBudget ? 'text-red-400' : 'text-emerald-400'}`}>{todayCaloriesIn}</span>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}> / {target}</span>
              </div>
            </div>
            <div className="progress-bar h-2">
              <div className={`progress-fill h-2 ${overBudget ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              <span>TDEE: {tdee} · יעד: {target}</span>
              <span>{todayCaloriesBurned > 0 && `שרפת ${todayCaloriesBurned} · `}נשאר: {Math.max(0, target - net)}</span>
            </div>
          </div>
        );
      })()}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Scale size={18} />, iconColor: '#60a5fa', title: 'משקל', value: latestWeight ? `${latestWeight.weight}` : '--', unit: 'ק"ג', sub: weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '', subColor: weightChange <= 0 ? '#34d399' : '#f87171', href: '/weight', delay: 200 },
          { icon: <Flame size={18} />, iconColor: '#fb923c', title: 'קלוריות', value: `${todayCaloriesIn}`, unit: '', sub: todayCaloriesBurned > 0 ? `${todayCaloriesBurned} נשרפו` : '', subColor: '', href: '/food', delay: 240 },
          { icon: <Dumbbell size={18} />, iconColor: '#a78bfa', title: 'אימון', value: `${todayExerciseMinutes}`, unit: "דק'", sub: todayExercises.length > 0 ? `${todayExercises.length} אימונים` : '', subColor: '', href: '/exercise', delay: 280 },
          { icon: <Droplets size={18} />, iconColor: '#22d3ee', title: 'מים', value: `${todayWater}`, unit: 'כוסות', sub: todayWater >= 8 ? 'הגעת ליעד' : `חסרות ${8 - todayWater}`, subColor: todayWater >= 8 ? '#34d399' : '#fb923c', href: '/water', delay: 320 },
        ].map((s, i) => (
          <Link key={i} href={s.href} className="card card-interactive p-4 enter" style={{ animationDelay: `${s.delay}ms` }}>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ color: s.iconColor }}>{s.icon}</div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.title}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
              {s.unit && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.unit}</span>}
            </div>
            {s.sub && <p className="text-xs mt-1" style={{ color: s.subColor || 'var(--text-tertiary)' }}>{s.sub}</p>}
          </Link>
        ))}
      </div>

      {/* Three column section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Progress */}
        {profile && latestWeight && (
          <div className="card-static p-5 enter" style={{ animationDelay: '360ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} style={{ color: '#60a5fa' }} />
              <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>התקדמות ליעד</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{profile.targetWeight} ק&quot;ג</span>
                  <span>{profile.startWeight} ק&quot;ג</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill h-2"
                    style={{ width: `${Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.targetWeight)) * 100))}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-warm))' }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  ירדת {totalLost.toFixed(1)} · נשאר {remainingToGoal.toFixed(1)}
                </p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>BMI</p>
                <p className="text-2xl font-semibold text-gradient">{bmi.toFixed(1)}</p>
                <p className="text-xs" style={{ color: 'var(--accent-warm)' }}>{bmiInfo.label}</p>
              </div>
              {daysToTarget > 0 && (
                <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>{daysToTarget} ימים עד היעד</p>
              )}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="card-static p-5 enter" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} style={{ color: 'var(--accent-warm)' }} />
            <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>הישגים</h3>
          </div>
          <div className="space-y-3">
            {[
              { emoji: '🔥', value: `${streakDays} ימים ברצף`, label: 'רצף תיעוד', color: 'var(--accent-warm)' },
              { emoji: '📉', value: `${totalLost > 0 ? totalLost.toFixed(1) : '0'} ק"ג`, label: 'סה"כ ירדת', color: '#34d399' },
              { emoji: '💪', value: `${exercises.length} אימונים`, label: 'סה"כ', color: 'var(--accent)' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <span className="text-lg">{a.emoji}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: a.color }}>{a.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weigh-in countdown */}
        <div className="card-static p-5 enter" style={{ animationDelay: '440ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} style={{ color: '#34d399' }} />
            <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>יום שקילה</h3>
          </div>
          <div className="text-center pt-2">
            {(() => {
              const now = new Date();
              const daysUntilFriday = (5 - now.getDay() + 7) % 7;
              if (daysUntilFriday === 0) {
                const todayWeight = weights.find(w => w.date === today);
                return todayWeight ? (
                  <>
                    <p className="text-3xl mb-1">✅</p>
                    <p className="font-medium text-emerald-400">נשקלת היום</p>
                    <p className="text-xl font-semibold text-gradient mt-1">{todayWeight.weight} ק&quot;ג</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl mb-1">⚖️</p>
                    <p className="font-medium" style={{ color: 'var(--accent-warm)' }}>היום יום שישי</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>הגיע הזמן להישקל</p>
                  </>
                );
              }
              return (
                <>
                  <p className="text-4xl font-semibold mb-1" style={{ color: 'var(--accent)' }}>{daysUntilFriday}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>ימים עד השקילה</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>יום שישי</p>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 1 && (
        <div className="card-static p-5 enter" style={{ animationDelay: '480ms' }}>
          <Link href="/competition" className="flex items-center gap-2 mb-4 group">
            <Crown size={16} style={{ color: 'var(--accent-warm)' }} />
            <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>טבלת מובילים</h3>
            <span className="text-xs mr-auto group-hover:text-purple-400 transition-colors" style={{ color: 'var(--text-tertiary)' }}>הצג הכל →</span>
          </Link>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={i} className="flex items-center gap-3 p-1.5 rounded-lg">
                  <span className="text-sm w-6 text-center">{medals[i] || `${i + 1}`}</span>
                  {entry.avatar.startsWith('data:') ? (
                    <img src={entry.avatar} alt="" className="w-7 h-7 rounded-full object-cover" style={{ border: '1.5px solid var(--border-subtle)' }} />
                  ) : (
                    <span className="text-base w-7 text-center">{entry.avatar}</span>
                  )}
                  <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
                  <div className="w-20 progress-bar h-1.5">
                    <div className="progress-fill h-1.5" style={{ width: `${entry.pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-warm))' }} />
                  </div>
                  <span className="text-xs font-medium w-10 text-left text-gradient">{entry.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'יומן יומי', desc: 'צפה בשבוע שלך', href: '/daily', icon: <Scale size={20} />, colors: 'from-indigo-600/80 to-purple-700/80', delay: 520 },
          { title: 'הוסף ארוחה', desc: 'תעד מה אכלת', href: '/food', icon: <UtensilsCrossed size={20} />, colors: 'from-emerald-600/80 to-teal-700/80', delay: 560 },
          { title: 'הוסף אימון', desc: 'תעד את האימון', href: '/exercise', icon: <Dumbbell size={20} />, colors: 'from-purple-600/80 to-pink-700/80', delay: 600 },
          { title: 'תחרות', desc: 'מי מוביל?', href: '/competition', icon: <Trophy size={20} />, colors: 'from-amber-600/80 to-yellow-700/80', delay: 640 },
        ].map((a, i) => (
          <Link key={i} href={a.href} className="card card-interactive flex items-center gap-3 p-4 enter" style={{ animationDelay: `${a.delay}ms` }}>
            <div className={`bg-gradient-to-br ${a.colors} text-white p-2.5 rounded-xl`}>{a.icon}</div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
