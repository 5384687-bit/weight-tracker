'use client';

import { useEffect, useState, useRef } from 'react';
import { UtensilsCrossed, Plus, Trash2, ChevronRight, ChevronLeft, Search, X, BookOpen, Save, Star, Edit3, Calendar, PieChart } from 'lucide-react';
import { getFoodEntries, saveFoodEntry, deleteFoodEntry, generateId, getActiveProfileId, getMealPresets, saveMealPreset, deleteMealPreset } from '../lib/storage';
import { FoodEntry, MealPreset } from '../lib/types';
import { foodDatabase, foodCategories, FoodItem } from '../lib/foods';
import { toHebrewDate } from '../lib/hebrew-date';
import Link from 'next/link';

function foodHealth(food: FoodItem): { level: 'good' | 'ok' | 'bad'; border: string; bg: string; dot: string } {
  const fatPct = food.calories > 0 ? (food.fat * 9) / food.calories : 0;
  const proteinPct = food.calories > 0 ? (food.protein * 4) / food.calories : 0;
  if (food.calories <= 180 && fatPct < 0.35 && proteinPct >= 0.15)
    return { level: 'good', border: 'border-green-300', bg: 'bg-green-50', dot: '🟢' };
  if (food.calories >= 300 || fatPct > 0.5)
    return { level: 'bad', border: 'border-red-300', bg: 'bg-red-50', dot: '🔴' };
  return { level: 'ok', border: 'border-amber-300', bg: 'bg-amber-50', dot: '🟡' };
}

const mealLabels: Record<string, string> = {
  breakfast: '🌅 ארוחת בוקר',
  lunch: '☀️ ארוחת צהריים',
  dinner: '🌙 ארוחת ערב',
  snack: '🍎 חטיף',
};
const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

const dayNames: Record<number, string> = { 0: 'א׳', 1: 'ב׳', 2: 'ג׳', 3: 'ד׳', 4: 'ה׳', 5: 'ו׳', 6: 'ש׳' };
const mealLabelsShort: Record<string, string> = {
  breakfast: '🌅 בוקר', lunch: '☀️ צהריים', dinner: '🌙 ערב', snack: '🍎 חטיף',
};

function PresetEditor({ preset, onSave, onClose }: {
  preset: MealPreset;
  onSave: (p: MealPreset) => void;
  onClose: () => void;
}) {
  const [p, setP] = useState<MealPreset>(preset);
  const [search, setSearch] = useState('');

  const filtered = foodDatabase.filter(f => !search || f.name.includes(search)).slice(0, 20);

  const addItem = (food: typeof foodDatabase[0]) => {
    setP(prev => ({ ...prev, items: [...prev.items, { description: `${food.emoji} ${food.name}`, calories: food.calories, protein: food.protein, fat: food.fat, carbs: food.carbs }] }));
  };

  const removeItem = (idx: number) => {
    setP(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const toggleDay = (day: number) => {
    if (p.days === 'daily') {
      setP(prev => ({ ...prev, days: [day] }));
    } else {
      const days = p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day];
      setP(prev => ({ ...prev, days: days.length === 7 ? 'daily' : days.length === 0 ? 'daily' : days }));
    }
  };

  const totalCals = p.items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = p.items.reduce((s, i) => s + (i.protein || 0), 0);
  const totalFat = p.items.reduce((s, i) => s + (i.fat || 0), 0);
  const totalCarbs = p.items.reduce((s, i) => s + (i.carbs || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ direction: 'rtl' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">{preset.name ? 'עריכת ארוחה קבועה' : 'ארוחה קבועה חדשה'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם הארוחה <span className="text-xs text-gray-400 font-normal">(אופציונלי - ייווצר אוטומטית)</span></label>
            <input type="text" value={p.name} onChange={e => setP(prev => ({ ...prev, name: e.target.value }))}
              placeholder="למשל: ארוחת בוקר בריאה" className="border rounded-lg px-3 py-2 w-full text-gray-800" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג ארוחה</label>
            <div className="flex flex-wrap gap-2">
              {mealOrder.map(m => (
                <button key={m} onClick={() => setP(prev => ({ ...prev, meal: m as MealPreset['meal'] }))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${p.meal === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {mealLabelsShort[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={14} className="inline ml-1" />
              מתי להציע?
            </label>
            <div className="flex gap-2 items-center mb-2">
              <button onClick={() => setP(prev => ({ ...prev, days: 'daily' }))}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${p.days === 'daily' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                כל יום
              </button>
              <span className="text-xs text-gray-400">או בחר ימים:</span>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <button key={day} onClick={() => toggleDay(day)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                    p.days === 'daily' || (Array.isArray(p.days) && p.days.includes(day))
                      ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {dayNames[day]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              פריטים בארוחה ({p.items.length} | {totalCals} {"קל'"})
            </label>
            {p.items.length > 0 && (
              <div className="flex gap-3 mb-2 text-xs">
                <span className="text-blue-600 font-medium">ח: {totalProtein}g</span>
                <span className="text-amber-600 font-medium">ש: {totalFat}g</span>
                <span className="text-green-600 font-medium">פ: {totalCarbs}g</span>
              </div>
            )}
            {p.items.length === 0 ? (
              <p className="text-gray-400 text-sm bg-gray-50 rounded-lg p-3 text-center">חפש והוסף פריטים מלמטה</p>
            ) : (
              <div className="space-y-1.5 mb-2">
                {p.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-800">{item.description}</span>
                      <span className="text-xs text-orange-600 mr-2">{item.calories} {"קל'"}</span>
                      {(item.protein || item.fat || item.carbs) && (
                        <p className="text-xs text-gray-400">ח:{item.protein || 0}g | ש:{item.fat || 0}g | פ:{item.carbs || 0}g</p>
                      )}
                    </div>
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הוסף פריטים מהמאגר</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 חפש מאכל להוספה..." className="border rounded-lg px-3 py-2 w-full text-sm text-gray-800 mb-2" />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.map((food, i) => (
                <button key={i} onClick={() => addItem(food)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-green-50 border text-right transition-colors text-sm">
                  <span className="text-lg">{food.emoji}</span>
                  <span className="flex-1 text-gray-800">{food.name}</span>
                  <span className="text-xs text-gray-400">{food.portion}</span>
                  <span className="text-xs font-bold text-orange-600">{food.calories}</span>
                  <Plus size={14} className="text-green-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button onClick={() => {
              if (p.items.length === 0) return;
              const name = p.name.trim() || `${mealLabelsShort[p.meal]} - ${p.items.map(i => i.description.replace(/^[^\s]+\s/, '')).join(', ')}`;
              onSave({ ...p, name });
            }}
            disabled={p.items.length === 0}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
            <Save size={16} /> שמור ארוחה קבועה
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">ביטול</button>
        </div>
      </div>
    </div>
  );
}

function PresetsList({ presets, currentMeal, currentDay, onLoad, onEdit, onDelete }: {
  presets: MealPreset[];
  currentMeal: string;
  currentDay: number;
  onLoad: (p: MealPreset) => void;
  onEdit: (p: MealPreset) => void;
  onDelete: (id: string) => void;
}) {
  const mealPresets = presets.filter(p => (p.meal || 'breakfast') === currentMeal);
  const suggested = mealPresets.filter(p => {
    const days = p.days || 'daily';
    if (days === 'daily') return true;
    return (days as number[]).includes(currentDay);
  });
  const others = mealPresets.filter(p => !suggested.includes(p));
  const otherMealPresets = presets.filter(p => (p.meal || 'breakfast') !== currentMeal);

  return (
    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
      {presets.length === 0 ? (
        <p className="text-amber-600 text-sm text-center py-2">
          אין ארוחות קבועות עדיין. לחץ &quot;צור ארוחה קבועה חדשה&quot; כדי ליצור.
        </p>
      ) : (
        <div className="space-y-3">
          {suggested.length > 0 && (
            <div>
              <h3 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-1">
                <Star size={14} /> מומלצות עכשיו
              </h3>
              <div className="space-y-2">
                {suggested.map(preset => (
                  <PresetCard key={preset.id} preset={preset} onLoad={onLoad} onEdit={onEdit} onDelete={onDelete} highlighted />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              {suggested.length > 0 && <h3 className="font-semibold text-gray-600 text-sm mb-2 mt-2">ארוחות נוספות ל{mealLabelsShort[currentMeal]}</h3>}
              <div className="space-y-2">
                {others.map(preset => (
                  <PresetCard key={preset.id} preset={preset} onLoad={onLoad} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
          {mealPresets.length === 0 && otherMealPresets.length > 0 && (
            <p className="text-amber-600 text-sm text-center py-2">
              אין ארוחות קבועות ל{mealLabelsShort[currentMeal]}. יש {otherMealPresets.length} ארוחות קבועות לסוגי ארוחה אחרים.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PresetCard({ preset, onLoad, onEdit, onDelete, highlighted }: {
  preset: MealPreset;
  onLoad: (p: MealPreset) => void;
  onEdit: (p: MealPreset) => void;
  onDelete: (id: string) => void;
  highlighted?: boolean;
}) {
  const days = preset.days || 'daily';
  const meal = preset.meal || 'breakfast';
  const daysText = days === 'daily' ? 'כל יום' : (days as number[]).map(d => dayNames[d]).join(', ');
  const totalCals = preset.items.reduce((s, i) => s + i.calories, 0);
  const totalP = preset.items.reduce((s, i) => s + (i.protein || 0), 0);
  const totalF = preset.items.reduce((s, i) => s + (i.fat || 0), 0);
  const totalC = preset.items.reduce((s, i) => s + (i.carbs || 0), 0);
  const hasMacros = totalP > 0 || totalF > 0 || totalC > 0;
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${highlighted ? 'bg-amber-100 border-amber-300' : 'bg-white border-gray-200'}`}>
      <button onClick={() => onLoad({ ...preset, meal, days })} className="flex-1 text-right hover:opacity-80 transition-opacity">
        <p className="font-medium text-gray-800 text-sm">{preset.name}</p>
        <p className="text-xs text-gray-500">
          {mealLabelsShort[meal]} | {preset.items.length} פריטים | {totalCals} {"קל'"} | {daysText}
        </p>
        {hasMacros && (
          <p className="text-xs mt-0.5">
            <span className="text-blue-500">ח:{totalP}g</span>{' '}
            <span className="text-amber-500">ש:{totalF}g</span>{' '}
            <span className="text-green-500">פ:{totalC}g</span>
          </p>
        )}
      </button>
      <button onClick={() => onEdit(preset)} className="text-blue-400 hover:text-blue-600 p-1"><Edit3 size={14} /></button>
      <button onClick={() => onDelete(preset.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
    </div>
  );
}

function FoodSidebar({ onSelect, searchQuery, setSearchQuery, searchCategory, setSearchCategory }: {
  onSelect: (food: typeof foodDatabase[0]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchCategory: string;
  setSearchCategory: (c: string) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredFoods = foodDatabase.filter(f => {
    if (searchCategory !== 'הכל' && f.category !== searchCategory) return false;
    if (searchQuery && !f.name.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-3">
          <BookOpen size={20} className="text-green-600" /> מאגר מזון
        </h2>
        <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 חפש מאכל..." className="border rounded-lg px-3 py-2 w-full text-gray-800 text-sm mb-3" />
        <div className="flex flex-wrap gap-1.5">
          {foodCategories.map(c => (
            <button key={c} onClick={() => setSearchCategory(c)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${searchCategory === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {filteredFoods.map((food, i) => (
          <button key={i} onClick={() => onSelect(food)}
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg ${foodHealth(food).bg} hover:opacity-80 ${foodHealth(food).border} border text-right transition-colors group`}>
            <span className="text-2xl flex-shrink-0 w-9 text-center">{food.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">{foodHealth(food).dot} {food.name}</p>
              <p className="text-xs text-gray-400">{food.portion}</p>
              <p className="text-xs text-gray-400">ח:{food.protein}g | ש:{food.fat}g | פ:{food.carbs}g</p>
            </div>
            <div className="flex-shrink-0 text-left">
              <span className="text-sm font-bold text-orange-600">{food.calories}</span>
              <p className="text-xs text-gray-400">{"קל'"}</p>
            </div>
          </button>
        ))}
        {filteredFoods.length === 0 && (
          <p className="text-gray-400 text-center py-8 text-sm">לא נמצאו תוצאות</p>
        )}
      </div>
      <div className="p-3 border-t bg-gray-50 rounded-b-xl">
        <p className="text-xs text-gray-400 text-center">
          {filteredFoods.length} מאכלים | לחץ להוספה מהירה
        </p>
      </div>
    </div>
  );
}

export default function FoodPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [meal, setMeal] = useState<FoodEntry['meal']>('breakfast');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('הכל');
  const [suggestions, setSuggestions] = useState<typeof foodDatabase>([]);
  const [presets, setPresets] = useState<MealPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [editingPreset, setEditingPreset] = useState<MealPreset | null>(null);
  const [presetSearch, setPresetSearch] = useState('');

  useEffect(() => {
    const pid = getActiveProfileId();
    setProfileId(pid);
    if (pid) {
      setEntries(getFoodEntries(pid));
      setPresets(getMealPresets(pid));
    }
  }, []);

  useEffect(() => {
    if (description.length >= 2) {
      const matches = foodDatabase.filter(f =>
        f.name.includes(description)
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [description]);

  const handleAdd = () => {
    if (!description || !profileId) return;
    const match = foodDatabase.find(f => f.name === description || description.includes(f.name));
    const entry: FoodEntry = {
      id: generateId(), profileId, date: selectedDate, meal, description,
      calories: calories ? parseInt(calories) : undefined,
      protein: match?.protein,
      fat: match?.fat,
      carbs: match?.carbs,
    };
    saveFoodEntry(entry);
    setEntries(getFoodEntries(profileId));
    setDescription('');
    setCalories('');
    setSuggestions([]);
  };

  const handleSelectFood = (food: typeof foodDatabase[0]) => {
    setDescription(food.name);
    setCalories(String(food.calories));
    setSuggestions([]);
  };

  const handleSelectFromBrowser = (food: typeof foodDatabase[0]) => {
    if (!profileId) return;
    const entry: FoodEntry = {
      id: generateId(), profileId, date: selectedDate, meal,
      description: `${food.emoji} ${food.name} (${food.portion})`,
      calories: food.calories,
      protein: food.protein,
      fat: food.fat,
      carbs: food.carbs,
    };
    saveFoodEntry(entry);
    setEntries(getFoodEntries(profileId));
  };

  const handleDelete = (id: string) => {
    deleteFoodEntry(id);
    if (profileId) setEntries(getFoodEntries(profileId));
  };

  const handleOpenNewPreset = () => {
    if (!profileId) return;
    setEditingPreset({
      id: generateId(), profileId, name: '', meal, days: 'daily', items: [],
    });
  };

  const handleSavePresetFromCurrent = () => {
    if (!profileId) return;
    const currentMealEntries = entries.filter(e => e.date === selectedDate && e.meal === meal);
    if (currentMealEntries.length === 0) return;
    setEditingPreset({
      id: generateId(), profileId,
      name: '',
      meal,
      days: 'daily',
      items: currentMealEntries.map(e => ({ description: e.description, calories: e.calories || 0, protein: e.protein, fat: e.fat, carbs: e.carbs })),
    });
  };

  const handleLoadPreset = (preset: MealPreset) => {
    if (!profileId) return;
    for (const item of preset.items) {
      const entry: FoodEntry = {
        id: generateId(), profileId, date: selectedDate, meal: preset.meal,
        description: item.description, calories: item.calories,
        protein: item.protein, fat: item.fat, carbs: item.carbs,
      };
      saveFoodEntry(entry);
    }
    setEntries(getFoodEntries(profileId));
    setShowPresets(false);
  };

  const handleEditPreset = (preset: MealPreset) => {
    setEditingPreset({ ...preset, meal: preset.meal || 'breakfast', days: preset.days || 'daily' });
  };

  const handleDeletePreset = (id: string) => {
    deleteMealPreset(id);
    if (profileId) setPresets(getMealPresets(profileId));
  };

  if (!profileId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-6"><UtensilsCrossed className="text-green-500" /> יומן תזונה</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <p className="text-yellow-800 text-lg mb-3">צור פרופיל קודם</p>
          <Link href="/profiles" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">צור פרופיל</Link>
        </div>
      </div>
    );
  }

  const dayEntries = entries.filter(e => e.date === selectedDate);
  const totalCalories = dayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const totalProtein = dayEntries.reduce((sum, e) => sum + (e.protein || 0), 0);
  const totalFat = dayEntries.reduce((sum, e) => sum + (e.fat || 0), 0);
  const totalCarbs = dayEntries.reduce((sum, e) => sum + (e.carbs || 0), 0);
  const totalMacroGrams = totalProtein + totalFat + totalCarbs;
  const proteinPct = totalMacroGrams > 0 ? Math.round((totalProtein / totalMacroGrams) * 100) : 0;
  const fatPct = totalMacroGrams > 0 ? Math.round((totalFat / totalMacroGrams) * 100) : 0;
  const carbsPct = totalMacroGrams > 0 ? Math.round((totalCarbs / totalMacroGrams) * 100) : 0;

  const getMacroScore = () => {
    if (totalMacroGrams === 0) return null;
    const proteinOk = proteinPct >= 15 && proteinPct <= 35;
    const fatOk = fatPct >= 20 && fatPct <= 35;
    const carbsOk = carbsPct >= 40 && carbsPct <= 60;
    const score = [proteinOk, fatOk, carbsOk].filter(Boolean).length;
    if (score === 3) return { label: 'מצוין! 💚', color: 'text-green-600', bg: 'bg-green-50', desc: 'חלוקת המאקרו מאוזנת ובריאה' };
    if (score === 2) return { label: 'טוב 💛', color: 'text-yellow-600', bg: 'bg-yellow-50', desc: 'כמעט מאוזן, ניתן לשפר' };
    return { label: 'לא מאוזן 🔴', color: 'text-red-600', bg: 'bg-red-50', desc: 'חלוקת המאקרו רחוקה מהמומלץ' };
  };
  const macroScore = getMacroScore();

  const currentDay = new Date(selectedDate).getDay();
  const suggestedPresets = presets.filter(p => {
    const pMeal = p.meal || 'breakfast';
    const pDays = p.days || 'daily';
    if (pMeal !== meal) return false;
    if (pDays === 'daily') return true;
    return (pDays as number[]).includes(currentDay);
  });

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <UtensilsCrossed className="text-green-500" /> יומן תזונה
        </h1>
        <button onClick={() => setShowSidebar(!showSidebar)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${showSidebar ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
          <BookOpen size={18} /> {showSidebar ? 'הסתר מאגר' : 'הצג מאגר מזון'}
        </button>
      </div>

      <div className={`flex gap-6 ${showSidebar ? '' : ''}`} style={{ direction: 'rtl' }}>
        {/* Main content */}
        <div className={`space-y-6 ${showSidebar ? 'flex-1 min-w-0' : 'w-full max-w-4xl mx-auto'}`}>
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <h2 className="font-bold text-lg mb-4">הוסף ארוחה</h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {mealOrder.map(m => (
                  <button key={m} onClick={() => setMeal(m as FoodEntry['meal'])}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${meal === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {mealLabels[m]}
                  </button>
                ))}
              </div>
              {suggestedPresets.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <p className="text-xs font-medium text-amber-700 mb-1.5 flex items-center gap-1"><Star size={12} /> ארוחות קבועות ל{mealLabels[meal].split(' ').pop()}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPresets.map(preset => {
                      const pCals = preset.items.reduce((s, i) => s + i.calories, 0);
                      const pP = preset.items.reduce((s, i) => s + (i.protein || 0), 0);
                      const pF = preset.items.reduce((s, i) => s + (i.fat || 0), 0);
                      const pC = preset.items.reduce((s, i) => s + (i.carbs || 0), 0);
                      return (
                        <button key={preset.id} onClick={() => handleLoadPreset(preset)}
                          className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm hover:bg-amber-100 transition-colors text-right">
                          <span className="font-medium text-gray-800">{preset.name}</span>
                          <span className="text-xs text-orange-600 mr-1">({pCals} {"קל'"})</span>
                          {(pP > 0 || pF > 0 || pC > 0) && (
                            <p className="text-xs"><span className="text-blue-500">ח:{pP}g</span> <span className="text-amber-500">ש:{pF}g</span> <span className="text-green-500">פ:{pC}g</span></p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px] relative">
                  <label className="block text-sm text-gray-600 mb-1">מה אכלת?</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="התחל להקליד ותקבל הצעות..." className="border rounded-lg px-3 py-2 w-full text-gray-800"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full right-0 left-0 bg-white border rounded-lg shadow-lg z-10 mt-1">
                      {suggestions.map((food, i) => (
                        <button key={i} onClick={() => handleSelectFood(food)}
                          className={`w-full text-right px-3 py-2 hover:opacity-80 flex items-center justify-between border-b last:border-b-0 ${foodHealth(food).bg}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{food.emoji}</span>
                            <div>
                              <span className="text-sm font-medium text-gray-800">{foodHealth(food).dot} {food.name}</span>
                              <span className="text-xs text-gray-500 mr-1">({food.portion})</span>
                              <p className="text-xs text-gray-400">ח:{food.protein}g | ש:{food.fat}g | פ:{food.carbs}g</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-orange-600">{food.calories} {"קל'"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">קלוריות</label>
                  <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="350" className="border rounded-lg px-3 py-2 w-28 text-gray-800" />
                </div>
                <button onClick={handleAdd} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                  <Plus size={18} /> הוסף
                </button>
              </div>
              <p className="text-xs text-gray-400">התחל להקליד שם מאכל ותקבל הצעות אוטומטיות עם קלוריות. או בחר מהמאגר בצד.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => setShowPresets(!showPresets)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${showPresets ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}`}>
                  <Star size={14} /> ארוחות קבועות
                </button>
                <button onClick={handleOpenNewPreset}
                  className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">
                  <Plus size={14} /> צור ארוחה קבועה חדשה
                </button>
                {dayEntries.filter(e => e.meal === meal).length > 0 && (
                  <button onClick={handleSavePresetFromCurrent}
                    className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
                    <Save size={14} /> שמור ארוחה נוכחית כקבועה
                  </button>
                )}
              </div>
              {showPresets && (
                <PresetsList
                  presets={presets}
                  currentMeal={meal}
                  currentDay={new Date(selectedDate).getDay()}
                  onLoad={handleLoadPreset}
                  onEdit={handleEditPreset}
                  onDelete={handleDeletePreset}
                />
              )}
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
                {totalCalories > 0 && <p className="text-sm text-gray-500">{"סה\"כ"}: {totalCalories} קלוריות</p>}
              </div>
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
            </div>

            {mealOrder.map(m => {
              const mealEntries = dayEntries.filter(e => e.meal === m);
              if (mealEntries.length === 0) return null;
              return (
                <div key={m} className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">{mealLabels[m]}</h3>
                  <div className="space-y-2">
                    {mealEntries.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800">{entry.description}</p>
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            {entry.calories != null && <span className="text-xs text-orange-600 font-medium">{entry.calories} {"קל'"}</span>}
                            {entry.protein != null && <span className="text-xs text-blue-500">ח: {entry.protein}g</span>}
                            {entry.fat != null && <span className="text-xs text-amber-500">ש: {entry.fat}g</span>}
                            {entry.carbs != null && <span className="text-xs text-green-500">פ: {entry.carbs}g</span>}
                          </div>
                        </div>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {dayEntries.length === 0 && <p className="text-gray-500 text-center py-8">אין רשומות ליום הזה. הוסף את מה שאכלת!</p>}
          </div>

          {/* Macros Summary */}
          {totalMacroGrams > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-purple-500" /> סיכום מאקרו יומי
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{totalProtein}g</p>
                  <p className="text-sm text-blue-500">חלבון</p>
                  <p className="text-xs text-gray-400">{proteinPct}% (מומלץ 15-35%)</p>
                  <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                    <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, proteinPct * 2)}%` }} />
                  </div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{totalFat}g</p>
                  <p className="text-sm text-amber-500">שומן</p>
                  <p className="text-xs text-gray-400">{fatPct}% (מומלץ 20-35%)</p>
                  <div className="w-full bg-amber-100 rounded-full h-2 mt-1">
                    <div className="bg-amber-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, fatPct * 2)}%` }} />
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{totalCarbs}g</p>
                  <p className="text-sm text-green-500">פחמימות</p>
                  <p className="text-xs text-gray-400">{carbsPct}% (מומלץ 40-60%)</p>
                  <div className="w-full bg-green-100 rounded-full h-2 mt-1">
                    <div className="bg-green-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, carbsPct * 1.7)}%` }} />
                  </div>
                </div>
              </div>
              {/* Visual bar */}
              <div className="flex rounded-full h-4 overflow-hidden mb-3">
                {proteinPct > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${proteinPct}%` }} />}
                {fatPct > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${fatPct}%` }} />}
                {carbsPct > 0 && <div className="bg-green-500 transition-all" style={{ width: `${carbsPct}%` }} />}
              </div>
              <div className="flex justify-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> חלבון {proteinPct}%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> שומן {fatPct}%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> פחמימות {carbsPct}%</span>
              </div>
              {macroScore && (
                <div className={`${macroScore.bg} rounded-lg p-3 text-center`}>
                  <p className={`font-bold ${macroScore.color}`}>{macroScore.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{macroScore.desc}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - food database */}
        {showSidebar && (
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-4">
              <FoodSidebar
                onSelect={handleSelectFromBrowser}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchCategory={searchCategory}
                setSearchCategory={setSearchCategory}
              />
            </div>
          </div>
        )}
      </div>

      {/* Preset Editor Modal */}
      {editingPreset && (
        <PresetEditor
          preset={editingPreset}
          onSave={(p) => {
            if (!profileId) return;
            saveMealPreset(p);
            setPresets(getMealPresets(profileId));
            setEditingPreset(null);
          }}
          onClose={() => setEditingPreset(null)}
        />
      )}

      {/* Mobile food browser - shows as modal on small screens */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <BookOpen size={20} className="text-green-600" /> מאגר מזון
              </h2>
              <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
            </div>
            <div className="p-4 border-b">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 חפש מאכל..." className="border rounded-lg px-3 py-2 w-full text-gray-800 text-sm mb-3" />
              <div className="flex flex-wrap gap-1.5">
                {foodCategories.map(c => (
                  <button key={c} onClick={() => setSearchCategory(c)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${searchCategory === c ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {foodDatabase.filter(f => {
                if (searchCategory !== 'הכל' && f.category !== searchCategory) return false;
                if (searchQuery && !f.name.includes(searchQuery)) return false;
                return true;
              }).map((food, i) => (
                <button key={i} onClick={() => { handleSelectFromBrowser(food); }}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-lg ${foodHealth(food).bg} hover:opacity-80 ${foodHealth(food).border} border text-right transition-colors`}>
                  <span className="text-2xl flex-shrink-0 w-9 text-center">{food.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{foodHealth(food).dot} {food.name}</p>
                    <p className="text-xs text-gray-400">{food.portion}</p>
                    <p className="text-xs text-gray-400">ח:{food.protein}g | ש:{food.fat}g | פ:{food.carbs}g</p>
                  </div>
                  <span className="text-sm font-bold text-orange-600 flex-shrink-0">{food.calories} {"קל'"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
