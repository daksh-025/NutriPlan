import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Leaf } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { computeTargets } from '../../lib/nutrition';
import type { Goal, ActivityLevel, DietaryPreference, Gender } from '../../lib/types';

interface WizardData {
  full_name: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  goal: Goal | '';
  activity_level: ActivityLevel | '';
  dietary_preference: DietaryPreference;
  food_allergies: string[];
  cuisine_preferences: string[];
}

const STEPS = ['Personal Details', 'Body Metrics', 'Your Goal', 'Lifestyle', 'Preferences'];

const GOALS: { value: Goal; label: string; desc: string; icon: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight', desc: 'Reduce body fat with a calorie deficit', icon: '🔥' },
  { value: 'maintain', label: 'Maintain Weight', desc: 'Stay at your current weight', icon: '⚖️' },
  { value: 'build_muscle', label: 'Build Muscle', desc: 'Gain lean mass with a calorie surplus', icon: '💪' },
  { value: 'eat_healthier', label: 'Eat Healthier', desc: 'Improve diet quality & nutrition', icon: '🥗' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise, desk job' },
  { value: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1–3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Hard exercise 6–7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active', desc: 'Physical job or 2x daily training' },
];

const DIETS: { value: DietaryPreference; label: string; icon: string }[] = [
  { value: 'none', label: 'No Preference', icon: '🍽️' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥦' },
  { value: 'keto', label: 'Keto', icon: '🥩' },
  { value: 'paleo', label: 'Paleo', icon: '🍖' },
  { value: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
  { value: 'gluten_free', label: 'Gluten Free', icon: '🌾' },
];

const ALLERGIES = ['Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Eggs', 'Soy', 'Fish', 'Sesame'];
const CUISINES = ['Italian', 'Asian', 'Mexican', 'Indian', 'Mediterranean', 'American', 'Japanese', 'French'];

export default function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WizardData>({
    full_name: '',
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    goal: '',
    activity_level: '',
    dietary_preference: 'none',
    food_allergies: [],
    cuisine_preferences: [],
  });

  function update(fields: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...fields }));
  }

  function toggleAllergy(a: string) {
    setData(prev => ({
      ...prev,
      food_allergies: prev.food_allergies.includes(a)
        ? prev.food_allergies.filter(x => x !== a)
        : [...prev.food_allergies, a],
    }));
  }

  function toggleCuisine(c: string) {
    setData(prev => ({
      ...prev,
      cuisine_preferences: prev.cuisine_preferences.includes(c)
        ? prev.cuisine_preferences.filter(x => x !== c)
        : [...prev.cuisine_preferences, c],
    }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!data.full_name.trim() && !!data.age && !!data.gender;
      case 1: return !!data.height_cm && !!data.weight_kg;
      case 2: return !!data.goal;
      case 3: return !!data.activity_level;
      case 4: return true;
      default: return false;
    }
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    setError(null);

    const profileData = {
      full_name: data.full_name,
      age: parseInt(data.age),
      gender: (data.gender || null) as Gender | null,
      height_cm: parseFloat(data.height_cm),
      weight_kg: parseFloat(data.weight_kg),
      goal: data.goal || null,
      activity_level: data.activity_level || null,
      dietary_preference: data.dietary_preference,
      food_allergies: data.food_allergies,
      cuisine_preferences: data.cuisine_preferences,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    const targets = computeTargets({
      weight_kg: parseFloat(data.weight_kg),
      height_cm: parseFloat(data.height_cm),
      age: parseInt(data.age),
      gender: (data.gender || null) as Gender | null,
      activity_level: data.activity_level as ActivityLevel,
      goal: data.goal as Goal,
    });

    const { error } = await (supabase.from('profiles') as any).update({
      ...profileData,
      ...(targets
        ? {
            daily_calorie_target: targets.daily_calorie_target,
            protein_target_g: targets.protein_g,
            carbs_target_g: targets.carbs_g,
            fat_target_g: targets.fat_g,
          }
        : {}),
    }).eq('id', user.id);
    if (error) {
      console.error('Error saving onboarding profile:', error.message);
      setError(`Couldn't save your profile: ${error.message}`);
      setSaving(false);
      return;
    }
    await refreshProfile();
    const { data: updated } = await (supabase.from('profiles') as any).select('onboarding_complete').eq('id', user.id).maybeSingle();
    if (!(updated as { onboarding_complete?: boolean })?.onboarding_complete) {
      setSaving(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">NutriPlan</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm font-medium text-green-600">{STEPS[step]}</span>
          </div>
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Step 0: Personal Details */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
              <p className="text-gray-500 mb-8">We'll use this to personalize your experience.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={data.full_name}
                    onChange={e => update({ full_name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={data.age}
                    onChange={e => update({ age: e.target.value })}
                    placeholder="25"
                    min={13}
                    max={100}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Biological Sex</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['male', 'female', 'other']).map((g: any) => (
                      <button
                        key={g}
                        onClick={() => update({ gender: g })}
                        className={`py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          data.gender === g
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚬ Other'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Body Metrics */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your body metrics</h2>
              <p className="text-gray-500 mb-8">Used to calculate your personalized calorie targets.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={data.height_cm}
                    onChange={e => update({ height_cm: e.target.value })}
                    placeholder="170"
                    min={100}
                    max={250}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Weight (kg)</label>
                  <input
                    type="number"
                    value={data.weight_kg}
                    onChange={e => update({ weight_kg: e.target.value })}
                    placeholder="70"
                    min={30}
                    max={300}
                    step={0.1}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {data.height_cm && data.weight_kg && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="text-sm text-blue-600 font-medium">
                      BMI: {(parseFloat(data.weight_kg) / Math.pow(parseFloat(data.height_cm) / 100, 2)).toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-400 mt-1">Body Mass Index — for reference only</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your main goal?</h2>
              <p className="text-gray-500 mb-8">Your meal plans and calorie targets will be optimized for this.</p>
              <div className="space-y-3">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => update({ goal: g.value })}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      data.goal === g.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl">{g.icon}</span>
                    <div className="flex-1">
                      <div className={`font-semibold ${data.goal === g.value ? 'text-green-700' : 'text-gray-900'}`}>{g.label}</div>
                      <div className="text-sm text-gray-500">{g.desc}</div>
                    </div>
                    {data.goal === g.value && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Activity Level + Diet */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your lifestyle</h2>
              <p className="text-gray-500 mb-6">This affects your daily calorie needs.</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Activity Level</label>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map(a => (
                    <button
                      key={a.value}
                      onClick={() => update({ activity_level: a.value })}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                        data.activity_level === a.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${data.activity_level === a.value ? 'text-green-700' : 'text-gray-900'}`}>{a.label}</div>
                        <div className="text-xs text-gray-500">{a.desc}</div>
                      </div>
                      {data.activity_level === a.value && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {DIETS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => update({ dietary_preference: d.value })}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                        data.dietary_preference === d.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{d.icon}</span>
                      <span className={`text-sm font-medium ${data.dietary_preference === d.value ? 'text-green-700' : 'text-gray-700'}`}>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Allergies + Cuisine */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Food preferences</h2>
              <p className="text-gray-500 mb-6">Help us avoid foods you can't or don't want to eat.</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Allergies & Intolerances <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGIES.map(a => (
                    <button
                      key={a}
                      onClick={() => toggleAllergy(a)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        data.food_allergies.includes(a)
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {data.food_allergies.includes(a) ? '✕ ' : ''}{a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Favourite Cuisines <span className="text-gray-400 font-normal">(select all that apply)</span></label>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleCuisine(c)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        data.cuisine_preferences.includes(c)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {data.goal && data.activity_level && data.weight_kg && data.height_cm && data.age && (
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="text-sm font-semibold text-green-800 mb-2">Your estimated targets</div>
                  {(() => {
                    const t = computeTargets({
                      weight_kg: parseFloat(data.weight_kg),
                      height_cm: parseFloat(data.height_cm),
                      age: parseInt(data.age),
                      gender: (data.gender || null) as Gender | null,
                      activity_level: data.activity_level as ActivityLevel,
                      goal: data.goal as Goal,
                    });
                    if (!t) return null;
                    return (
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Calories', value: t.daily_calorie_target, unit: 'kcal' },
                          { label: 'Protein', value: t.protein_g, unit: 'g' },
                          { label: 'Carbs', value: t.carbs_g, unit: 'g' },
                          { label: 'Fat', value: t.fat_g, unit: 'g' },
                        ].map(m => (
                          <div key={m.label} className="text-center">
                            <div className="text-lg font-bold text-green-700">{m.value}</div>
                            <div className="text-xs text-green-600">{m.label} ({m.unit})</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 w-full">
                {error}
              </p>
            )}
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Get Started
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
