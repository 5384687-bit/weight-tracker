'use client';

import { useEffect, useState } from 'react';
import { Droplets, Plus, Minus, Save, Trash2, Star, X } from 'lucide-react';
import { getWaterEntries, saveWaterEntry, getActiveProfileId, getWaterPresets, saveWaterPreset, deleteWaterPreset, generateId } from '../lib/storage';
import { WaterEntry, WaterPreset } from '../lib/types';
import { toHebrewDate, toHebrewDateFromDate } from '../lib/hebrew-date';
import Link from 'next/link';

export default function WaterPage() {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [presets, setPresets] = useState<WaterPreset[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showNewPreset, setShowNewPreset] = useState(false);
  const [showPresetsSection, setShowPresetsSection] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetGlasses, setPresetGlasses] = useState('2');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const pid = getActiveProfileId();
    setProfileId(pid);
    if (pid) {
      setEntries(getWaterEntries(pid));
      setPresets(getWaterPresets(pid));
    }
  }, []);

  if (!profileId) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-6"><Droplets className="text-cyan-500" /> מעקב מים</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל קודם</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">צור פרופיל</Link>
        </div>
      </div>
    );
  }

  const todayEntry = entries.find(e => e.date === today);
  const glasses = todayEntry?.glasses || 0;
  const goal = 8;
  const percentage = Math.min(100, (glasses / goal) * 100);

  const updateGlasses = (amount: number) => {
    const newGlasses = Math.max(0, glasses + amount);
    saveWaterEntry({ profileId, date: today, glasses: newGlasses });
    setEntries(getWaterEntries(profileId));
  };

  const handleLoadPreset = (preset: WaterPreset) => {
    updateGlasses(preset.glasses);
  };

  const handleSavePreset = () => {
    if (!presetName.trim() || !presetGlasses) return;
    saveWaterPreset({
      id: generateId(),
      profileId,
      name: presetName.trim(),
      glasses: parseInt(presetGlasses),
    });
    setPresets(getWaterPresets(profileId));
    setPresetName('');
    setPresetGlasses('2');
    setShowNewPreset(false);
  };

  const handleDeletePreset = (id: string) => {
    deleteWaterPreset(id);
    setPresets(getWaterPresets(profileId));
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = entries.find(e => e.date === dateStr);
    return { date: d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric' }), hebrewDate: toHebrewDateFromDate(d), glasses: entry?.glasses || 0 };
  }).reverse();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Droplets className="text-cyan-500" /> מעקב מים
        </h1>
        <p className="text-sm text-purple-500 mt-1">{toHebrewDate(today)}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 border text-center">
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#06b6d4" strokeWidth="8"
              strokeDasharray={`${percentage * 2.83} ${283 - percentage * 2.83}`} strokeLinecap="round" className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="text-cyan-500 mb-1" size={28} />
            <p className="text-3xl font-bold text-gray-800">{glasses}</p>
            <p className="text-sm text-gray-500">מתוך {goal}</p>
          </div>
        </div>

        {glasses >= goal ? (
          <p className="text-lg font-bold text-green-600 mb-4">🎉 מצוין! הגעת ליעד היומי!</p>
        ) : (
          <p className="text-gray-600 mb-4">חסרות עוד {goal - glasses} כוסות להגיע ליעד</p>
        )}

        <div className="flex items-center justify-center gap-6 mb-6">
          <button onClick={() => updateGlasses(-1)} className="bg-gray-100 hover:bg-gray-200 p-4 rounded-full transition-colors">
            <Minus size={24} className="text-gray-600" />
          </button>
          <button onClick={() => updateGlasses(1)} className="bg-cyan-500 hover:bg-cyan-600 p-6 rounded-full transition-colors shadow-lg">
            <Plus size={32} className="text-white" />
          </button>
          <div className="p-4 invisible"><Minus size={24} /></div>
        </div>

        {/* Water Presets */}
        {presets.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-600 mb-3 flex items-center justify-center gap-1"><Star size={14} className="text-amber-500" /> שתייה קבועה</p>
            <div className="flex flex-wrap justify-center gap-2">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center gap-1">
                  <button onClick={() => handleLoadPreset(preset)}
                    className="px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-lg text-sm hover:bg-cyan-100 transition-colors flex items-center gap-2">
                    <Droplets size={14} className="text-cyan-500" />
                    <span className="font-medium text-gray-800">{preset.name}</span>
                    <span className="text-xs text-cyan-600">+{preset.glasses} כוסות</span>
                  </button>
                  <button onClick={() => handleDeletePreset(preset.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Manage Presets */}
      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <button onClick={() => setShowPresetsSection(!showPresetsSection)}
          className="w-full flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2"><Star size={18} className="text-amber-500" /> שתייה קבועה</h2>
          <span className="text-gray-400 text-sm">{showPresetsSection ? '▲ הסתר' : '▼ הצג'}</span>
        </button>

        {showPresetsSection && (
        <div className="mt-4 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowNewPreset(!showNewPreset)}
            className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors ${showNewPreset ? 'bg-gray-200 text-gray-700' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'}`}>
            {showNewPreset ? <><X size={14} /> ביטול</> : <><Plus size={14} /> הוסף שגרת שתייה</>}
          </button>
        </div>

        {showNewPreset && (
          <div className="bg-cyan-50 rounded-lg p-4 mb-4 border border-cyan-200" style={{ direction: 'rtl' }}>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm text-gray-600 mb-1">שם</label>
                <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)}
                  placeholder="למשל: לפני שחרית" className="border rounded-lg px-3 py-2 w-full text-gray-800 text-sm" />
              </div>
              <div className="w-28">
                <label className="block text-sm text-gray-600 mb-1">כמה כוסות</label>
                <input type="number" min="1" max="10" value={presetGlasses} onChange={e => setPresetGlasses(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full text-gray-800 text-sm" />
              </div>
              <button onClick={handleSavePreset} disabled={!presetName.trim()}
                className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <Save size={14} /> שמור
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">צור שגרת שתייה קבועה שתוכל להפעיל בלחיצה אחת. למשל: &quot;לפני שחרית - 2 כוסות&quot;, &quot;לפני ארוחת בוקר - 2 כוסות&quot;</p>
          </div>
        )}

        {presets.length === 0 && !showNewPreset && (
          <p className="text-gray-400 text-sm text-center py-3">אין שגרות שתייה. לחץ &quot;הוסף שגרת שתייה&quot; כדי ליצור.</p>
        )}

        {presets.length > 0 && !showNewPreset && (
          <div className="space-y-2">
            {presets.map(preset => (
              <div key={preset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Droplets size={18} className="text-cyan-500" />
                  <div>
                    <p className="font-medium text-gray-800">{preset.name}</p>
                    <p className="text-xs text-gray-400">{preset.glasses} כוסות</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleLoadPreset(preset)}
                    className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-sm hover:bg-cyan-200 transition-colors">
                    + הוסף
                  </button>
                  <button onClick={() => handleDeletePreset(preset.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border">
        <h2 className="font-bold text-lg mb-4">7 ימים אחרונים</h2>
        <div className="flex items-end justify-between gap-2 h-40">
          {last7Days.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{day.glasses}</span>
              <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                <div className={`absolute bottom-0 w-full rounded-t-lg transition-all ${day.glasses >= goal ? 'bg-cyan-500' : 'bg-cyan-300'}`}
                  style={{ height: `${Math.min(100, (day.glasses / goal) * 100)}%` }} />
              </div>
              <span className="text-xs text-gray-500">{day.date}</span>
              <span className="text-[10px] text-purple-400">{day.hebrewDate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
