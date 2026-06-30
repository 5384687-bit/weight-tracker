'use client';

import { useEffect, useState } from 'react';
import { Scale, UtensilsCrossed, Dumbbell, Droplets, TrendingDown, Trophy, Flame, Target, Crown, Bell, Sparkles } from 'lucide-react';
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

  const categoryStyles: Record<string, string> = {
    nutrition: 'border-emerald-500/20 bg-emerald-500/5',
    exercise: 'border-blue-500/20 bg-blue-500/5',
    mindset: 'border-purple-500/20 bg-purple-500/5',
    habit: 'border-amber-500/20 bg-amber-500/5',
  };
  const categoryNames: Record<string, string> = {
    nutrition: 'תזונה', exercise: 'כושר', mindset: 'מיינדסט', habit: 'הרגלים',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold">
          <span style={{ color: 'rgba(255,255,255,0.9)' }}>שלום</span>
          {profile?.name && <span className="gold-text"> {profile.name}</span>}
          <span style={{ color: 'rgba(255,255,255,0.9)' }}> </span>
          <Sparkles className="inline text-yellow-400 mb-1" size={24} />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(139, 92, 246, 0.7)' }}>{toHebrewDate(today)}</p>
      </div>

      {!profile && (
        <div className="glass-card p-6 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
          <p className="text-lg mb-3" style={{ color: '#d4a843' }}>צור פרופיל כדי להתחיל!</p>
          <Link href="/profiles" className="inline-block btn-gold px-6 py-2.5 rounded-xl">
            צור פרופיל
          </Link>
        </div>
      )}

      <div className={`glass-card-static p-4 border animate-slide-up ${categoryStyles[tip.category]}`} style={{ animationDelay: '150ms' }}>
        <p className="font-semibold text-sm mb-1" style={{ color: '#d4a843' }}>
          <Sparkles className="inline mb-0.5 ml-1" size={14} />
          טיפ יומי - {categoryNames[tip.category]}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.75)' }}>{tip.text}</p>
      </div>

      {profile && (() => {
        const reminders: { text: string; icon: string; href: string }[] = [];
        const isFriday = new Date().getDay() === 5;
        const todayWeight = weights.find(w => w.date === today);
        if (isFriday && !todayWeight) reminders.push({ text: 'היום יום שישי - הגיע הזמן להישקל!', icon: '⚖️', href: '/weight' });
        if (todayFoods.length === 0) reminders.push({ text: 'עדיין לא תיעדת ארוחות היום', icon: '🍽️', href: '/food' });
        if (todayWater < 4) reminders.push({ text: `שתית רק ${todayWater} כוסות מים - נסה להגיע ל-8!`, icon: '💧', href: '/water' });
        if (todayExercises.length === 0) reminders.push({ text: 'עוד לא התאמנת היום - בוא נזיז את הגוף!', icon: '💪', href: '/exercise' });
        if (reminders.length === 0) return null;
        return (
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <Bell size={16} /> <span className="text-sm font-medium">תזכורות להיום</span>
            </div>
            {reminders.map((r, i) => (
              <Link key={i} href={r.href} className="block glass-card p-3 hover:border-purple-500/30 transition-all">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{r.icon} {r.text}</span>
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
          <div className="glass-card-static p-5 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(249, 115, 22, 0.15)' }}>
                  <Flame className="text-orange-400" size={20} />
                </div>
                <h3 className="font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>תקציב קלוריות יומי</h3>
              </div>
              <div className="text-left">
                <span className={`text-2xl font-bold ${overBudget ? 'text-red-400' : 'text-emerald-400'}`}>{todayCaloriesIn}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}> / {target}</span>
              </div>
            </div>
            <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className={`h-3 rounded-full transition-all progress-shimmer ${overBudget ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>TDEE: {tdee} | יעד לירידה: {target}</span>
              <span>{todayCaloriesBurned > 0 && `שרפת ${todayCaloriesBurned} | `}נשאר: {Math.max(0, target - net)}</span>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Scale className="text-blue-400" size={20} />}
          iconBg="rgba(59, 130, 246, 0.15)"
          title="משקל נוכחי"
          value={latestWeight ? `${latestWeight.weight} ק"ג` : '--'}
          subtitle={weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} מהשקילה הקודמת` : ''}
          subtitleColor={weightChange <= 0 ? '#34d399' : '#f87171'}
          href="/weight"
          delay={300}
        />
        <StatCard
          icon={<Flame className="text-orange-400" size={20} />}
          iconBg="rgba(249, 115, 22, 0.15)"
          title="קלוריות היום"
          value={`${todayCaloriesIn}`}
          subtitle={todayCaloriesBurned > 0 ? `${todayCaloriesBurned} נשרפו` : 'עדיין לא אכלת היום'}
          href="/food"
          delay={350}
        />
        <StatCard
          icon={<Dumbbell className="text-purple-400" size={20} />}
          iconBg="rgba(168, 85, 247, 0.15)"
          title="אימון היום"
          value={`${todayExerciseMinutes} דק'`}
          subtitle={todayExercises.length > 0 ? `${todayExercises.length} אימונים` : 'בוא להתאמן!'}
          href="/exercise"
          delay={400}
        />
        <StatCard
          icon={<Droplets className="text-cyan-400" size={20} />}
          iconBg="rgba(34, 211, 238, 0.15)"
          title="מים היום"
          value={`${todayWater} כוסות`}
          subtitle={todayWater >= 8 ? 'מצוין! הגעת ליעד!' : `חסרות ${8 - todayWater} כוסות`}
          subtitleColor={todayWater >= 8 ? '#34d399' : '#fb923c'}
          href="/water"
          delay={450}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profile && latestWeight && (
          <div className="glass-card-static p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                <Target className="text-blue-400" size={20} />
              </div>
              <h3 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>התקדמות ליעד</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span>יעד: {profile.targetWeight} ק&quot;ג</span>
                  <span>התחלה: {profile.startWeight} ק&quot;ג</span>
                </div>
                <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-3 rounded-full transition-all progress-shimmer"
                    style={{
                      width: `${Math.min(100, Math.max(0, (totalLost / (profile.startWeight - profile.targetWeight)) * 100))}%`,
                      background: 'linear-gradient(90deg, #8b5cf6, #d4a843)',
                    }}
                  />
                </div>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  ירדת {totalLost.toFixed(1)} ק&quot;ג | נשאר {remainingToGoal.toFixed(1)} ק&quot;ג
                </p>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>BMI</p>
                <p className="text-2xl font-bold gold-text stat-number">{bmi.toFixed(1)}</p>
                <p className="text-sm" style={{ color: '#d4a843' }}>{bmiInfo.label}</p>
              </div>
              {daysToTarget > 0 && (
                <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {daysToTarget} ימים עד תאריך היעד
                </p>
              )}
            </div>
          </div>
        )}

        <div className="glass-card-static p-6 animate-slide-up" style={{ animationDelay: '550ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(234, 179, 8, 0.15)' }}>
              <Trophy className="text-yellow-400" size={20} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>הישגים</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-2xl">🔥</span>
              <div>
                <p className="font-semibold stat-number" style={{ color: '#d4a843' }}>{streakDays} ימים ברצף</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>רצף תיעוד</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-2xl">📉</span>
              <div>
                <p className="font-semibold stat-number" style={{ color: '#34d399' }}>{totalLost > 0 ? totalLost.toFixed(1) : '0'} ק&quot;ג</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>סה&quot;כ ירדת</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-2xl">💪</span>
              <div>
                <p className="font-semibold stat-number" style={{ color: '#a78bfa' }}>{exercises.length} אימונים</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>סה&quot;כ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card-static p-6 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
              <TrendingDown className="text-emerald-400" size={20} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>יום שקילה</h3>
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
                    <p className="text-xl font-bold text-emerald-400">נשקלת היום!</p>
                    <p className="text-2xl font-bold gold-text mt-1">{todayWeight.weight} ק&quot;ג</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl mb-2">⚖️</p>
                    <p className="text-xl font-bold" style={{ color: '#d4a843' }}>היום יום שישי!</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>הגיע הזמן להישקל</p>
                  </>
                );
              }
              return (
                <>
                  <p className="text-5xl font-bold stat-number mb-2" style={{ color: '#8b5cf6' }}>{daysUntilFriday}</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)' }}>ימים עד השקילה הבאה</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>(יום שישי)</p>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {leaderboard.length > 1 && (
        <div className="glass-card-static p-6 animate-slide-up" style={{ animationDelay: '650ms' }}>
          <Link href="/competition" className="flex items-center gap-2 mb-4 group">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(234, 179, 8, 0.15)' }}>
              <Crown className="text-yellow-400" size={20} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>טבלת מובילים</h3>
            <span className="text-sm mr-auto group-hover:text-purple-400 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>→ לטבלה המלאה</span>
          </Link>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl transition-all" style={{ background: i === 0 ? 'rgba(212, 168, 67, 0.05)' : 'transparent' }}>
                  <span className="text-lg w-8 text-center">{medals[i] || `${i + 1}.`}</span>
                  {entry.avatar.startsWith('data:') ? (
                    <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: '2px solid rgba(139, 92, 246, 0.3)' }} />
                  ) : (
                    <span className="text-xl w-8 text-center">{entry.avatar}</span>
                  )}
                  <span className="font-medium flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{entry.name}</span>
                  <div className="w-24 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-2 rounded-full" style={{ width: `${entry.pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #d4a843)' }} />
                  </div>
                  <span className="text-sm font-bold w-12 text-left gold-text">{entry.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickAction title="יומן יומי" description="צפה בשבוע שלך" href="/daily" icon={<Scale size={22} />} gradient="from-indigo-600 to-purple-600" delay={700} />
        <QuickAction title="הוסף ארוחה" description="תעד מה אכלת היום" href="/food" icon={<UtensilsCrossed size={22} />} gradient="from-emerald-600 to-teal-600" delay={750} />
        <QuickAction title="הוסף אימון" description="תעד את האימון שלך" href="/exercise" icon={<Dumbbell size={22} />} gradient="from-purple-600 to-pink-600" delay={800} />
        <QuickAction title="טבלת תחרות" description="מי מוביל?" href="/competition" icon={<Trophy size={22} />} gradient="from-amber-600 to-yellow-500" delay={850} />
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, title, value, subtitle, subtitleColor, href, delay }: {
  icon: React.ReactNode; iconBg: string; title: string; value: string; subtitle: string; subtitleColor?: string; href: string; delay: number;
}) {
  return (
    <Link href={href} className="glass-card p-5 block animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: iconBg }}>
          {icon}
        </div>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{title}</span>
      </div>
      <p className="text-2xl font-bold stat-number" style={{ color: 'rgba(255,255,255,0.95)' }}>{value}</p>
      {subtitle && <p className="text-sm mt-1" style={{ color: subtitleColor || 'rgba(255,255,255,0.4)' }}>{subtitle}</p>}
    </Link>
  );
}

function QuickAction({ title, description, href, icon, gradient, delay }: {
  title: string; description: string; href: string; icon: React.ReactNode; gradient: string; delay: number;
}) {
  return (
    <Link href={href} className="glass-card flex items-center gap-4 p-5 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className={`bg-gradient-to-br ${gradient} text-white p-3 rounded-xl shadow-lg`}>{icon}</div>
      <div>
        <p className="font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{title}</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{description}</p>
      </div>
    </Link>
  );
}
