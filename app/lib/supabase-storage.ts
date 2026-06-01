import { supabase } from './supabase';
import { WeightEntry, FoodEntry, ExerciseEntry, WaterEntry, WaterPreset, UserProfile, MeasurementEntry, MealPreset } from './types';

// Helper to get current user id
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

// ============ Profiles ============

export async function getProfiles(): Promise<UserProfile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    name: row.name,
    gender: row.gender,
    height: Number(row.height),
    targetWeight: Number(row.target_weight),
    startWeight: Number(row.start_weight),
    startDate: row.start_date,
    targetDate: row.target_date,
    avatar: row.avatar,
    birthDate: row.birth_date || undefined,
    activityLevel: row.activity_level || undefined,
  }));
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('profiles').upsert({
    id: profile.id,
    user_id: userId,
    name: profile.name,
    gender: profile.gender,
    height: profile.height,
    target_weight: profile.targetWeight,
    start_weight: profile.startWeight,
    start_date: profile.startDate,
    target_date: profile.targetDate,
    avatar: profile.avatar,
    birth_date: profile.birthDate || null,
    activity_level: profile.activityLevel || null,
  });
}

export async function deleteProfile(id: string): Promise<void> {
  await supabase.from('profiles').delete().eq('id', id);
  // Cascade will handle related entries
  const userId = await getUserId();
  if (userId) {
    const { data } = await supabase.from('user_settings').select('active_profile_id').eq('user_id', userId).single();
    if (data?.active_profile_id === id) {
      await supabase.from('user_settings').upsert({ user_id: userId, active_profile_id: null });
    }
  }
}

export async function getActiveProfileId(): Promise<string | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from('user_settings').select('active_profile_id').eq('user_id', userId).single();
  return data?.active_profile_id || null;
}

export async function setActiveProfileId(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('user_settings').upsert({ user_id: userId, active_profile_id: id });
}

export async function getActiveProfile(): Promise<UserProfile | null> {
  const id = await getActiveProfileId();
  if (!id) return null;
  const profiles = await getProfiles();
  return profiles.find(p => p.id === id) || null;
}

// ============ Weight ============

export async function getWeightEntries(profileId?: string): Promise<WeightEntry[]> {
  let query = supabase.from('weight_entries').select('*').order('date', { ascending: false });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data } = await query;
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    date: row.date,
    weight: Number(row.weight),
  }));
}

export async function saveWeightEntry(entry: WeightEntry): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('weight_entries').upsert({
    id: entry.id,
    profile_id: entry.profileId,
    user_id: userId,
    date: entry.date,
    weight: entry.weight,
  });
}

export async function deleteWeightEntry(id: string): Promise<void> {
  await supabase.from('weight_entries').delete().eq('id', id);
}

// ============ Food ============

export async function getFoodEntries(profileId?: string): Promise<FoodEntry[]> {
  let query = supabase.from('food_entries').select('*').order('created_at', { ascending: false });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data } = await query;
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    date: row.date,
    meal: row.meal,
    description: row.description,
    calories: row.calories ?? undefined,
    protein: row.protein != null ? Number(row.protein) : undefined,
    fat: row.fat != null ? Number(row.fat) : undefined,
    carbs: row.carbs != null ? Number(row.carbs) : undefined,
  }));
}

export async function saveFoodEntry(entry: FoodEntry): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('food_entries').upsert({
    id: entry.id,
    profile_id: entry.profileId,
    user_id: userId,
    date: entry.date,
    meal: entry.meal,
    description: entry.description,
    calories: entry.calories ?? null,
    protein: entry.protein ?? null,
    fat: entry.fat ?? null,
    carbs: entry.carbs ?? null,
  });
}

export async function deleteFoodEntry(id: string): Promise<void> {
  await supabase.from('food_entries').delete().eq('id', id);
}

// ============ Exercise ============

export async function getExerciseEntries(profileId?: string): Promise<ExerciseEntry[]> {
  let query = supabase.from('exercise_entries').select('*').order('date', { ascending: false });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data } = await query;
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    date: row.date,
    type: row.type,
    duration: row.duration,
    caloriesBurned: row.calories_burned ?? undefined,
    notes: row.notes ?? undefined,
  }));
}

export async function saveExerciseEntry(entry: ExerciseEntry): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('exercise_entries').upsert({
    id: entry.id,
    profile_id: entry.profileId,
    user_id: userId,
    date: entry.date,
    type: entry.type,
    duration: entry.duration,
    calories_burned: entry.caloriesBurned ?? null,
    notes: entry.notes ?? null,
  });
}

export async function deleteExerciseEntry(id: string): Promise<void> {
  await supabase.from('exercise_entries').delete().eq('id', id);
}

// ============ Water ============

export async function getWaterEntries(profileId?: string): Promise<WaterEntry[]> {
  let query = supabase.from('water_entries').select('*').order('date', { ascending: false });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data } = await query;
  if (!data) return [];
  return data.map(row => ({
    profileId: row.profile_id,
    date: row.date,
    glasses: row.glasses,
  }));
}

export async function saveWaterEntry(entry: WaterEntry): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('water_entries').upsert({
    profile_id: entry.profileId,
    user_id: userId,
    date: entry.date,
    glasses: entry.glasses,
  });
}

// ============ Water Presets ============

export async function getWaterPresets(profileId: string): Promise<WaterPreset[]> {
  const { data } = await supabase.from('water_presets').select('*').eq('profile_id', profileId);
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    glasses: row.glasses,
  }));
}

export async function saveWaterPreset(preset: WaterPreset): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('water_presets').upsert({
    id: preset.id,
    profile_id: preset.profileId,
    user_id: userId,
    name: preset.name,
    glasses: preset.glasses,
  });
}

export async function deleteWaterPreset(id: string): Promise<void> {
  await supabase.from('water_presets').delete().eq('id', id);
}

// ============ Measurements ============

export async function getMeasurementEntries(profileId?: string): Promise<MeasurementEntry[]> {
  let query = supabase.from('measurement_entries').select('*').order('date', { ascending: false });
  if (profileId) query = query.eq('profile_id', profileId);
  const { data } = await query;
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    date: row.date,
    waist: row.waist != null ? Number(row.waist) : undefined,
    chest: row.chest != null ? Number(row.chest) : undefined,
    hips: row.hips != null ? Number(row.hips) : undefined,
    armRight: row.arm_right != null ? Number(row.arm_right) : undefined,
    armLeft: row.arm_left != null ? Number(row.arm_left) : undefined,
    thighRight: row.thigh_right != null ? Number(row.thigh_right) : undefined,
    thighLeft: row.thigh_left != null ? Number(row.thigh_left) : undefined,
    neck: row.neck != null ? Number(row.neck) : undefined,
  }));
}

export async function saveMeasurementEntry(entry: MeasurementEntry): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('measurement_entries').upsert({
    id: entry.id,
    profile_id: entry.profileId,
    user_id: userId,
    date: entry.date,
    waist: entry.waist ?? null,
    chest: entry.chest ?? null,
    hips: entry.hips ?? null,
    arm_right: entry.armRight ?? null,
    arm_left: entry.armLeft ?? null,
    thigh_right: entry.thighRight ?? null,
    thigh_left: entry.thighLeft ?? null,
    neck: entry.neck ?? null,
  });
}

export async function deleteMeasurementEntry(id: string): Promise<void> {
  await supabase.from('measurement_entries').delete().eq('id', id);
}

// ============ Meal Presets ============

export async function getMealPresets(profileId?: string): Promise<MealPreset[]> {
  let query = supabase.from('meal_presets').select('*').order('created_at');
  if (profileId) query = query.eq('profile_id', profileId);
  const { data } = await query;
  if (!data) return [];
  return data.map(row => ({
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    meal: row.meal,
    days: row.days,
    items: row.items,
  }));
}

export async function saveMealPreset(preset: MealPreset): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('meal_presets').upsert({
    id: preset.id,
    profile_id: preset.profileId,
    user_id: userId,
    name: preset.name,
    meal: preset.meal,
    days: preset.days,
    items: preset.items,
  });
}

export async function deleteMealPreset(id: string): Promise<void> {
  await supabase.from('meal_presets').delete().eq('id', id);
}

// ============ Utility ============

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
