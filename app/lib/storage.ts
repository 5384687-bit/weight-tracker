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
  // Also delete from Supabase
  supabase.from('profiles').delete().eq('id', id).then(() => {});
}

export function getActiveProfileId(): string | null {
  return getItem<string | null>('active_profile_id', null);
}

export function setActiveProfileId(id: string): void {
  setItem('active_profile_id', id);
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
}

export function deleteWeightEntry(id: string): void {
  setItem('weight_entries', getItem<WeightEntry[]>('weight_entries', []).filter(e => e.id !== id));
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
}

export function deleteFoodEntry(id: string): void {
  setItem('food_entries', getItem<FoodEntry[]>('food_entries', []).filter(e => e.id !== id));
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
}

export function deleteExerciseEntry(id: string): void {
  setItem('exercise_entries', getItem<ExerciseEntry[]>('exercise_entries', []).filter(e => e.id !== id));
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
}

export function deleteWaterPreset(id: string): void {
  setItem('water_presets', getItem<WaterPreset[]>('water_presets', []).filter(p => p.id !== id));
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
}

export function deleteMeasurementEntry(id: string): void {
  setItem('measurement_entries', getItem<MeasurementEntry[]>('measurement_entries', []).filter(e => e.id !== id));
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
}

export function deleteMealPreset(id: string): void {
  setItem('meal_presets', getItem<MealPreset[]>('meal_presets', []).filter(p => p.id !== id));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
