
/*
  # Nutrition & Meal Planning SaaS — Full Schema

  ## Summary
  Creates all tables required for the nutrition and meal planning application.

  ## Tables Created

  1. `profiles` — Extended user profile with health data, goals, dietary preferences, and subscription info
  2. `meal_plans` — Weekly meal plan containers per user
  3. `meal_plan_slots` — Individual meals (breakfast/lunch/dinner/snack) per day in a plan
  4. `food_log` — Daily food intake entries with full macro/micro data
  5. `weight_log` — Historical weight entries for progress tracking
  6. `saved_recipes` — User's favourite and custom recipes
  7. `grocery_lists` — Shopping lists optionally linked to meal plans
  8. `grocery_items` — Line items within a grocery list
  9. `water_log` — Daily water intake entries

  ## Security
  - RLS enabled on all tables
  - All policies restrict access to the owning authenticated user only
  - Separate SELECT / INSERT / UPDATE / DELETE policies per table
*/

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  age integer,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  height_cm numeric,
  weight_kg numeric,
  goal text CHECK (goal IN ('lose_weight', 'maintain', 'build_muscle', 'eat_healthier')),
  activity_level text CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  dietary_preference text DEFAULT 'none',
  food_allergies text[] DEFAULT '{}',
  cuisine_preferences text[] DEFAULT '{}',
  daily_calorie_target integer,
  protein_target_g integer,
  carbs_target_g integer,
  fat_target_g integer,
  units text DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  onboarding_complete boolean DEFAULT false,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'family')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ─── MEAL PLANS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  name text DEFAULT 'My Meal Plan',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── MEAL PLAN SLOTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plan_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_name text,
  recipe_data jsonb DEFAULT '{}',
  calories integer DEFAULT 0,
  protein_g numeric DEFAULT 0,
  carbs_g numeric DEFAULT 0,
  fat_g numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plan_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plan slots"
  ON meal_plan_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_slots.meal_plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meal plan slots"
  ON meal_plan_slots FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_slots.meal_plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meal plan slots"
  ON meal_plan_slots FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_slots.meal_plan_id
        AND meal_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_slots.meal_plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meal plan slots"
  ON meal_plan_slots FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_slots.meal_plan_id
        AND meal_plans.user_id = auth.uid()
    )
  );

-- ─── FOOD LOG ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text NOT NULL,
  brand text DEFAULT '',
  serving_size numeric NOT NULL DEFAULT 1,
  serving_unit text NOT NULL DEFAULT 'serving',
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric DEFAULT 0,
  carbs_g numeric DEFAULT 0,
  fat_g numeric DEFAULT 0,
  fiber_g numeric DEFAULT 0,
  sugar_g numeric DEFAULT 0,
  sodium_mg numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS food_log_user_date_idx ON food_log(user_id, logged_date);

ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food log"
  ON food_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food log"
  ON food_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food log"
  ON food_log FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food log"
  ON food_log FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── WEIGHT LOG ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weight_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weight_log_user_date_idx ON weight_log(user_id, logged_date);

ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight log"
  ON weight_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight log"
  ON weight_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight log"
  ON weight_log FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight log"
  ON weight_log FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── SAVED RECIPES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  external_id text DEFAULT '',
  recipe_name text NOT NULL,
  recipe_data jsonb DEFAULT '{}',
  image_url text DEFAULT '',
  is_custom boolean DEFAULT false,
  calories_per_serving integer DEFAULT 0,
  protein_g numeric DEFAULT 0,
  carbs_g numeric DEFAULT 0,
  fat_g numeric DEFAULT 0,
  prep_time_mins integer DEFAULT 0,
  servings integer DEFAULT 1,
  ingredients jsonb DEFAULT '[]',
  instructions text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved recipes"
  ON saved_recipes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved recipes"
  ON saved_recipes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved recipes"
  ON saved_recipes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved recipes"
  ON saved_recipes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── GROCERY LISTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Grocery List',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grocery lists"
  ON grocery_lists FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grocery lists"
  ON grocery_lists FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery lists"
  ON grocery_lists FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery lists"
  ON grocery_lists FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── GROCERY ITEMS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grocery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id uuid REFERENCES grocery_lists(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quantity text DEFAULT '',
  category text DEFAULT 'other',
  is_checked boolean DEFAULT false,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grocery items"
  ON grocery_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
        AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own grocery items"
  ON grocery_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
        AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own grocery items"
  ON grocery_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
        AND grocery_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
        AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own grocery items"
  ON grocery_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
        AND grocery_lists.user_id = auth.uid()
    )
  );

-- ─── WATER LOG ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  amount_ml integer NOT NULL DEFAULT 250,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS water_log_user_date_idx ON water_log(user_id, logged_date);

ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water log"
  ON water_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water log"
  ON water_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water log"
  ON water_log FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water log"
  ON water_log FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── PROFILE AUTO-CREATE TRIGGER ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
