'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Ruler, LineChart as LineChartIcon, BarChart2, TrendingUp, CandlestickChart as CandlestickIcon, Calendar } from 'lucide-react';
import { getWeightEntries, getFoodEntries, getExerciseEntries, getMeasurementEntries, getActiveProfile, getActiveProfileId } from '../lib/storage';
import { WeightEntry, FoodEntry, ExerciseEntry, MeasurementEntry } from '../lib/types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area,
  ComposedChart, useXAxisScale, useYAxisScale,
} from 'recharts';
import { toHebrewDate } from '../lib/hebrew-date';
import Link from 'next/link';

type ChartType = 'line' | 'bar' | 'area' | 'candle';
type TimeRange = '7d' | '14d' | '30d' | '90d' | '180d' | '365d' | 'all';

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'שבוע' },
  { value: '14d', label: '2 שבועות' },
  { value: '30d', label: 'חודש' },
  { value: '90d', label: '3 חודשים' },
  { value: '180d', label: 'חצי שנה' },
  { value: '365d', label: 'שנה' },
  { value: 'all', label: 'הכל' },
];

function getTimeRangeDays(range: TimeRange): number | null {
  if (range === 'all') return null;
  return parseInt(range);
}

function filterByTimeRange<T extends { date: string }>(entries: T[], range: TimeRange): T[] {
  const days = getTimeRangeDays(range);
  if (!days) return entries;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return entries.filter(e => e.date >= cutoffStr);
}

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

function TimeRangePicker({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Calendar size={14} style={{ color: 'rgba(255,255,255,0.3)' }} className="ml-1" />
      {timeRangeOptions.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className="px-2.5 py-1 rounded-lg text-xs transition-all duration-200"
          style={value === opt.value ? {
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            color: 'var(--accent-warm)',
          } : {
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-tertiary)',
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ChartTypePicker({ value, onChange }: { value: ChartType; onChange: (v: ChartType) => void }) {
  return (
    <div className="flex gap-1">
      {(Object.keys(chartTypeLabels) as ChartType[]).map(t => (
        <button key={t} onClick={() => onChange(t)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all duration-200"
          style={value === t ? {
            background: 'rgba(167, 139, 250, 0.1)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            color: 'var(--accent)',
          } : {
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-tertiary)',
          }}>
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
              <div className="rounded-xl p-2.5 shadow-xl text-sm" dir="rtl"
                style={{ background: 'rgba(15,15,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <p className="font-bold mb-1 text-gradient">{label}</p>
                {dataKeys.map((k, i) => {
                  const o = d[`${k}_open`]; const c = d[`${k}_close`];
                  const h = d[`${k}_high`]; const l = d[`${k}_low`];
                  if (o == null) return null;
                  return (
                    <div key={k} className="mb-1" style={{ color: colors[i] }}>
                      <p className="font-medium">{names[i]}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)' }}>פתיחה: {o} | סגירה: {c}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)' }}>גבוה: {h} | נמוך: {l}</p>
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
          {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#d4a843" strokeDasharray="5 5" label={referenceLine.label} />}
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
          {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#d4a843" strokeDasharray="5 5" label={referenceLine.label} />}
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
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} strokeWidth={2} name={names[i]} />
          ))}
          {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#d4a843" strokeDasharray="5 5" label={referenceLine.label} />}
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
          <Line key={k} type="monotone" dataKey={k} stroke={colors[i]} strokeWidth={2} name={names[i]} dot={{ r: 3, fill: colors[i] }} connectNulls />
        ))}
        {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#d4a843" strokeDasharray="5 5" label={referenceLine.label} />}
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
        const color = fixedColor || (isDown ? '#34d399' : d.close > d.open ? '#f87171' : '#6b7280');
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
            <div className="rounded-xl p-2.5 shadow-xl text-sm" dir="rtl"
              style={{ background: 'rgba(15,15,35,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="font-bold mb-1 text-gradient">{label}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>פתיחה: {d.open} ק&quot;ג</p>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>גבוה: {d.high} ק&quot;ג</p>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>נמוך: {d.low} ק&quot;ג</p>
              <p style={{ color: isDown ? '#34d399' : d.close > d.open ? '#f87171' : 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                סגירה: {d.close} ק&quot;ג
              </p>
            </div>
          );
        }} />
        <Bar dataKey="high" fill="transparent" isAnimationActive={false} />
        <CandlestickLayer data={data} />
        {referenceLine && <ReferenceLine y={referenceLine.y} stroke="#d4a843" strokeDasharray="5 5" label={referenceLine.label} />}
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
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

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
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
          <BarChart3 className="text-orange-400" /> סטטיסטיקות
        </h1>
        <div className="card-static p-8 text-center">
          <p className="text-lg mb-3" style={{ color: '#d4a843' }}>צור פרופיל קודם</p>
          <Link href="/profiles" className="inline-block btn-gold px-6 py-2.5 rounded-xl">צור פרופיל</Link>
        </div>
      </div>
    );
  }

  const filteredWeights = filterByTimeRange(weights, timeRange);
  const filteredFoods = filterByTimeRange(foods, timeRange);
  const filteredExercises = filterByTimeRange(exercises, timeRange);
  const filteredMeasurements = filterByTimeRange(measurements, timeRange);

  const sortedWeights = [...filteredWeights].sort((a, b) => a.date.localeCompare(b.date));
  const weightChartData = sortedWeights.map(e => ({
    date: chartDate(e.date),
    weight: e.weight,
  }));

  const days = getTimeRangeDays(timeRange) || 365;
  const dateRange = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });

  const calorieData = dateRange.map(date => {
    const dayFoods = filteredFoods.filter(f => f.date === date);
    const dayExercises = filteredExercises.filter(e => e.date === date);
    return {
      date: chartDate(date),
      consumed: dayFoods.reduce((s, f) => s + (f.calories || 0), 0),
      burned: dayExercises.reduce((s, e) => s + (e.caloriesBurned || 0), 0),
    };
  }).filter(d => d.consumed > 0 || d.burned > 0);

  const exerciseData = dateRange.map(date => ({
    date: chartDate(date),
    minutes: filteredExercises.filter(e => e.date === date).reduce((s, e) => s + e.duration, 0),
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
    const sorted = [...filteredMeasurements].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map(m => ({
      date: chartDate(m.date),
      waist: m.waist || null,
      chest: m.chest || null,
      hips: m.hips || null,
      armRight: m.armRight || null,
      thighRight: m.thighRight || null,
    }));
  })();

  const totalExerciseMinutes = filteredExercises.reduce((s, e) => s + e.duration, 0);
  const uniqueFoodDays = new Set(filteredFoods.map(f => f.date)).size;
  const avgDailyCalories = uniqueFoodDays > 0
    ? Math.round(filteredFoods.reduce((s, f) => s + (f.calories || 0), 0) / uniqueFoodDays) : 0;
  const weightLost = sortedWeights.length >= 2
    ? sortedWeights[0].weight - sortedWeights[sortedWeights.length - 1].weight : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 enter">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(249, 115, 22, 0.15)' }}>
            <BarChart3 className="text-orange-400" size={24} />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.9)' }}>סטטיסטיקות וגרפים</span>
        </h1>
      </div>

      <div className="card-static p-3 enter" style={{ animationDelay: '50ms' }}>
        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-static p-5 text-center enter" style={{ animationDelay: '100ms' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{"סה\"כ דקות אימון"}</p>
          <p className="text-3xl font-bold font-semibold" style={{ color: '#a78bfa' }}>{totalExerciseMinutes}</p>
        </div>
        <div className="card-static p-5 text-center enter" style={{ animationDelay: '150ms' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>ממוצע קלוריות יומי</p>
          <p className="text-3xl font-bold font-semibold" style={{ color: '#fb923c' }}>{avgDailyCalories}</p>
        </div>
        <div className="card-static p-5 text-center enter" style={{ animationDelay: '200ms' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>ירידה כוללת</p>
          <p className={`text-3xl font-bold font-semibold ${weightLost > 0 ? 'text-emerald-400' : ''}`} style={weightLost <= 0 ? { color: 'rgba(255,255,255,0.5)' } : {}}>
            {weightLost > 0 ? weightLost.toFixed(1) : '0'} {"ק\"ג"}
          </p>
        </div>
      </div>

      {weightChartData.length > 1 && (
        <div className="card-static p-6 enter" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>מגמת משקל</h2>
            <ChartTypePicker value={weightChartType} onChange={setWeightChartType} />
          </div>
          {weightChartType === 'candle' ? (
            <CandleChart
              data={weightToOHLC(filteredWeights)}
              referenceLine={targetWeight ? { y: targetWeight, label: `יעד: ${targetWeight}` } : undefined}
            />
          ) : (
            <FlexChart
              type={weightChartType}
              data={weightChartData}
              dataKeys={['weight']}
              colors={['#8b5cf6']}
              names={['משקל (ק"ג)']}
              yDomain={['dataMin - 2', 'dataMax + 2']}
              referenceLine={targetWeight ? { y: targetWeight, label: `יעד: ${targetWeight}` } : undefined}
            />
          )}
        </div>
      )}

      {calorieData.length > 0 && (
        <div className="card-static p-6 enter" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>קלוריות - צריכה מול שריפה</h2>
            <ChartTypePicker value={calorieChartType} onChange={setCalorieChartType} />
          </div>
          <FlexChart
            type={calorieChartType}
            data={calorieData}
            dataKeys={['consumed', 'burned']}
            colors={['#fb923c', '#34d399']}
            names={['צריכה', 'שריפה']}
          />
        </div>
      )}

      {exerciseData.length > 0 && (
        <div className="card-static p-6 enter" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>דקות אימון ביום</h2>
            <ChartTypePicker value={exerciseChartType} onChange={setExerciseChartType} />
          </div>
          <FlexChart
            type={exerciseChartType}
            data={exerciseData}
            dataKeys={['minutes']}
            colors={['#a78bfa']}
            names={['דקות']}
            height={250}
          />
        </div>
      )}

      {weeklyWeightData.length > 1 && (
        <div className="card-static p-6 enter" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-lg" style={{ color: 'rgba(255,255,255,0.9)' }}>ירידה שבועית במשקל</h2>
            <ChartTypePicker value={weeklyChartType} onChange={setWeeklyChartType} />
          </div>
          {weeklyChartType === 'candle' ? (
            <CandleChart data={weightToOHLC(filteredWeights)} />
          ) : (
            <FlexChart
              type={weeklyChartType}
              data={weeklyWeightData}
              dataKeys={['weeklyChange', 'totalFromStart']}
              colors={['#f87171', '#34d399']}
              names={['שינוי שבועי (ק"ג)', 'סה"כ מההתחלה (ק"ג)']}
              xKey="week"
            />
          )}
        </div>
      )}

      {weeklyWeightData.length > 0 && (
        <div className="card-static p-6 enter" style={{ animationDelay: '450ms' }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>טבלת משקל שבועית</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th className="text-right py-2 px-3 font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>שבוע</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{"משקל ממוצע (ק\"ג)"}</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{"שינוי שבועי (ק\"ג)"}</th>
                  <th className="text-center py-2 px-3 font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{"סה\"כ מההתחלה (ק\"ג)"}</th>
                </tr>
              </thead>
              <tbody>
                {weeklyWeightData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{row.week}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-gradient">{row.avgWeight}</td>
                    <td className={`py-2.5 px-3 text-center font-semibold ${row.weeklyChange < 0 ? 'text-emerald-400' : row.weeklyChange > 0 ? 'text-red-400' : ''}`}
                      style={row.weeklyChange === 0 ? { color: 'rgba(255,255,255,0.3)' } : {}}>
                      {row.weeklyChange === 0 ? '-' : `${row.weeklyChange > 0 ? '+' : ''}${row.weeklyChange}`}
                    </td>
                    <td className={`py-2.5 px-3 text-center font-semibold ${row.totalFromStart > 0 ? 'text-emerald-400' : row.totalFromStart < 0 ? 'text-red-400' : ''}`}
                      style={row.totalFromStart === 0 ? { color: 'rgba(255,255,255,0.3)' } : {}}>
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
        <div className="card-static p-6 enter" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <Ruler className="text-pink-400" size={20} /> מגמת היקפים
            </h2>
            <ChartTypePicker value={measureChartType} onChange={setMeasureChartType} />
          </div>
          <FlexChart
            type={measureChartType}
            data={measurementChartData}
            dataKeys={['waist', 'chest', 'hips', 'armRight', 'thighRight']}
            colors={['#f87171', '#60a5fa', '#a78bfa', '#fb923c', '#34d399']}
            names={['מותניים', 'חזה', 'ירכיים', 'זרוע', 'ירך']}
          />
        </div>
      )}

      {weights.length === 0 && foods.length === 0 && exercises.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>אין עדיין נתונים להציג</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>התחל לתעד משקל, תזונה ואימונים כדי לראות את הסטטיסטיקות שלך</p>
        </div>
      )}
    </div>
  );
}
