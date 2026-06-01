import { ActivityLevel } from './types';

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const activityLabels: Record<ActivityLevel, string> = {
  sedentary: 'יושבני (ללא פעילות)',
  light: 'פעילות קלה (1-3 ימים/שבוע)',
  moderate: 'פעילות בינונית (3-5 ימים/שבוע)',
  active: 'פעיל מאוד (6-7 ימים/שבוע)',
  very_active: 'אקסטרים (אימונים כפולים)',
};

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(weight: number, height: number, age: number, gender: 'male' | 'female', activity: ActivityLevel): number {
  const bmr = calculateBMR(weight, height, age, gender);
  return Math.round(bmr * activityMultipliers[activity]);
}

export function getCalorieTarget(tdee: number, weeklyLossKg: number = 0.5): number {
  const deficit = weeklyLossKg * 7700 / 7;
  return Math.max(1200, Math.round(tdee - deficit));
}
