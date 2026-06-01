'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Crown, Award } from 'lucide-react';
import { getProfiles, getWeightEntries } from '../lib/storage';
import { UserProfile, WeightEntry } from '../lib/types';
import { toHebrewDate } from '../lib/hebrew-date';

interface CompetitorStats {
  profile: UserProfile;
  latestWeight: number | null;
  progressPercent: number;
  totalLost: number;
  remaining: number;
  weeklyLostPercent: number;
}

function getLastFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  const friday = new Date(now);
  friday.setDate(now.getDate() - diff);
  return friday.toISOString().split('T')[0];
}

export default function CompetitionPage() {
  const [competitors, setCompetitors] = useState<CompetitorStats[]>([]);

  useEffect(() => {
    const profiles = getProfiles();
    const lastFriday = getLastFriday();

    const stats: CompetitorStats[] = profiles.map(profile => {
      const weights = getWeightEntries(profile.id).sort((a, b) => a.date.localeCompare(b.date));
      const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
      const totalLost = latestWeight !== null ? profile.startWeight - latestWeight : 0;
      const progressPercent = totalLost > 0 && profile.startWeight > 0
        ? (totalLost / profile.startWeight) * 100
        : 0;
      const remaining = latestWeight !== null ? latestWeight - profile.targetWeight : profile.startWeight - profile.targetWeight;

      const fridayWeights = weights.filter(w => w.date <= lastFriday);
      const fridayWeight = fridayWeights.length > 0 ? fridayWeights[fridayWeights.length - 1].weight : null;
      const weeklyLost = fridayWeight !== null && latestWeight !== null ? fridayWeight - latestWeight : 0;
      const weeklyLostPercent = weeklyLost > 0 && fridayWeight
        ? (weeklyLost / fridayWeight) * 100
        : 0;

      return { profile, latestWeight, progressPercent, totalLost, remaining, weeklyLostPercent };
    });

    stats.sort((a, b) => b.progressPercent - a.progressPercent);
    setCompetitors(stats);
  }, []);

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const overallWinner = competitors.find(c => c.totalLost > 0);
  const weeklyWinner = [...competitors].sort((a, b) => b.weeklyLostPercent - a.weeklyLostPercent).find(c => c.weeklyLostPercent > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Trophy className="text-yellow-500" /> טבלת תחרות
      </h1>

      <div className="bg-gradient-to-l from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800 text-sm">
          🏆 הדירוג מבוסס על <strong>אחוז הירידה ממשקל ההתחלה</strong> - כך התחרות הוגנת לכולם, ללא קשר ליעד האישי!
        </p>
      </div>

      {(overallWinner || weeklyWinner) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {overallWinner && (
            <div className="bg-gradient-to-l from-yellow-100 to-amber-50 border-2 border-yellow-400 rounded-xl p-4 text-center">
              <Crown className="mx-auto text-yellow-500 mb-1" size={28} />
              <p className="text-sm font-bold text-yellow-800 mb-1">🏆 מנצח כללי</p>
              <div className="flex items-center justify-center gap-2">
                {overallWinner.profile.avatar?.startsWith('data:') ? (
                  <img src={overallWinner.profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-xl">{overallWinner.profile.avatar}</span>
                )}
                <span className="font-bold text-lg">{overallWinner.profile.name}</span>
              </div>
              <p className="text-green-700 font-semibold text-sm mt-1">
                -{overallWinner.totalLost.toFixed(1)} {"ק\"ג"} ({overallWinner.progressPercent.toFixed(1)}%)
              </p>
            </div>
          )}
          {weeklyWinner && (
            <div className="bg-gradient-to-l from-blue-100 to-indigo-50 border-2 border-blue-400 rounded-xl p-4 text-center">
              <Award className="mx-auto text-blue-500 mb-1" size={28} />
              <p className="text-sm font-bold text-blue-800 mb-1">⭐ מנצח השבוע</p>
              <div className="flex items-center justify-center gap-2">
                {weeklyWinner.profile.avatar?.startsWith('data:') ? (
                  <img src={weeklyWinner.profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-xl">{weeklyWinner.profile.avatar}</span>
                )}
                <span className="font-bold text-lg">{weeklyWinner.profile.name}</span>
              </div>
              <p className="text-blue-700 font-semibold text-sm mt-1">
                -{weeklyWinner.weeklyLostPercent.toFixed(2)}% השבוע
              </p>
            </div>
          )}
        </div>
      )}

      {competitors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border text-center">
          <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-600">אין משתתפים עדיין</p>
          <p className="text-gray-400">צור פרופילים כדי להתחיל בתחרות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {competitors.map((c, i) => {
            const hasLost = c.totalLost > 0;
            const cardBg = hasLost
              ? (i === 0 ? 'from-yellow-100 to-yellow-50 border-yellow-300'
                : i === 1 ? 'from-gray-100 to-gray-50 border-gray-300'
                : i === 2 ? 'from-orange-100 to-orange-50 border-orange-300'
                : 'from-green-50 to-white border-green-200')
              : 'from-red-50 to-white border-red-300';

            return (
              <div
                key={c.profile.id}
                className={`bg-gradient-to-l ${cardBg} rounded-xl shadow-sm p-5 border transition-all hover:shadow-md`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl min-w-[50px] text-center">
                    {hasLost ? getMedalEmoji(i) : '❌'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {c.profile.avatar?.startsWith('data:') ? (
                        <img src={c.profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-xl">{c.profile.avatar}</span>
                      )}
                      <h3 className="font-bold text-lg">{c.profile.name}</h3>
                      <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full text-gray-600">
                        {c.profile.gender === 'male' ? 'זכר' : 'נקבה'}
                      </span>
                    </div>

                    <div className="w-full bg-white/50 rounded-full h-5 mb-2">
                      {hasLost ? (
                        <div
                          className="h-5 rounded-full transition-all flex items-center justify-end px-2 bg-green-500"
                          style={{ width: `${Math.max(12, c.progressPercent * 10)}%` }}
                        >
                          <span className="text-white text-xs font-bold">
                            {c.progressPercent.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <div className="h-5 rounded-full flex items-center px-3">
                          <span className="text-red-500 text-xs font-bold">לא ירד במשקל</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        התחלה: {c.profile.startWeight} {"ק\"ג"}
                      </span>
                      <span>
                        נוכחי: {c.latestWeight !== null ? `${c.latestWeight} ק"ג` : 'טרם נשקל'}
                      </span>
                      <span>
                        יעד: {c.profile.targetWeight} {"ק\"ג"}
                      </span>
                      {hasLost ? (
                        <span className="text-green-600 font-semibold flex items-center gap-1">
                          <TrendingDown size={14} /> -{c.totalLost.toFixed(1)} {"ק\"ג"}
                        </span>
                      ) : c.totalLost < 0 ? (
                        <span className="text-red-500 font-semibold flex items-center gap-1">
                          <TrendingUp size={14} /> +{Math.abs(c.totalLost).toFixed(1)} {"ק\"ג"}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-gray-400 mt-1">
                      יעד: {new Date(c.profile.targetDate).toLocaleDateString('he-IL')} ({toHebrewDate(c.profile.targetDate)})
                      {c.remaining > 0 && ` | נשאר: ${c.remaining.toFixed(1)} ק"ג`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
