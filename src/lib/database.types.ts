export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          age: number | null;
          gender: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          goal: string | null;
          activity_level: string | null;
          dietary_preference: string | null;
          food_allergies: string[] | null;
          cuisine_preferences: string[] | null;
          daily_calorie_target: number | null;
          protein_target_g: number | null;
          carbs_target_g: number | null;
          fat_target_g: number | null;
          units: string | null;
          onboarding_complete: boolean | null;
          subscription_tier: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          name: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['meal_plans']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['meal_plans']['Row']>;
      };
      meal_plan_slots: {
        Row: {
          id: string;
          meal_plan_id: string;
          day_of_week: number;
          meal_type: string;
          recipe_name: string | null;
          recipe_data: Json | null;
          calories: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['meal_plan_slots']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['meal_plan_slots']['Row']>;
      };
      food_log: {
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          meal_type: string;
          food_name: string;
          brand: string | null;
          serving_size: number;
          serving_unit: string;
          calories: number;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          fiber_g: number | null;
          sugar_g: number | null;
          sodium_mg: number | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['food_log']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['food_log']['Row']>;
      };
      weight_log: {
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          weight_kg: number;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['weight_log']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['weight_log']['Row']>;
      };
      saved_recipes: {
        Row: {
          id: string;
          user_id: string;
          external_id: string | null;
          recipe_name: string;
          recipe_data: Json | null;
          image_url: string | null;
          is_custom: boolean | null;
          calories_per_serving: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          prep_time_mins: number | null;
          servings: number | null;
          ingredients: Json | null;
          instructions: string | null;
          tags: string[] | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['saved_recipes']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['saved_recipes']['Row']>;
      };
      grocery_lists: {
        Row: {
          id: string;
          user_id: string;
          meal_plan_id: string | null;
          name: string;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['grocery_lists']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['grocery_lists']['Row']>;
      };
      grocery_items: {
        Row: {
          id: string;
          grocery_list_id: string;
          name: string;
          quantity: string | null;
          category: string | null;
          is_checked: boolean | null;
          is_custom: boolean | null;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['grocery_items']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['grocery_items']['Row']>;
      };
      water_log: {
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          amount_ml: number;
          created_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['water_log']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['water_log']['Row']>;
      };
    };
  };
}
