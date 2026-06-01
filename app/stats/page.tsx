'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Ruler, LineChart as LineChartIcon, BarChart2, TrendingUp, CandlestickChart as CandlestickIcon } from 'lucide-react';
import { getWeightEntries, getFoodEntries, getExerciseEntries, getMeasurementEntries, getActiveProfile, getActiveProfileId } from '../lib/storage';
import { WeightEntry, FoodEntry, ExerciseEntry, MeasurementEntry } from '../lib/types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area,
  ComposedChart, useXAxisScale, useYAxisScale,
} from 'recharts';
import { toHebrewDate } from '../lib/hebrew-date';
import Link from 'next/link';

type ChartType = 'line' | 'bar' | 'area' | 'candle';

const dayNamesShort: Record<number, string> = { 0: 'א׳', 1: 'ב׳', 2: 'ג׳', 3: 'ד׳', 4: 'ה׳', 5: 'ו׳', 6: 'ש׳' };
function chartDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = dayNamesShort[d.getDay()] || '';
  const greg = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
  const heb = toHebrewDate(dateStr);
  return `${day} ${greg} (${heb})`;
}

const chartTypeLabels: Record<ChartType, { label: string; icon: React.ReactNode }> = {
  line: { label: 'קו', icon: <LineChartIcon size={14} /> },
  bar: { label: 'עמודות', icon: <BarChart2 size={14} /> },
  area: { label: 'שטח', icon: <TrendingUp size={14} /> },
  candle: { label: 'נרות', icon: <CandlestickIcon size={14} /> },
};

function ChartTypePicker({ value, onChange }: { value: ChartType; onChange: (v: ChartType) => void }) {
  return (
    <div className="flex gap-1">
      {(Object.keys(chartTypeLabels) as ChartType[]).map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${value === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {chartTypeLabels[t].icon} {chartTypeLabels[t].label}
        </button>
      ))}
    </div>
  );
}

function FlexChart({ type, data, dataKeys, colors, names, height = 300, yDomain, referenceLine, xKey = 'date' }: {
  type: ChartType;
  data: Record<string, unknown>[];
  dataKeys: string[];
  colors: string[];
  names: string[];
  height?: number;
  yDomain?: [string, string];
  referenceLine?: { y: number; label: string };
  xKey?: string;
}) {
  if (type === 'candle') {
    const chunkSize = Math.max(3, Math.ceil(data.length / 8));
    const chunks: Record<string, unknown>[][] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    const candleData = chunks.map(chunk => {
      const entry: Record<string, unknown> = { date: chunk[0][xKey] as string };
      dataKeys.forEach(k => {
        const vals = chunk.map(d => d[k] as number).filter(v => v != null && v !== 0);
        if (vals.length > 0) {
          entry[`${k}_open`] = vals[0];
          entry[`${k}_close`] = vals[vals.length - 1];
          entry[`${k}_high`] = Math.max(...vals);
          entry[`${k}_low`] = Math.min(...vals);
        }
      });
      return entry;
    });

    const allVals = candleData.flatMap(d =>
      dataKeys.flatMap(k => [d[`${k}_high`] as number, d[`${k}_low`] as number]).filter(v => v != null)
    );
    const domainMin = allVals.length ? Math.floor(Math.min(...allVals)) - 1 : 0;
    const domainMax = allVals.length ? Math.ceil(Math.max(...allVals)) + 1 : 100;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={candleData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[domainMin, domainMax]} />
          <Tooltip content={({ payload, label }) => {
            if (!payload?.[0]) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-white border rounded-lg p-2.5 shadow text-sm" dir="rtl">
                <p className="font-bold mb-1">{label}</p>
                {dataKeys.map((k, i) => {
                  const o = d[`${k}_open`]; const c = d[`${k}_close`];
                  const h = d[`${k}_high`]; const l = d[`${k}_low`];
                  if (o == null) return null;
                  return (
                    <div key={k} className="mb-1" style={{ color: colors[i] }}>
                      <p className="font-medium">{names[i]}</p>
                      <p className="text-gray-600">פתיחה: {o} | סגירה: {c}</p>
                      <p className="text-gray-600">גבוה: {h} | נמוך: {l}</p>
                    </div>
                  );
                })}
              </div>
            );
          }} />
          <Bar dataKey={`${dataKeys[0]}_high`} fill="transparent" isAnimationActive={false} />
          {dataKeys.map((k, i) => (
            <CandlestickLayer key={k} data={candleData.map(d => ({
              date: d.date as string,
              open: (d[`${k}_open`] ?? 0) as number,
              close: (d[`${k}_close`] ?? 0) as number,
              high: (d[`${k}_high`] ?? 0) as number,
              low: (d[`${k}_low`] ?? 0) as number,
            }))} color={colors[i]} />
          ))}
          {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#22c55e" strokeDasharray="5 5" label={referenceLine.label} />}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis domain={yDomain as never} />
          <Tooltip />
          {dataKeys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={colors[i]} name={names[i]} radius={[4, 4, 0, 0]} />
          ))}
          {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#22c55e" strokeDasharray="5 5" label={referenceLine.label} />}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis domain={yDomain as never} />
          <Tooltip />
          {dataKeys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fill={colors[i]} fillOpacity={0.2} strokeWidth={2} name={names[i]} />
          ))}
          {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#22c55e" strokeDasharray="5 5" label={referenceLine.label} />}
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis domain={yDomain as never} />
        <Tooltip />
        {dataKeys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} stroke={colors[i]} strokeWidth={2} name={names[i]} dot={{ r: 3 }} connectNulls />
        ))}
        {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#22c55e" strokeDasharray="5 5" label={referenceLine.label} />}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

function CandlestickLayer({ data, color: fixedColor }: { data: OHLCData[]; color?: string }) {
  const xScale = useXAxisScale(0);
  const yScale = useYAxisScale(0);
  if (!xScale || !yScale) return null;

  return (
    <g>
      {data.map((d, i) => {
        const x = xScale(d.date, { position: 'middle' });
        if (x === undefined) return null;
        const openY = yScale(d.open) ?? 0;
        const closeY = yScale(d.close) ?? 0;
        const highY = yScale(d.high) ?? 0;
        const lowY = yScale(d.low) ?? 0;

        const isDown = d.close < d.open;
        const color = fixedColor || (isDown ? '#22c55e' : d.close > d.open ? '#ef4444' : '#6b7280');
        const bodyTop = Math.min(openY, closeY);
        const bodyH = Math.max(Math.abs(openY - closeY), 2);
        const barW = 18;

        return (
          <g key={i}>
            <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth={1.5} />
            <rect x={x - barW / 2} y={bodyTop} width={barW} height={bodyH} fill={color} stroke={color} rx={2} />
          </g>
        );
      })}
    </g>
  );
}

function CandleChart({ data, height = 300, referenceLine }: {
  data: OHLCData[];
  height?: number;
  referenceLine?: { y: number; label: string };
}) {
  const allVals = data.flatMap(d => [d.open, d.high, d.low, d.close]);
  const domainMin = Math.floor(Math.min(...allVals)) - 1;
  const domainMax = Math.ceil(Math.max(...allVals)) + 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[domainMin, domainMax]} />
        <Tooltip content={({ payload, label }) => {
          if (!payload?.[0]) return null;
          const d = payload[0].payload as OHLCData;
          const isDown = d.close < d.open;
          return (
            <div className="bg-white border rounded-lg p-2.5 shadow text-sm" dir="rtl">
              <p className="font-bold mb-1">{label}</p>
              <p>פתיחה: {d.open} ק&quot;ג</p>
              <p>גבוה: {d.high} ק&quot;ג</p>
              <p>נמוך: {d.low} ק&quot;ג</p>
              <p className={isDown ? 'text-green-600 font-semibold' : d.close > d.open ? 'text-red-500 font-semibold' : ''}>
                סגירה: {d.close} ק&quot;ג
              </p>
            </div>
          );
        }} />
        <Bar dataKey="high" fill="transparent" isAnimationActive={false} />
        <CandlestickLayer data={data} />
        {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#22c55e" strokeDasharray="5 5" label={referenceLine.label} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function weightToOHLC(weights: WeightEntry[]): OHLCData[] {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const grouped: Record<string, WeightEntry[]> = {};
  sorted.forEach(w => {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(w);
  });
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, vals]) => vals.length > 0)
    .map(([week, vals]) => ({
      date: chartDate(week),
      open: vals[0].weight,
      close: vals[vals.length - 1].weight,
      high: Math.max(...vals.map(v => v.weight)),
      low: Math.min(...vals.map(v => v.weight)),
    }));
}

export default function StatsPage() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [startWeight, setStartWeight] = useState<number | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const loadChart = (key: string, def: ChartType): ChartType => {
    if (typeof window === 'undefined') return def;
    return (localStorage.getItem(key) as ChartType) || def;
  };
  const saveChart = (key: string, val: ChartType, setter: (v: ChartType) => void) => {
    localStorage.setItem(key, val);
    setter(val);
  };
  const [weightChartType, _setWeightChartType] = useState<ChartType>(() => loadChart('chart_weight', 'area'));
  const [calorieChartType, _setCalorieChartType] = useState<ChartType>(() => loadChart('chart_calorie', 'line'));
  const [exerciseChartType, _setExerciseChartType] = useState<ChartType>(() => loadChart('chart_exercise', 'line'));
  const [weeklyChartType, _setWeeklyChartType] = useState<ChartType>(() => loadChart('chart_weekly', 'line'));
  const [measureChartType, _setMeasureChartType] = useState<ChartType>(() => loadChart('chart_measure', 'line'));
  const setWeightChartType = (v: ChartType) => saveChart('chart_weight', v, _setWeightChartType);
  const setCalorieChartType = (v: ChartType) => saveChart('chart_calorie', v, _setCalorieChartType);
  const setExerciseChartType = (v: ChartType) => saveChart('chart_exercise', v, _setExerciseChartType);
  const setWeeklyChartType = (v: ChartType) => saveChart('chart_weekly', v, _setWeeklyChartType);
  const setMeasureChartType = (v: ChartType) => saveChart('chart_measure', v, _setMeasureChartType);

  useEffect(() => {
    const pid = getActiveProfileId();
    setProfileId(pid);
    if (pid) {
      setWeights(getWeightEntries(pid));
      setFoods(getFoodEntries(pid));
      setExercises(getExerciseEntries(pid));
      setMeasurements(getMeasurementEntries(pid));
    }
    const profile = getActiveProfile();
    if (profile) {
      setTargetWeight(profile.targetWeight);
      setStartWeight(profile.startWeight);
    }
  }, []);

  if (!profileId) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-6"><BarChart3 className="text-orange-500" /> סטטיסטיקות</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל קודם</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">צור פרופיל</Link>
        </div>
      </div>
    );
  }

  const sortedWeights = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const weightChartData = sortedWeights.map(e => ({
    date: chartDate(e.date),
    weight: e.weight,
  }));

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const calorieData = last30Days.map(date => {
    const dayFoods = foods.filter(f => f.date === date);
    const dayExercises = exercises.filter(e => e.date === date);
    return {
      date: chartDate(date),
      consumed: dayFoods.reduce((s, f) => s + (f.calories || 0), 0),
      burned: dayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0),
    };
  }).filter(d => d.consumed > 0 || d.burned > 0);

  const exerciseData = last30Days.map(date => ({
    date: chartDate(date),
    minutes: exercises.filter(e => e.date === date).reduce((s, e) => s + e.duration, 0),
  })).filter(d => d.minutes > 0);

  const weeklyWeightData = (() => {
    if (sortedWeights.length < 2 || !startWeight) return [];
    const grouped: Record<string, number[]> = {};
    sortedWeights.forEach(w => {
      const d = new Date(w.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(w.weight);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, vals], i, arr) => {
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
        const prevAvg = i > 0 ? arr[i - 1][1].reduce((s, v) => s + v, 0) / arr[i - 1][1].length : avg;
        return {
          week: chartDate(week),
          avgWeight: +avg.toFixed(1),
          weeklyChange: i > 0 ? +(avg - prevAvg).toFixed(2) : 0,
          totalFromStart: +(startWeight - avg).toFixed(2),
        };
      });
  })();

  const measurementChartData = (() => {
    const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map(m => ({
      date: chartDate(m.date),
      waist: m.waist || null,
      chest: m.chest || null,
      hips: m.hips || null,
      armRight: m.armRight || null,
      thighRight: m.thighRight || null,
    }));
  })();

  const totalExerciseMinutes = exercises.reduce((s, e) => s + e.duration, 0);
  const uniqueFoodDays = new Set(foods.map(f => f.date)).size;
  const avgDailyCalories = uniqueFoodDays > 0
    ? Math.round(foods.reduce((s, f) => s + (f.calories || 0), 0) / uniqueFoodDays) : 0;
  const weightLost = sortedWeights.length >= 2
    ? sortedWeights[0].weight - sortedWeights[sortedWeights.length - 1].weight : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <BarChart3 className="text-orange-500" /> סטטיסטיקות וגרפים
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border text-center">
          <p className="text-sm text-gray-500">{"סה\"כ דקות אימון"}</p>
          <p className="text-3xl font-bold text-purple-600">{totalExerciseMinutes}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border text-center">
          <p className="text-sm text-gray-500">ממוצע קלוריות יומי</p>
          <p className="text-3xl font-bold text-orange-600">{avgDailyCalories}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border text-center">
          <p className="text-sm text-gray-500">ירידה כוללת</p>
          <p className={`text-3xl font-bold ${weightLost > 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {weightLost > 0 ? weightLost.toFixed(1) : '0'} {"ק\"ג"}
          </p>
        </div>
      </div>

      {weightChartData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">מגמת משקל</h2>
            <ChartTypePicker value={weightChartType} onChange={setWeightChartType} />
          </div>
          {weightChartType === 'candle' ? (
            <CandleChart
              data={weightToOHLC(weights)}
              referenceLine={targetWeight ? { y: targetWeight, label: `יעד: ${targetWeight}` } : undefined}
            />
          ) : (
            <FlexChart
              type={weightChartType}
              data={weightChartData}
              dataKeys={['weight']}
              colors={['#3b82f6']}
              names={['משקל (ק"ג)']}
              yDomain={['dataMin - 2', 'dataMax + 2']}
              referenceLine={targetWeight ? { y: targetWeight, label: `יעד: ${targetWeight}` } : undefined}
            />
          )}
        </div>
      )}

      {calorieData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">קלוריות - צריכה מול שריפה</h2>
            <ChartTypePicker value={calorieChartType} onChange={setCalorieChartType} />
          </div>
          <FlexChart
            type={calorieChartType}
            data={calorieData}
            dataKeys={['consumed', 'burned']}
            colors={['#f97316', '#22c55e']}
            names={['צריכה', 'שריפה']}
          />
        </div>
      )}

      {exerciseData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">דקות אימון ביום</h2>
            <ChartTypePicker value={exerciseChartType} onChange={setExerciseChartType} />
          </div>
          <FlexChart
            type={exerciseChartType}
            data={exerciseData}
            dataKeys={['minutes']}
            colors={['#a855f7']}
            names={['דקות']}
            height={250}
          />
        </div>
      )}

      {weeklyWeightData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">ירידה שבועית במשקל</h2>
            <ChartTypePicker value={weeklyChartType} onChange={setWeeklyChartType} />
          </div>
          {weeklyChartType === 'candle' ? (
            <CandleChart data={weightToOHLC(weights)} />
          ) : (
            <FlexChart
              type={weeklyChartType}
              data={weeklyWeightData}
              dataKeys={['weeklyChange', 'totalFromStart']}
              colors={['#ef4444', '#22c55e']}
              names={['שינוי שבועי (ק"ג)', 'סה"כ מההתחלה (ק"ג)']}
              xKey="week"
            />
          )}
        </div>
      )}

      {weeklyWeightData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="font-bold text-lg mb-4">טבלת משקל שבועית</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">שבוע</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">{"משקל ממוצע (ק\"ג)"}</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">{"שינוי שבועי (ק\"ג)"}</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">{"סה\"כ מההתחלה (ק\"ג)"}</th>
                </tr>
              </thead>
              <tbody>
                {weeklyWeightData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium">{row.week}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-800">{row.avgWeight}</td>
                    <td className={`py-2.5 px-3 text-center font-semibold ${row.weeklyChange < 0 ? 'text-green-600' : row.weeklyChange > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {row.weeklyChange === 0 ? '-' : `${row.weeklyChange > 0 ? '+' : ''}${row.weeklyChange}`}
                    </td>
                    <td className={`py-2.5 px-3 text-center font-semibold ${row.totalFromStart > 0 ? 'text-green-600' : row.totalFromStart < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {row.totalFromStart > 0 ? `-${row.totalFromStart}` : row.totalFromStart < 0 ? `+${Math.abs(row.totalFromStart)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {measurementChartData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Ruler className="text-pink-500" size={20} /> מגמת היקפים
            </h2>
            <ChartTypePicker value={measureChartType} onChange={setMeasureChartType} />
          </div>
          <FlexChart
            type={measureChartType}
            data={measurementChartData}
            dataKeys={['waist', 'chest', 'hips', 'armRight', 'thighRight']}
            colors={['#ef4444', '#3b82f6', '#a855f7', '#f97316', '#22c55e']}
            names={['מותניים', 'חזה', 'ירכיים', 'זרוע', 'ירך']}
          />
        </div>
      )}

      {weights.length === 0 && foods.length === 0 && exercises.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg">אין עדיין נתונים להציג</p>
          <p className="text-sm">התחל לתעד משקל, תזונה ואימונים כדי לראות את הסטטיסטיקות שלך</p>
        </div>
      )}
    </div>
  );
}
