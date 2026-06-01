export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  height: number;
  targetWeight: number;
  startWeight: number;
  startDate: string;
  targetDate: string;
  avatar: string;
  birthDate?: string;
  activityLevel?: ActivityLevel;
}

export interface WeightEntry {
  id: string;
  profileId: string;
  date: string;
  weight: number;
}

export interface FoodEntry {
  id: string;
  profileId: string;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export interface ExerciseEntry {
  id: string;
  profileId: string;
  date: string;
  type: string;
  duration: number;
  caloriesBurned?: number;
  notes?: string;
}

export interface WaterEntry {
  profileId: string;
  date: string;
  glasses: number;
}

export interface WaterPreset {
  id: string;
  profileId: string;
  name: string;
  glasses: number;
}

export interface MeasurementEntry {
  id: string;
  profileId: string;
  date: string;
  waist?: number;
  chest?: number;
  hips?: number;
  armRight?: number;
  armLeft?: number;
  thighRight?: number;
  thighLeft?: number;
  neck?: number;
}

export interface MealPreset {
  id: string;
  profileId: string;
  name: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  days: number[] | 'daily';
  items: { description: string; calories: number; protein?: number; fat?: number; carbs?: number }[];
}

export interface DailyTip {
  text: string;
  category: 'nutrition' | 'exercise' | 'mindset' | 'habit';
}
