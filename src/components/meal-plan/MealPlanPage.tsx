import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Plus, RefreshCw, Trash2, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getWeekStart, formatDate, addDays } from '../../lib/nutrition';
import type { MealPlan, MealPlanSlot, MealType } from '../../lib/types';
import { MOCK_RECIPES } from '../../lib/mockRecipes';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_COLORS: Record<MealType, string> = {
  breakfast: 'bg-amber-50 border-amber-200 text-amber-700',
  lunch: 'bg-blue-50 border-blue-200 text-blue-700',
  dinner: 'bg-green-50 border-green-200 text-green-700',
  snack: 'bg-rose-50 border-rose-200 text-rose-700',
};
const MEAL_EMOJIS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
};

function generateMealPlanData(_profile: { goal?: string | null; dietary_preference?: string | null }): Omit<MealPlanSlot, 'id' | 'meal_plan_id'>[] {
  const slots: Omit<MealPlanSlot, 'id' | 'meal_plan_id'>[] = [];
  const breakfasts = MOCK_RECIPES.filter(r => r.mealType.includes('breakfast'));
  const lunches = MOCK_RECIPES.filter(r => r.mealType.includes('lunch'));
  const dinners = MOCK_RECIPES.filter(r => r.mealType.includes('dinner'));
  const snacks = MOCK_RECIPES.filter(r => r.mealType.includes('snack'));

  for (let day = 0; day < 7; day++) {
    const pick = (arr: typeof MOCK_RECIPES) => arr[Math.floor(Math.random() * arr.length)];
    const b = pick(breakfasts);
    const l = pick(lunches);
    const d = pick(dinners);
    const s = pick(snacks);

    slots.push(
      { day_of_week: day, meal_type: 'breakfast', recipe_name: b.name, recipe_data: b as unknown as Record<string, unknown>, calories: b.calories, protein_g: b.protein, carbs_g: b.carbs, fat_g: b.fat },
      { day_of_week: day, meal_type: 'lunch', recipe_name: l.name, recipe_data: l as unknown as Record<string, unknown>, calories: l.calories, protein_g: l.protein, carbs_g: l.carbs, fat_g: l.fat },
      { day_of_week: day, meal_type: 'dinner', recipe_name: d.name, recipe_data: d as unknown as Record<string, unknown>, calories: d.calories, protein_g: d.protein, carbs_g: d.carbs, fat_g: d.fat },
      { day_of_week: day, meal_type: 'snack', recipe_name: s.name, recipe_data: s as unknown as Record<string, unknown>, calories: s.calories, protein_g: s.protein, carbs_g: s.carbs, fat_g: s.fat },
    );
  }
  return slots;
}

export default function MealPlanPage() {
  const { profile } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [slots, setSlots] = useState<MealPlanSlot[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const weekStart = getWeekStart(addDays(new Date(), weekOffset * 7));
  const weekStartStr = formatDate(weekStart);

  const loadPlan = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: planData, error: planError } = await (supabase
        .from('meal_plans') as any)
        .select('*')
        .eq('user_id', profile.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (planError) {
        console.warn('Meal plan fetch error:', planError);
        setPlan(null);
        setSlots([]);
      } else if (planData) {
        setPlan(planData as MealPlan);
        const { data: slotData, error: slotError } = await supabase
          .from('meal_plan_slots')
          .select('*')
          .eq('meal_plan_id', planData.id as any);
        
        if (slotError) {
          console.warn('Meal plan slots fetch error:', slotError);
          setSlots([]);
        } else {
          setSlots((slotData ?? []) as MealPlanSlot[]);
        }
      } else {
        setPlan(null);
        setSlots([]);
      }
    } catch (error) {
      console.error('Meal plan load error:', error);
      setPlan(null);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [profile, weekStartStr]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  async function generatePlan() {
    if (!profile) return;
    setGenerating(true);
    try {
      let planId: string;
      if (plan) {
        const { error: deleteError } = await supabase.from('meal_plan_slots').delete().eq('meal_plan_id', plan.id);
        if (deleteError) {
          console.error('Delete slots error:', deleteError);
          setGenerating(false);
          return;
        }
        planId = plan.id;
      } else {
        const { data: newPlan, error: createError } = await supabase
          .from('meal_plans')
        .insert({ user_id: profile.id, week_start: weekStartStr, name: 'My Week Plan' } as any)
        .select()
        .single();
        if (createError || !newPlan) {
          console.error('Create plan error:', createError);
          setGenerating(false);
          return;
        }
        planId = (newPlan as any)?.id;
        setPlan(newPlan as MealPlan);
      }

      const newSlots = generateMealPlanData(profile);
      const toInsert = newSlots.map(s => ({ ...s, meal_plan_id: planId }));
      const { data: inserted, error: insertError } = await supabase.from('meal_plan_slots').insert(toInsert as any).select();
      if (insertError) {
        console.error('Insert slots error:', insertError);
      } else {
        setSlots((inserted ?? []) as MealPlanSlot[]);
      }
    } catch (error) {
      console.error('Generate plan error:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateSlot(day: number, mealType: MealType) {
    if (!plan) return;
    try {
      const recipes = MOCK_RECIPES.filter(r => r.mealType.includes(mealType));
      const recipe = recipes[Math.floor(Math.random() * recipes.length)];

      const existing = slots.find(s => s.day_of_week === day && s.meal_type === mealType);
      if (existing) {
        const { error } = await (supabase.from('meal_plan_slots') as any).update({
          recipe_name: recipe.name,
          recipe_data: recipe as unknown as Record<string, unknown>,
          calories: recipe.calories,
          protein_g: recipe.protein,
          carbs_g: recipe.carbs,
          fat_g: recipe.fat,
        }).eq('id', existing.id);
        if (error) {
          console.error('Regenerate slot error:', error);
          return;
        }
        setSlots(prev => prev.map(s => s.id === existing.id ? { ...s, recipe_name: recipe.name, calories: recipe.calories, protein_g: recipe.protein, carbs_g: recipe.carbs, fat_g: recipe.fat } : s));
      }
    } catch (error) {
      console.error('Regenerate slot error:', error);
    }
  }

  async function removeSlot(slotId: string) {
    try {
      const { error } = await supabase.from('meal_plan_slots').delete().eq('id', slotId);
      if (error) {
        console.error('Delete slot error:', error);
        return;
      }
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (error) {
      console.error('Remove slot error:', error);
    }
  }

  const dayCalories = Array.from({ length: 7 }, (_, day) =>
    slots.filter(s => s.day_of_week === day).reduce((sum, s) => sum + (s.calories ?? 0), 0)
  );

  const dayDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Plan</h1>
          <p className="text-gray-500 text-sm mt-1">Plan your week, hit your goals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="px-3 text-sm font-medium text-gray-700 min-w-32 text-center">
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-all"
          >
            {generating ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generating ? 'Generating...' : plan ? 'Regenerate' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : !plan ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No plan for this week yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">Click "Generate Plan" to create an AI-powered 7-day meal plan tailored to your goals and preferences.</p>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Generate My Meal Plan
          </button>
        </div>
      ) : (
        <>
          {/* Weekly summary bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Weekly avg:</span>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {Math.round(slots.reduce((s, sl) => s + (sl.calories ?? 0), 0) / 7)}
                  </span> kcal/day
                </span>
                <span className="text-blue-600 font-semibold">
                  {Math.round(slots.reduce((s, sl) => s + (sl.protein_g ?? 0), 0) / 7)}g protein
                </span>
              </div>
            </div>
          </div>

          {/* Calendar grid — horizontal scroll on mobile */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs font-medium text-gray-400 uppercase py-2 px-3" />
                {DAYS.map((day, i) => (
                  <div key={day} className="text-center">
                    <div className={`text-xs font-semibold uppercase ${i === (new Date().getDay() + 6) % 7 ? 'text-green-600' : 'text-gray-500'}`}>{day}</div>
                    <div className={`text-lg font-bold ${i === (new Date().getDay() + 6) % 7 ? 'text-green-600' : 'text-gray-900'}`}>
                      {dayDates[i].getDate()}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{dayCalories[i] > 0 ? `${dayCalories[i]} kcal` : '—'}</div>
                  </div>
                ))}
              </div>

              {/* Meal rows */}
              {MEALS.map(meal => (
                <div key={meal} className="grid grid-cols-8 gap-2 mb-2">
                  {/* Meal type label */}
                  <div className="flex items-center gap-2 py-2 px-3">
                    <span>{MEAL_EMOJIS[meal]}</span>
                    <span className="text-xs font-semibold text-gray-600 capitalize hidden sm:block">{meal}</span>
                  </div>

                  {/* Slot cells */}
                  {Array.from({ length: 7 }, (_, day) => {
                    const slot = slots.find(s => s.day_of_week === day && s.meal_type === meal);
                    return (
                      <div
                        key={day}
                        className={`group relative rounded-xl border min-h-20 p-2.5 ${
                          slot ? MEAL_COLORS[meal] : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        } transition-all`}
                      >
                        {slot ? (
                          <>
                            <p className="text-xs font-medium leading-tight line-clamp-2">{slot.recipe_name}</p>
                            <p className="text-xs opacity-70 mt-1">{slot.calories} kcal</p>
                            <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                              <button
                                onClick={() => regenerateSlot(day, meal)}
                                className="p-1 bg-white/80 rounded-md hover:bg-white shadow-sm"
                                title="Swap meal"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeSlot(slot.id)}
                                className="p-1 bg-white/80 rounded-md hover:bg-white shadow-sm text-red-500"
                                title="Remove"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            onClick={() => regenerateSlot(day, meal)}
                            className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
