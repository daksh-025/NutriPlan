import type { ActivityLevel, Goal, Profile } from './types';

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string
): number {
  if (gender === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * activityMultipliers[activityLevel]);
}

export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  switch (goal) {
    case 'lose_weight': return Math.max(1200, tdee - 500);
    case 'build_muscle': return tdee + 300;
    case 'maintain':
    case 'eat_healthier':
    default: return tdee;
  }
}

export function calculateMacros(calories: number, goal: Goal) {
  let proteinPct: number, carbsPct: number, fatPct: number;

  switch (goal) {
    case 'lose_weight':
      proteinPct = 0.35; carbsPct = 0.35; fatPct = 0.30; break;
    case 'build_muscle':
      proteinPct = 0.35; carbsPct = 0.40; fatPct = 0.25; break;
    case 'eat_healthier':
    case 'maintain':
    default:
      proteinPct = 0.25; carbsPct = 0.45; fatPct = 0.30;
  }

  return {
    protein_g: Math.round((calories * proteinPct) / 4),
    carbs_g: Math.round((calories * carbsPct) / 4),
    fat_g: Math.round((calories * fatPct) / 9),
  };
}

export function computeTargets(profile: Partial<Profile>) {
  if (!profile.weight_kg || !profile.height_cm || !profile.age || !profile.gender || !profile.activity_level || !profile.goal) {
    return null;
  }

  const bmr = calculateBMR(profile.weight_kg, profile.height_cm, profile.age, profile.gender);
  const tdee = calculateTDEE(bmr, profile.activity_level);
  const calories = calculateCalorieTarget(tdee, profile.goal);
  const macros = calculateMacros(calories, profile.goal);

  return {
    daily_calorie_target: calories,
    ...macros,
  };
}

export function formatCalories(n: number): string {
  return Math.round(n).toLocaleString();
}

export function getMacroColor(macro: 'protein' | 'carbs' | 'fat'): string {
  switch (macro) {
    case 'protein': return '#3b82f6';
    case 'carbs': return '#f59e0b';
    case 'fat': return '#ef4444';
  }
}

export function getProgressPercent(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
