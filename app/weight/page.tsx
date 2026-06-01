'use client';

import { useEffect, useState } from 'react';
import { Scale, Plus, Trash2, LineChart as LineChartIcon, BarChart2, TrendingUp, CandlestickChart as CandlestickIcon } from 'lucide-react';
import { getWeightEntries, saveWeightEntry, deleteWeightEntry, generateId, getActiveProfileId, getActiveProfile } from '../lib/storage';
import { WeightEntry } from '../lib/types';
import { calculateBMI, getBMICategory } from '../lib/bmi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  AreaChart, Area, BarChart, Bar, ComposedChart, useXAxisScale, useYAxisScale,
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

interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

function CandlestickLayer({ data }: { data: OHLCData[] }) {
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
        const color = isDown ? '#22c55e' : d.close > d.open ? '#ef4444' : '#6b7280';
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

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ReturnType<typeof getActiveProfile>>(null);
  const [chartType, _setChartType] = useState<ChartType>(() => {
    if (typeof window === 'undefined') return 'line';
    return (localStorage.getItem('chart_weight_page') as ChartType) || 'line';
  });
  const setChartType = (v: ChartType) => { localStorage.setItem('chart_weight_page', v); _setChartType(v); };

  useEffect(() => {
    const pid = getActiveProfileId();
    setProfileId(pid);
    setProfile(getActiveProfile());
    if (pid) setEntries(getWeightEntries(pid));
  }, []);

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const handleAdd = () => {
    if (!weight || !profileId) return;
    const entry: WeightEntry = { id: generateId(), profileId, date, weight: parseFloat(weight) };
    saveWeightEntry(entry);
    setEntries(getWeightEntries(profileId));
    setWeight('');
  };

  const handleDelete = (id: string) => {
    deleteWeightEntry(id);
    if (profileId) setEntries(getWeightEntries(profileId));
  };

  if (!profileId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-6"><Scale className="text-blue-500" /> מעקב משקל שבועי</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל קודם</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">צור פרופיל</Link>
        </div>
      </div>
    );
  }

  const chartData = sorted.map(e => ({
    date: chartDate(e.date),
    weight: e.weight,
  }));

  const avgWeight = entries.length > 0 ? entries.reduce((s, e) => s + e.weight, 0) / entries.length : 0;
  const minWeight = entries.length > 0 ? Math.min(...entries.map(e => e.weight)) : 0;
  const maxWeight = entries.length > 0 ? Math.max(...entries.map(e => e.weight)) : 0;

  const isFriday = new Date().getDay() === 5;
  const todayStr = new Date().toISOString().split('T')[0];
  const weighedToday = entries.some(e => e.date === todayStr);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
        <Scale className="text-blue-500" /> מעקב משקל שבועי
      </h1>

      {isFriday && !weighedToday && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-800 font-semibold">⚖️ היום יום שישי - יום שקילה! אל תשכח להישקל</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="font-bold text-lg mb-4">הוסף שקילה</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">תאריך <span className="text-purple-500">({toHebrewDate(date)})</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-lg px-3 py-2 text-gray-800" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">משקל (ק"ג)</label>
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="80.5" className="border rounded-lg px-3 py-2 w-32 text-gray-800" />
          </div>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus size={18} /> הוסף
          </button>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">גרף משקל</h2>
            <div className="flex gap-1">
              {(['line', 'bar', 'area', 'candle'] as ChartType[]).map(t => {
                const icons: Record<ChartType, React.ReactNode> = {
                  line: <LineChartIcon size={14} />,
                  bar: <BarChart2 size={14} />,
                  area: <TrendingUp size={14} />,
                  candle: <CandlestickIcon size={14} />,
                };
                const labels: Record<ChartType, string> = { line: 'קו', bar: 'עמודות', area: 'שטח', candle: 'נרות' };
                return (
                  <button key={t} onClick={() => setChartType(t)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${chartType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {icons[t]} {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>
          {chartType === 'candle' ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={(() => { const ohlc = weightToOHLC(entries); const allVals = ohlc.flatMap(d => [d.open, d.high, d.low, d.close]); return ohlc.map(d => ({ ...d, _domain: allVals.length ? Math.max(...allVals) : 0 })); })()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[
                  Math.floor(Math.min(...weightToOHLC(entries).flatMap(d => [d.low]))) - 1,
                  Math.ceil(Math.max(...weightToOHLC(entries).flatMap(d => [d.high]))) + 1
                ]} />
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
                <CandlestickLayer data={weightToOHLC(entries)} />
                {profile && <ReferenceLine y={profile.targetWeight} stroke="#22c55e" strokeDasharray="5 5" label={`יעד: ${profile.targetWeight}`} />}
              </ComposedChart>
            </ResponsiveContainer>
          ) : chartType === 'area' ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Area type="monotone" dataKey="weight" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={3} name='משקל (ק"ג)' />
                {profile && <ReferenceLine y={profile.targetWeight} stroke="#22c55e" strokeDasharray="5 5" label={`יעד: ${profile.targetWeight}`} />}
              </AreaChart>
            </ResponsiveContainer>
          ) : chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Bar dataKey="weight" fill="#3b82f6" name='משקל (ק"ג)' radius={[4, 4, 0, 0]} />
                {profile && <ReferenceLine y={profile.targetWeight} stroke="#22c55e" strokeDasharray="5 5" label={`יעד: ${profile.targetWeight}`} />}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} name='משקל (ק"ג)' />
                {profile && <ReferenceLine y={profile.targetWeight} stroke="#22c55e" strokeDasharray="5 5" label={`יעד: ${profile.targetWeight}`} />}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <p className="text-sm text-gray-500">ממוצע</p>
            <p className="text-2xl font-bold text-blue-600">{avgWeight.toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <p className="text-sm text-gray-500">מינימום</p>
            <p className="text-2xl font-bold text-green-600">{minWeight.toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <p className="text-sm text-gray-500">מקסימום</p>
            <p className="text-2xl font-bold text-red-500">{maxWeight.toFixed(1)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="font-bold text-lg mb-4">היסטוריית שקילות</h2>
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין שקילות עדיין. הוסף את השקילה הראשונה שלך!</p>
        ) : (
          <div className="space-y-2">
            {[...sorted].reverse().map(entry => {
              const prev = sorted[sorted.indexOf(entry) - 1];
              const diff = prev ? entry.weight - prev.weight : 0;
              const isFri = new Date(entry.date).getDay() === 5;
              return (
                <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg ${isFri ? 'bg-amber-50' : 'bg-gray-50'} hover:bg-gray-100`}>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm">{new Date(entry.date).toLocaleDateString('he-IL')} <span className="text-purple-400">({toHebrewDate(entry.date)})</span></span>
                    {isFri && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">שישי</span>}
                    <span className="font-bold text-lg">{entry.weight} ק"ג</span>
                    {diff !== 0 && (
                      <span className={`text-sm ${diff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
