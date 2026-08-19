import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate, addDays, getProgressPercent } from '../../lib/nutrition';
import type { FoodLogEntry, MealType } from '../../lib/types';
import { MOCK_RECIPES } from '../../lib/mockRecipes';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_EMOJIS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

interface AddFoodModalProps {
  mealType: MealType;
  loggedDate: string;
  onAdd: (entry: Omit<FoodLogEntry, 'id' | 'user_id' | 'created_at'>) => Promise<boolean>;
  onClose: () => void;
}

function AddFoodModal({ mealType, loggedDate, onAdd, onClose }: AddFoodModalProps) {
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', serving_size: '1', serving_unit: 'serving' });

  const suggestions = query.length > 1
    ? MOCK_RECIPES.filter(r => r.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  function selectRecipe(r: typeof MOCK_RECIPES[0]) {
    setForm({ food_name: r.name, calories: String(r.calories), protein_g: String(r.protein), carbs_g: String(r.carbs), fat_g: String(r.fat), serving_size: '1', serving_unit: 'serving' });
    setCustom(true);
    setQuery('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.food_name || !form.calories) return;
    setSubmitting(true);
    setSubmitError(null);
    onAdd({
      logged_date: loggedDate,
      meal_type: mealType,
      food_name: form.food_name,
      brand: null,
      serving_size: parseFloat(form.serving_size) || 1,
      serving_unit: form.serving_unit || 'serving',
      calories: parseFloat(form.calories) || 0,
      protein_g: parseFloat(form.protein_g) || 0,
      carbs_g: parseFloat(form.carbs_g) || 0,
      fat_g: parseFloat(form.fat_g) || 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    }).then(ok => {
      if (ok) onClose();
      else setSubmitError('Failed to add food. Please try again.');
    }).catch(() => {
      setSubmitError('Failed to add food. Please try again.');
    }).finally(() => {
      setSubmitting(false);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Add Food</h3>
            <p className="text-sm text-gray-500 capitalize">{MEAL_EMOJIS[mealType]} {mealType}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {!custom ? (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search foods..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="space-y-1 mb-4">
                  {suggestions.map(r => (
                    <button key={r.id} onClick={() => selectRecipe(r)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl text-left transition-colors">
                      <span className="text-sm font-medium text-gray-900">{r.name}</span>
                      <span className="text-xs text-gray-500">{r.calories} kcal</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setCustom(true)}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-green-300 hover:text-green-600 transition-all">
                + Enter custom food manually
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Food Name *</label>
                <input value={form.food_name} onChange={e => setForm(f => ({ ...f, food_name: e.target.value }))} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Serving Size</label>
                  <input type="number" value={form.serving_size} onChange={e => setForm(f => ({ ...f, serving_size: e.target.value }))} min={0.1} step={0.1}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Unit</label>
                  <input value={form.serving_unit} onChange={e => setForm(f => ({ ...f, serving_unit: e.target.value }))} placeholder="g, oz, serving..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Calories (kcal) *</label>
                  <input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} required min={0}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Protein (g)</label>
                  <input type="number" value={form.protein_g} onChange={e => setForm(f => ({ ...f, protein_g: e.target.value }))} min={0} step={0.1}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Carbs (g)</label>
                  <input type="number" value={form.carbs_g} onChange={e => setForm(f => ({ ...f, carbs_g: e.target.value }))} min={0} step={0.1}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Fat (g)</label>
                  <input type="number" value={form.fat_g} onChange={e => setForm(f => ({ ...f, fat_g: e.target.value }))} min={0} step={0.1}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCustom(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
                  {submitting ? 'Adding...' : 'Add to Log'}
                </button>
              </div>
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{submitError}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const { profile } = useAuth();
  const [dateOffset, setDateOffset] = useState(0);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [addingTo, setAddingTo] = useState<MealType | null>(null);
  const [logError, setLogError] = useState<string | null>(null);

  const date = formatDate(addDays(new Date(), dateOffset));
  const isToday = dateOffset === 0;

  useEffect(() => {
    async function load() {
      if (!profile) return;
      try {
        const { data, error } = await (supabase.from('food_log') as any).select('*').eq('user_id', profile.id).eq('logged_date', date).order('created_at');
        if (error) {
          console.warn('Food log fetch error:', error.message);
          setLogs([]);
          setLogError(error.message);
        } else {
          setLogs((data ?? []) as FoodLogEntry[]);
          setLogError(null);
        }
      } catch (error) {
        console.error('Food log load error:', error);
      }
    }
    load();
  }, [profile, date]);

  async function addEntry(entry: Omit<FoodLogEntry, 'id' | 'user_id' | 'created_at'>): Promise<boolean> {
    if (!profile) return false;
    try {
      const { data, error } = await (supabase.from('food_log') as any).insert({ ...entry, user_id: profile.id }).select().single();
      if (error) {
        console.error('Error adding food entry:', error.message);
        setLogError(error.message);
        return false;
      }
      if (data) setLogs(prev => [...prev, data as FoodLogEntry]);
      setLogError(null);
      return true;
    } catch (error) {
      console.error('Add entry error:', error);
      return false;
    }
  }

  async function deleteEntry(id: string) {
    try {
      const { error } = await supabase.from('food_log').delete().eq('id', id);
      if (error) {
        console.error('Error deleting food entry:', error.message);
        return;
      }
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Delete entry error:', error);
    }
  }

  const totals = {
    calories: logs.reduce((s, l) => s + l.calories, 0),
    protein: logs.reduce((s, l) => s + (l.protein_g ?? 0), 0),
    carbs: logs.reduce((s, l) => s + (l.carbs_g ?? 0), 0),
    fat: logs.reduce((s, l) => s + (l.fat_g ?? 0), 0),
  };

  const calTarget = profile?.daily_calorie_target ?? 2000;
  const protTarget = profile?.protein_target_g ?? 150;
  const carbTarget = profile?.carbs_target_g ?? 200;
  const fatTarget = profile?.fat_target_g ?? 65;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food Log</h1>
          <p className="text-gray-500 text-sm mt-1">Track every meal, hit your targets</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
          <button onClick={() => setDateOffset(d => d - 1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 min-w-28 text-center">
            {isToday ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <button onClick={() => setDateOffset(d => d + 1)} disabled={dateOffset >= 0} className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Load error banner */}
      {logError && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          Couldn't load the food log: {logError}
        </div>
      )}

      {/* Daily summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">{Math.round(totals.calories)}</div>
            <div className="text-sm text-gray-500">of {calTarget} kcal</div>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium text-gray-600">{Math.max(0, calTarget - Math.round(totals.calories))} left</span>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${totals.calories > calTarget ? 'bg-red-400' : 'bg-green-400'}`}
            style={{ width: `${Math.min(100, (totals.calories / calTarget) * 100)}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Protein', current: totals.protein, target: protTarget, color: 'bg-blue-400' },
            { label: 'Carbs', current: totals.carbs, target: carbTarget, color: 'bg-amber-400' },
            { label: 'Fat', current: totals.fat, target: fatTarget, color: 'bg-red-400' },
          ].map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">{m.label}</span>
                <span className="text-gray-500">{Math.round(m.current)}g</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${m.color} transition-all duration-500`} style={{ width: `${getProgressPercent(m.current, m.target)}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-0.5">/ {m.target}g</div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal sections */}
      {MEALS.map(meal => {
        const entries = logs.filter(l => l.meal_type === meal);
        const mealCals = entries.reduce((s, l) => s + l.calories, 0);
        return (
          <div key={meal} className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">{MEAL_EMOJIS[meal]}</span>
                <span className="font-semibold text-gray-900 capitalize">{meal}</span>
                {mealCals > 0 && <span className="text-sm text-gray-500">· {Math.round(mealCals)} kcal</span>}
              </div>
              <button
                onClick={() => setAddingTo(meal)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {entries.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3 group hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{entry.food_name}</div>
                      <div className="text-xs text-gray-500">{entry.serving_size} {entry.serving_unit}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-gray-500 flex gap-3">
                        <span>P: {Math.round(entry.protein_g ?? 0)}g</span>
                        <span>C: {Math.round(entry.carbs_g ?? 0)}g</span>
                        <span>F: {Math.round(entry.fat_g ?? 0)}g</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 w-16 text-right">{Math.round(entry.calories)} kcal</div>
                    <button onClick={() => deleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-400">No entries yet</div>
            )}
          </div>
        );
      })}

      {addingTo && (
        <AddFoodModal
          mealType={addingTo}
          loggedDate={date}
          onAdd={addEntry}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  );
}
