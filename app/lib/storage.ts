import { WeightEntry, FoodEntry, ExerciseEntry, WaterEntry, WaterPreset, UserProfile, MeasurementEntry, MealPreset } from './types';
import { supabase } from './supabase';

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Helper: get current user id (non-blocking)
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

// Fire-and-forget cloud write
function cloudSave(fn: () => Promise<unknown>) {
  fn().catch(err => console.error('Cloud sync error:', err));
}

// Profiles
export function getProfiles(): UserProfile[] {
  return getItem<UserProfile[]>('profiles', []);
}

export function saveProfile(profile: UserProfile): void {
  const profiles = getProfiles();
  const existing = profiles.findIndex(p => p.id === profile.id);
  if (existing >= 0) profiles[existing] = profile;
  else profiles.push(profile);
  setItem('profiles', profiles);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('profiles').upsert({
      id: profile.id, user_id: userId, name: profile.name, gender: profile.gender,
      height: profile.height, target_weight: profile.targetWeight,
      start_weight: profile.startWeight, start_date: profile.startDate,
      target_date: profile.targetDate, avatar: profile.avatar || '',
      birth_date: profile.birthDate || null, activity_level: profile.activityLevel || null,
    });
  });
}

export function deleteProfile(id: string): void {
  setItem('profiles', getProfiles().filter(p => p.id !== id));
  setItem('weight_entries', getWeightEntries().filter(e => e.profileId !== id));
  setItem('food_entries', getFoodEntries().filter(e => e.profileId !== id));
  setItem('exercise_entries', getExerciseEntries().filter(e => e.profileId !== id));
  setItem('water_entries', getWaterEntries().filter(e => e.profileId !== id));
  setItem('measurement_entries', getMeasurementEntries().filter(e => e.profileId !== id));
  const active = getActiveProfileId();
  if (active === id) setItem('active_profile_id', null);
  cloudSave(async () => {
    await supabase.from('profiles').delete().eq('id', id);
  });
}

export function getActiveProfileId(): string | null {
  return getItem<string | null>('active_profile_id', null);
}

export function setActiveProfileId(id: string): void {
  setItem('active_profile_id', id);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('user_settings').upsert({ user_id: userId, active_profile_id: id });
  });
}

export function getActiveProfile(): UserProfile | null {
  const id = getActiveProfileId();
  if (!id) return null;
  return getProfiles().find(p => p.id === id) || null;
}

// Weight
export function getWeightEntries(profileId?: string): WeightEntry[] {
  const all = getItem<WeightEntry[]>('weight_entries', []);
  return profileId ? all.filter(e => e.profileId === profileId) : all;
}

export function saveWeightEntry(entry: WeightEntry): void {
  const entries = getItem<WeightEntry[]>('weight_entries', []);
  const existing = entries.findIndex(e => e.id === entry.id);
  if (existing >= 0) entries[existing] = entry;
  else entries.push(entry);
  setItem('weight_entries', entries);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('weight_entries').upsert({
      id: entry.id, profile_id: entry.profileId, user_id: userId,
      date: entry.date, weight: entry.weight,
    });
  });
}

export function deleteWeightEntry(id: string): void {
  setItem('weight_entries', getItem<WeightEntry[]>('weight_entries', []).filter(e => e.id !== id));
  cloudSave(async () => {
    await supabase.from('weight_entries').delete().eq('id', id);
  });
}

// Food
export function getFoodEntries(profileId?: string): FoodEntry[] {
  const all = getItem<FoodEntry[]>('food_entries', []);
  return profileId ? all.filter(e => e.profileId === profileId) : all;
}

export function saveFoodEntry(entry: FoodEntry): void {
  const entries = getItem<FoodEntry[]>('food_entries', []);
  const existing = entries.findIndex(e => e.id === entry.id);
  if (existing >= 0) entries[existing] = entry;
  else entries.push(entry);
  setItem('food_entries', entries);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('food_entries').upsert({
      id: entry.id, profile_id: entry.profileId, user_id: userId,
      date: entry.date, meal: entry.meal, description: entry.description,
      calories: entry.calories ?? null, protein: entry.protein ?? null,
      fat: entry.fat ?? null, carbs: entry.carbs ?? null,
    });
  });
}

export function deleteFoodEntry(id: string): void {
  setItem('food_entries', getItem<FoodEntry[]>('food_entries', []).filter(e => e.id !== id));
  cloudSave(async () => {
    await supabase.from('food_entries').delete().eq('id', id);
  });
}

// Exercise
export function getExerciseEntries(profileId?: string): ExerciseEntry[] {
  const all = getItem<ExerciseEntry[]>('exercise_entries', []);
  return profileId ? all.filter(e => e.profileId === profileId) : all;
}

export function saveExerciseEntry(entry: ExerciseEntry): void {
  const entries = getItem<ExerciseEntry[]>('exercise_entries', []);
  const existing = entries.findIndex(e => e.id === entry.id);
  if (existing >= 0) entries[existing] = entry;
  else entries.push(entry);
  setItem('exercise_entries', entries);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('exercise_entries').upsert({
      id: entry.id, profile_id: entry.profileId, user_id: userId,
      date: entry.date, type: entry.type, duration: entry.duration,
      calories_burned: entry.caloriesBurned ?? null, notes: entry.notes ?? null,
    });
  });
}

export function deleteExerciseEntry(id: string): void {
  setItem('exercise_entries', getItem<ExerciseEntry[]>('exercise_entries', []).filter(e => e.id !== id));
  cloudSave(async () => {
    await supabase.from('exercise_entries').delete().eq('id', id);
  });
}

// Water
export function getWaterEntries(profileId?: string): WaterEntry[] {
  const all = getItem<WaterEntry[]>('water_entries', []);
  return profileId ? all.filter(e => e.profileId === profileId) : all;
}

export function saveWaterEntry(entry: WaterEntry): void {
  const entries = getItem<WaterEntry[]>('water_entries', []);
  const existing = entries.findIndex(e => e.date === entry.date && e.profileId === entry.profileId);
  if (existing >= 0) entries[existing] = entry;
  else entries.push(entry);
  setItem('water_entries', entries);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('water_entries').upsert({
      profile_id: entry.profileId, user_id: userId,
      date: entry.date, glasses: entry.glasses,
    });
  });
}

// Water Presets
export function getWaterPresets(profileId: string): WaterPreset[] {
  return getItem<WaterPreset[]>('water_presets', []).filter(p => p.profileId === profileId);
}

export function saveWaterPreset(preset: WaterPreset): void {
  const presets = getItem<WaterPreset[]>('water_presets', []);
  const idx = presets.findIndex(p => p.id === preset.id);
  if (idx >= 0) presets[idx] = preset;
  else presets.push(preset);
  setItem('water_presets', presets);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('water_presets').upsert({
      id: preset.id, profile_id: preset.profileId, user_id: userId,
      name: preset.name, glasses: preset.glasses,
    });
  });
}

export function deleteWaterPreset(id: string): void {
  setItem('water_presets', getItem<WaterPreset[]>('water_presets', []).filter(p => p.id !== id));
  cloudSave(async () => {
    await supabase.from('water_presets').delete().eq('id', id);
  });
}

// Measurements
export function getMeasurementEntries(profileId?: string): MeasurementEntry[] {
  const all = getItem<MeasurementEntry[]>('measurement_entries', []);
  return profileId ? all.filter(e => e.profileId === profileId) : all;
}

export function saveMeasurementEntry(entry: MeasurementEntry): void {
  const entries = getItem<MeasurementEntry[]>('measurement_entries', []);
  const existing = entries.findIndex(e => e.id === entry.id);
  if (existing >= 0) entries[existing] = entry;
  else entries.push(entry);
  setItem('measurement_entries', entries);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('measurement_entries').upsert({
      id: entry.id, profile_id: entry.profileId, user_id: userId,
      date: entry.date, waist: entry.waist ?? null, chest: entry.chest ?? null,
      hips: entry.hips ?? null, arm_right: entry.armRight ?? null,
      arm_left: entry.armLeft ?? null, thigh_right: entry.thighRight ?? null,
      thigh_left: entry.thighLeft ?? null, neck: entry.neck ?? null,
    });
  });
}

export function deleteMeasurementEntry(id: string): void {
  setItem('measurement_entries', getItem<MeasurementEntry[]>('measurement_entries', []).filter(e => e.id !== id));
  cloudSave(async () => {
    await supabase.from('measurement_entries').delete().eq('id', id);
  });
}

// Meal Presets
export function getMealPresets(profileId?: string): MealPreset[] {
  const all = getItem<MealPreset[]>('meal_presets', []);
  return profileId ? all.filter(e => e.profileId === profileId) : all;
}

export function saveMealPreset(preset: MealPreset): void {
  const presets = getItem<MealPreset[]>('meal_presets', []);
  const existing = presets.findIndex(p => p.id === preset.id);
  if (existing >= 0) presets[existing] = preset;
  else presets.push(preset);
  setItem('meal_presets', presets);
  cloudSave(async () => {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from('meal_presets').upsert({
      id: preset.id, profile_id: preset.profileId, user_id: userId,
      name: preset.name, meal: preset.meal, days: preset.days, items: preset.items,
    });
  });
}

export function deleteMealPreset(id: string): void {
  setItem('meal_presets', getItem<MealPreset[]>('meal_presets', []).filter(p => p.id !== id));
  cloudSave(async () => {
    await supabase.from('meal_presets').delete().eq('id', id);
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
