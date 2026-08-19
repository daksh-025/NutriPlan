import { useEffect, useState } from 'react';
import { Plus, TrendingDown, TrendingUp, Minus, Trophy, Flame, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate, addDays } from '../../lib/nutrition';
import type { WeightEntry } from '../../lib/types';

function MiniBarChart({ data, color, max }: { data: { label: string; value: number }[]; color: string; max: number }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end h-20">
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{ height: `${max > 0 ? Math.max(2, (d.value / max) * 100) : 2}%`, backgroundColor: color, opacity: 0.85 }}
            />
          </div>
          <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return (
    <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
      Log at least 2 entries to see a chart
    </div>
  );

  const weights = entries.map(e => e.weight_kg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW;
  const w = 100 / (entries.length - 1);

  const points = entries.map((e, i) => ({
    x: i * w,
    y: 100 - ((e.weight_kg - minW) / range) * 100,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} 100 L 0 100 Z`;

  return (
    <div className="relative h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#wGrad)" />
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#22c55e" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}

export default function ProgressPage() {
  const { profile } = useAuth();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [calHistory, setCalHistory] = useState<{ label: string; value: number }[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [period, setPeriod] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      setLoading(true);
      try {
        const [weightRes, logsRes] = await Promise.all([
          (supabase.from('weight_log') as any).select('*').eq('user_id', profile.id).order('logged_date', { ascending: true }).limit(90),
          (supabase.from('food_log') as any).select('logged_date, calories').eq('user_id', profile.id).gte('logged_date', formatDate(addDays(new Date(), -period + 1))),
        ]);

        if (weightRes.error) {
          console.warn('Weight log fetch error:', weightRes.error);
          setWeightEntries([]);
        } else {
          setWeightEntries((weightRes.data ?? []) as WeightEntry[]);
        }

        // Aggregate calories by date
        const calMap: Record<string, number> = {};
        if (!logsRes.error) {
          (logsRes.data ?? []).forEach((l: { logged_date: string; calories: number }) => {
            calMap[l.logged_date] = (calMap[l.logged_date] ?? 0) + l.calories;
          });
        } else {
          console.warn('Food log fetch error:', logsRes.error);
        }

        const history = Array.from({ length: period }, (_, i) => {
          const d = addDays(new Date(), -(period - 1 - i));
          const key = formatDate(d);
          return {
            label: period === 7
              ? d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
              : d.getDate().toString(),
            value: Math.round(calMap[key] ?? 0),
          };
        });
        setCalHistory(history);
      } catch (error) {
        console.error('Progress page load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile, period]);

  async function logWeight() {
    if (!newWeight || !profile) return;
    const kg = parseFloat(newWeight);
    if (isNaN(kg)) return;
    try {
      const today = formatDate(new Date());
      const { data, error } = await (supabase.from('weight_log') as any).insert({ user_id: profile.id, logged_date: today, weight_kg: kg }).select().single();
      if (error) {
        console.error('Weight log error:', error);
        return;
      }
      if (data) setWeightEntries(prev => [...prev, data as WeightEntry]);
      setNewWeight('');
    } catch (error) {
      console.error('Log weight error:', error);
    }
  }

  const latestWeight = weightEntries[weightEntries.length - 1]?.weight_kg;
  const prevWeight = weightEntries[weightEntries.length - 2]?.weight_kg;
  const weightChange = latestWeight && prevWeight ? latestWeight - prevWeight : null;
  const startWeight = weightEntries[0]?.weight_kg;
  const totalChange = latestWeight && startWeight ? latestWeight - startWeight : null;

  const avgCals = calHistory.filter(d => d.value > 0).reduce((s, d, _, a) => s + d.value / a.length, 0);
  const calTarget = profile?.daily_calorie_target ?? 2000;

  const milestones = [
    { label: '7-Day Streak', icon: '🔥', achieved: false, desc: 'Log food 7 days in a row' },
    { label: 'First Log', icon: '📝', achieved: calHistory.some(d => d.value > 0), desc: 'Log your first meal' },
    { label: 'Weight Tracker', icon: '⚖️', achieved: weightEntries.length > 0, desc: 'Log your weight' },
    { label: '30 Days', icon: '🏆', achieved: false, desc: 'Track for 30 days' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-500 text-sm mt-1">Track your nutrition trends and milestones</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Current Weight',
            value: latestWeight ? `${latestWeight} kg` : '—',
            sub: weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'No data',
            icon: weightChange !== null ? (weightChange < 0 ? TrendingDown : TrendingUp) : Minus,
            iconColor: weightChange !== null ? (weightChange < 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400',
            bg: 'bg-green-50',
          },
          {
            label: 'Total Change',
            value: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} kg` : '—',
            sub: `from ${startWeight ?? '—'} kg`,
            icon: Target,
            iconColor: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            label: 'Avg Daily Calories',
            value: avgCals > 0 ? `${Math.round(avgCals)}` : '—',
            sub: `target: ${calTarget} kcal`,
            icon: Flame,
            iconColor: 'text-orange-500',
            bg: 'bg-orange-50',
          },
          {
            label: 'Days Logged',
            value: calHistory.filter(d => d.value > 0).length,
            sub: `last ${period} days`,
            icon: Trophy,
            iconColor: 'text-amber-500',
            bg: 'bg-amber-50',
          },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Calorie history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Calorie History</h3>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {([7, 30] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p}d
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <>
              <MiniBarChart data={calHistory} color="#22c55e" max={Math.max(...calHistory.map(d => d.value), calTarget)} />
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded-sm inline-block" /> Actual</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 inline-block" /> Target: {calTarget} kcal</span>
              </div>
            </>
          )}
        </div>

        {/* Weight tracking */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Weight Trend</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                placeholder={`${latestWeight ?? 70} kg`}
                step={0.1}
                min={30}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={logWeight}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Log
              </button>
            </div>
          </div>
          <WeightChart entries={weightEntries.slice(-30)} />
          {weightEntries.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              {weightEntries.length} entries recorded
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Milestones & Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {milestones.map(m => (
            <div
              key={m.label}
              className={`p-4 rounded-xl text-center border-2 transition-all ${
                m.achieved ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              <div className={`text-3xl mb-2 ${!m.achieved && 'grayscale opacity-40'}`}>{m.icon}</div>
              <div className={`text-sm font-semibold ${m.achieved ? 'text-amber-700' : 'text-gray-500'}`}>{m.label}</div>
              <div className="text-xs text-gray-400 mt-1">{m.desc}</div>
              {m.achieved && <div className="text-xs text-amber-600 font-medium mt-1">Achieved!</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
