import { supabase } from './supabase';

// Pull all data from Supabase into localStorage
export async function pullFromCloud(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Pull profiles
  const { data: profiles } = await supabase.from('profiles').select('*');
  if (profiles && profiles.length > 0) {
    const mapped = profiles.map(r => ({
      id: r.id, name: r.name, gender: r.gender,
      height: Number(r.height), targetWeight: Number(r.target_weight),
      startWeight: Number(r.start_weight), startDate: r.start_date,
      targetDate: r.target_date, avatar: r.avatar,
      birthDate: r.birth_date || undefined,
      activityLevel: r.activity_level || undefined,
    }));
    localStorage.setItem('profiles', JSON.stringify(mapped));
  }

  // Pull active profile
  const { data: settings } = await supabase.from('user_settings').select('active_profile_id').eq('user_id', user.id).single();
  if (settings?.active_profile_id) {
    localStorage.setItem('active_profile_id', JSON.stringify(settings.active_profile_id));
  }

  // Pull weight entries
  const { data: weights } = await supabase.from('weight_entries').select('*');
  if (weights) {
    const mapped = weights.map(r => ({
      id: r.id, profileId: r.profile_id, date: r.date, weight: Number(r.weight),
    }));
    localStorage.setItem('weight_entries', JSON.stringify(mapped));
  }

  // Pull food entries
  const { data: foods } = await supabase.from('food_entries').select('*');
  if (foods) {
    const mapped = foods.map(r => ({
      id: r.id, profileId: r.profile_id, date: r.date, meal: r.meal,
      description: r.description, calories: r.calories ?? undefined,
      protein: r.protein != null ? Number(r.protein) : undefined,
      fat: r.fat != null ? Number(r.fat) : undefined,
      carbs: r.carbs != null ? Number(r.carbs) : undefined,
    }));
    localStorage.setItem('food_entries', JSON.stringify(mapped));
  }

  // Pull exercise entries
  const { data: exercises } = await supabase.from('exercise_entries').select('*');
  if (exercises) {
    const mapped = exercises.map(r => ({
      id: r.id, profileId: r.profile_id, date: r.date, type: r.type,
      duration: r.duration, caloriesBurned: r.calories_burned ?? undefined,
      notes: r.notes ?? undefined,
    }));
    localStorage.setItem('exercise_entries', JSON.stringify(mapped));
  }

  // Pull water entries
  const { data: water } = await supabase.from('water_entries').select('*');
  if (water) {
    const mapped = water.map(r => ({
      profileId: r.profile_id, date: r.date, glasses: r.glasses,
    }));
    localStorage.setItem('water_entries', JSON.stringify(mapped));
  }

  // Pull water presets
  const { data: waterPresets } = await supabase.from('water_presets').select('*');
  if (waterPresets) {
    const mapped = waterPresets.map(r => ({
      id: r.id, profileId: r.profile_id, name: r.name, glasses: r.glasses,
    }));
    localStorage.setItem('water_presets', JSON.stringify(mapped));
  }

  // Pull measurement entries
  const { data: measurements } = await supabase.from('measurement_entries').select('*');
  if (measurements) {
    const mapped = measurements.map(r => ({
      id: r.id, profileId: r.profile_id, date: r.date,
      waist: r.waist != null ? Number(r.waist) : undefined,
      chest: r.chest != null ? Number(r.chest) : undefined,
      hips: r.hips != null ? Number(r.hips) : undefined,
      armRight: r.arm_right != null ? Number(r.arm_right) : undefined,
      armLeft: r.arm_left != null ? Number(r.arm_left) : undefined,
      thighRight: r.thigh_right != null ? Number(r.thigh_right) : undefined,
      thighLeft: r.thigh_left != null ? Number(r.thigh_left) : undefined,
      neck: r.neck != null ? Number(r.neck) : undefined,
    }));
    localStorage.setItem('measurement_entries', JSON.stringify(mapped));
  }

  // Pull meal presets
  const { data: mealPresets } = await supabase.from('meal_presets').select('*');
  if (mealPresets) {
    const mapped = mealPresets.map(r => ({
      id: r.id, profileId: r.profile_id, name: r.name,
      meal: r.meal, days: r.days, items: r.items,
    }));
    localStorage.setItem('meal_presets', JSON.stringify(mapped));
  }
}

// Push all localStorage data to Supabase
export async function pushToCloud(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const getLocal = <T>(key: string): T[] => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  };

  // Push profiles (and delete removed ones)
  const profiles = getLocal<Record<string, unknown>>('profiles');
  const localProfileIds = profiles.map(p => p.id as string).filter(Boolean);
  for (const p of profiles) {
    await supabase.from('profiles').upsert({
      id: p.id, user_id: user.id, name: p.name, gender: p.gender,
      height: p.height, target_weight: p.targetWeight,
      start_weight: p.startWeight, start_date: p.startDate,
      target_date: p.targetDate, avatar: p.avatar || '',
      birth_date: p.birthDate || null, activity_level: p.activityLevel || null,
    });
  }
  // Delete profiles from cloud that no longer exist locally
  const { data: cloudProfiles } = await supabase.from('profiles').select('id').eq('user_id', user.id);
  if (cloudProfiles) {
    for (const cp of cloudProfiles) {
      if (!localProfileIds.includes(cp.id)) {
        await supabase.from('profiles').delete().eq('id', cp.id);
      }
    }
  }

  // Push active profile
  const activeId = JSON.parse(localStorage.getItem('active_profile_id') || 'null');
  if (activeId) {
    await supabase.from('user_settings').upsert({ user_id: user.id, active_profile_id: activeId });
  }

  // Helper: sync deletions for a table
  async function syncDeletions(table: string, localIds: string[]) {
    const { data: cloud } = await supabase.from(table).select('id').eq('user_id', user!.id);
    if (cloud) {
      for (const row of cloud) {
        if (!localIds.includes(row.id)) {
          await supabase.from(table).delete().eq('id', row.id);
        }
      }
    }
  }

  // Push weight entries
  const weights = getLocal<Record<string, unknown>>('weight_entries');
  for (const w of weights) {
    await supabase.from('weight_entries').upsert({
      id: w.id, profile_id: w.profileId, user_id: user.id,
      date: w.date, weight: w.weight,
    });
  }
  await syncDeletions('weight_entries', weights.map(w => w.id as string).filter(Boolean));

  // Push food entries
  const foods = getLocal<Record<string, unknown>>('food_entries');
  for (const f of foods) {
    await supabase.from('food_entries').upsert({
      id: f.id, profile_id: f.profileId, user_id: user.id,
      date: f.date, meal: f.meal, description: f.description,
      calories: f.calories ?? null, protein: f.protein ?? null,
      fat: f.fat ?? null, carbs: f.carbs ?? null,
    });
  }
  await syncDeletions('food_entries', foods.map(f => f.id as string).filter(Boolean));

  // Push exercise entries
  const exercises = getLocal<Record<string, unknown>>('exercise_entries');
  for (const e of exercises) {
    await supabase.from('exercise_entries').upsert({
      id: e.id, profile_id: e.profileId, user_id: user.id,
      date: e.date, type: e.type, duration: e.duration,
      calories_burned: e.caloriesBurned ?? null, notes: e.notes ?? null,
    });
  }
  await syncDeletions('exercise_entries', exercises.map(e => e.id as string).filter(Boolean));

  // Push water entries
  const water = getLocal<Record<string, unknown>>('water_entries');
  for (const w of water) {
    await supabase.from('water_entries').upsert({
      profile_id: w.profileId, user_id: user.id,
      date: w.date, glasses: w.glasses,
    });
  }

  // Push water presets
  const waterPresets = getLocal<Record<string, unknown>>('water_presets');
  for (const p of waterPresets) {
    await supabase.from('water_presets').upsert({
      id: p.id, profile_id: p.profileId, user_id: user.id,
      name: p.name, glasses: p.glasses,
    });
  }

  // Push measurement entries
  const measurements = getLocal<Record<string, unknown>>('measurement_entries');
  for (const m of measurements) {
    await supabase.from('measurement_entries').upsert({
      id: m.id, profile_id: m.profileId, user_id: user.id,
      date: m.date, waist: m.waist ?? null, chest: m.chest ?? null,
      hips: m.hips ?? null, arm_right: m.armRight ?? null,
      arm_left: m.armLeft ?? null, thigh_right: m.thighRight ?? null,
      thigh_left: m.thighLeft ?? null, neck: m.neck ?? null,
    });
  }
  await syncDeletions('measurement_entries', measurements.map(m => m.id as string).filter(Boolean));

  // Push meal presets
  const mealPresets = getLocal<Record<string, unknown>>('meal_presets');
  for (const p of mealPresets) {
    await supabase.from('meal_presets').upsert({
      id: p.id, profile_id: p.profileId, user_id: user.id,
      name: p.name, meal: p.meal, days: p.days, items: p.items,
    });
  }
}
