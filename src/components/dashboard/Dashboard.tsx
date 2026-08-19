import { useEffect, useState } from 'react';
import { Flame, Droplets, TrendingUp, Plus, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate, getProgressPercent } from '../../lib/nutrition';
import type { FoodLogEntry } from '../../lib/types';
import type { AppView } from '../../lib/types';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

function RingChart({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = getProgressPercent(current, target);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{Math.round(current)}g / {target}g</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile } = useAuth();
  const [todayLogs, setTodayLogs] = useState<FoodLogEntry[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waterError, setWaterError] = useState<string | null>(null);

  const today = formatDate(new Date());

  useEffect(() => {
    async function load() {
      if (!profile) return;
      try {
        const [logsRes, waterRes] = await Promise.all([
          supabase.from('food_log').select('*').eq('user_id', profile.id).eq('logged_date', today),
          supabase.from('water_log').select('amount_ml').eq('user_id', profile.id).eq('logged_date', today),
        ]);
        
        if (logsRes.error) {
          console.warn('Food log error:', logsRes.error);
          setTodayLogs([]);
        } else {
          setTodayLogs((logsRes.data ?? []) as FoodLogEntry[]);
        }
        
        if (waterRes.error) {
          console.warn('Water log error:', waterRes.error);
          setWaterMl(0);
        } else {
          setWaterMl(((waterRes.data as any) ?? []).reduce((sum: number, r: any) => sum + (r.amount_ml ?? 0), 0));
        }

        // Simple streak: check last 7 days
        const dates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return formatDate(d);
        });
        let s = 0;
        for (const d of dates) {
          const { count, error } = await (supabase.from('food_log').select('id', { count: 'exact', head: true }) as any).eq('user_id', profile.id).eq('logged_date', d);
          if (!error && (count ?? 0) > 0) s++;
          else break;
        }
        setStreak(s);
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile, today]);

  const totalCalories = todayLogs.reduce((s, l) => s + l.calories, 0);
  const totalProtein = todayLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
  const totalCarbs = todayLogs.reduce((s, l) => s + (l.carbs_g ?? 0), 0);
  const totalFat = todayLogs.reduce((s, l) => s + (l.fat_g ?? 0), 0);

  const calTarget = profile?.daily_calorie_target ?? 2000;
  const protTarget = profile?.protein_target_g ?? 150;
  const carbTarget = profile?.carbs_target_g ?? 200;
  const fatTarget = profile?.fat_target_g ?? 65;
  const calPct = getProgressPercent(totalCalories, calTarget);

  const byMeal = ['breakfast', 'lunch', 'dinner', 'snack'].map(type => ({
    type,
    entries: todayLogs.filter(l => l.meal_type === type),
    calories: todayLogs.filter(l => l.meal_type === type).reduce((s, l) => s + l.calories, 0),
  }));

  const mealEmojis: Record<string, string> = {
    breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.full_name?.split(' ')[0] ?? 'there'}!
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Calories Left', value: Math.max(0, calTarget - Math.round(totalCalories)), unit: 'kcal', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Calories Eaten', value: Math.round(totalCalories), unit: 'kcal', icon: Zap, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Water', value: Math.round(waterMl / 1000 * 10) / 10, unit: 'L', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Day Streak', value: streak, unit: 'days', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calorie ring */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-5">Daily Calories</h3>
          <div className="flex items-center gap-6">
            <div className="relative">
              <RingChart percent={calPct} color="#22c55e" size={100} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{calPct}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="text-2xl font-bold text-gray-900">{Math.round(totalCalories)}</div>
                <div className="text-sm text-gray-500">of {calTarget} kcal</div>
              </div>
              <div className="text-xs text-gray-400">
                {Math.max(0, calTarget - Math.round(totalCalories))} kcal remaining
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <MacroBar label="Protein" current={totalProtein} target={protTarget} color="#3b82f6" />
            <MacroBar label="Carbs" current={totalCarbs} target={carbTarget} color="#f59e0b" />
            <MacroBar label="Fat" current={totalFat} target={fatTarget} color="#ef4444" />
          </div>
        </div>

        {/* Today's meals */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Today's Meals</h3>
            <button
              onClick={() => onNavigate('tracker')}
              className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:text-green-700"
            >
              <Plus className="w-4 h-4" />
              Log Food
            </button>
          </div>

          <div className="space-y-3">
            {byMeal.map(m => (
              <div key={m.type} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-2xl w-8 text-center">{mealEmojis[m.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 capitalize">{m.type}</div>
                  {m.entries.length > 0 ? (
                    <div className="text-xs text-gray-500 truncate">
                      {m.entries.map(e => e.food_name).join(', ')}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Nothing logged yet</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{m.calories > 0 ? `${m.calories} kcal` : '—'}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('tracker')}
            className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-green-300 hover:text-green-600 transition-all"
          >
            + Add food to log
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Generate Meal Plan', desc: 'AI-powered 7-day plan', icon: '🤖', view: 'meal-plan' as AppView, color: 'bg-green-600' },
          { label: 'Browse Recipes', desc: 'Find something delicious', icon: '🍽️', view: 'recipes' as AppView, color: 'bg-blue-600' },
          { label: 'View Progress', desc: 'Charts & milestones', icon: '📈', view: 'progress' as AppView, color: 'bg-amber-600' },
        ].map(a => (
          <button
            key={a.label}
            onClick={() => onNavigate(a.view)}
            className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className={`w-12 h-12 ${a.color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">{a.label}</div>
              <div className="text-xs text-gray-500">{a.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* Water tracker */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Water Intake</h3>
          </div>
          <span className="text-sm text-gray-500">{(waterMl / 1000).toFixed(1)}L / 2.5L goal</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (waterMl / 2500) * 100)}%` }}
            />
          </div>
          <div className="flex gap-2">
            {[250, 500].map(ml => (
              <button
                key={ml}
                onClick={async () => {
                  if (!profile) return;
                  setWaterError(null);
                  const { error } = await (supabase.from('water_log') as any).insert({ user_id: profile.id, logged_date: today, amount_ml: ml });
                  if (error) {
                    console.error('Error logging water:', error.message);
                    setWaterError(error.message);
                    return;
                  }
                  setWaterMl(w => w + ml);
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg transition-colors"
              >
                +{ml}ml
              </button>
            ))}
          </div>
        </div>
        {waterError && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">Couldn't log water: {waterError}</p>
        )}
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-8 rounded-lg transition-all ${
                i < Math.floor(waterMl / 250) ? 'bg-blue-400' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
