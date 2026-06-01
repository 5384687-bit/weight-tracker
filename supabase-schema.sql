-- Weight Tracker Database Schema
-- Run this in Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- Profiles table
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  height NUMERIC NOT NULL,
  target_weight NUMERIC NOT NULL,
  start_weight NUMERIC NOT NULL,
  start_date TEXT NOT NULL,
  target_date TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  birth_date TEXT,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight entries
CREATE TABLE weight_entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food entries
CREATE TABLE food_entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT NOT NULL,
  calories INTEGER,
  protein NUMERIC,
  fat NUMERIC,
  carbs NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise entries
CREATE TABLE exercise_entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  calories_burned INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water entries
CREATE TABLE water_entries (
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  glasses INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, date)
);

-- Water presets
CREATE TABLE water_presets (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  glasses INTEGER NOT NULL
);

-- Measurement entries
CREATE TABLE measurement_entries (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  waist NUMERIC,
  chest NUMERIC,
  hips NUMERIC,
  arm_right NUMERIC,
  arm_left NUMERIC,
  thigh_right NUMERIC,
  thigh_left NUMERIC,
  neck NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal presets
CREATE TABLE meal_presets (
  id TEXT PRIMARY KEY,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  days JSONB NOT NULL DEFAULT '"daily"',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active profile setting per user
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL
);

-- Row Level Security (RLS) - each user sees only their data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users manage own profiles" ON profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own weight" ON weight_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own food" ON food_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own exercise" ON exercise_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own water" ON water_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own water presets" ON water_presets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own measurements" ON measurement_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own meal presets" ON meal_presets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own settings" ON user_settings FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_weight_profile_date ON weight_entries(profile_id, date);
CREATE INDEX idx_food_profile_date ON food_entries(profile_id, date);
CREATE INDEX idx_exercise_profile_date ON exercise_entries(profile_id, date);
CREATE INDEX idx_water_profile_date ON water_entries(profile_id, date);
CREATE INDEX idx_measurement_profile_date ON measurement_entries(profile_id, date);
