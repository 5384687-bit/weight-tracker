export function calculateBMI(weight: number, heightCm: number): number {
  return weight / ((heightCm / 100) ** 2);
}

export function getBMICategory(bmi: number, gender: 'male' | 'female'): { label: string; color: string } {
  if (gender === 'female') {
    if (bmi < 18) return { label: 'תת משקל', color: 'text-yellow-600' };
    if (bmi < 24) return { label: 'תקין', color: 'text-green-600' };
    if (bmi < 29) return { label: 'עודף משקל', color: 'text-orange-600' };
    return { label: 'השמנה', color: 'text-red-600' };
  }
  if (bmi < 18.5) return { label: 'תת משקל', color: 'text-yellow-600' };
  if (bmi < 25) return { label: 'תקין', color: 'text-green-600' };
  if (bmi < 30) return { label: 'עודף משקל', color: 'text-orange-600' };
  return { label: 'השמנה', color: 'text-red-600' };
}
