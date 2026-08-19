export type Goal = 'lose_weight' | 'maintain' | 'build_muscle' | 'eat_healthier';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type DietaryPreference = 'none' | 'vegan' | 'vegetarian' | 'keto' | 'paleo' | 'mediterranean' | 'gluten_free';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SubscriptionTier = 'free' | 'pro' | 'family';
export type Gender = 'male' | 'female' | 'other';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: Goal | null;
  activity_level: ActivityLevel | null;
  dietary_preference: DietaryPreference | null;
  food_allergies: string[];
  cuisine_preferences: string[];
  daily_calorie_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  units: 'metric' | 'imperial';
  onboarding_complete: boolean;
  subscription_tier: SubscriptionTier;
  created_at: string | null;
  updated_at: string | null;
}

export interface MealPlan {
  id: string;
  user_id: string;
  week_start: string;
  name: string;
  is_active: boolean;
  created_at: string | null;
  slots?: MealPlanSlot[];
}

export interface MealPlanSlot {
  id: string;
  meal_plan_id: string;
  day_of_week: number;
  meal_type: MealType;
  recipe_name: string | null;
  recipe_data: Record<string, unknown> | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  logged_date: string;
  meal_type: MealType;
  food_name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  created_at: string | null;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  logged_date: string;
  weight_kg: number;
  notes: string | null;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  external_id: string | null;
  recipe_name: string;
  image_url: string | null;
  is_custom: boolean;
  calories_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_time_mins: number;
  servings: number;
  ingredients: string[];
  instructions: string;
  tags: string[];
}

export interface GroceryList {
  id: string;
  user_id: string;
  meal_plan_id: string | null;
  name: string;
  items?: GroceryItem[];
}

export interface GroceryItem {
  id: string;
  grocery_list_id: string;
  name: string;
  quantity: string | null;
  category: string;
  is_checked: boolean;
  is_custom: boolean;
}

export type AppView =
  | 'dashboard'
  | 'meal-plan'
  | 'recipes'
  | 'tracker'
  | 'grocery'
  | 'progress'
  | 'settings';
