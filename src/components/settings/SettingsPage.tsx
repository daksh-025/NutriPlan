import { useState } from 'react';
import { User, Lock, Bell, Download, Trash2, Crown, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { computeTargets } from '../../lib/nutrition';
import type { ActivityLevel, Goal, DietaryPreference } from '../../lib/types';

type SettingsSection = 'profile' | 'goals' | 'subscription' | 'account';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Basic meal logging', '7-day meal planning', 'Recipe library', 'Grocery lists'],
    missing: ['AI meal generation', 'Advanced analytics', 'Micronutrients', 'Weekly email reports'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: '/month',
    popular: true,
    features: ['Everything in Free', 'AI-powered meal plans', 'Advanced analytics', 'Micronutrient tracking', 'Weekly email reports', 'Priority support'],
    missing: [],
  },
  {
    id: 'family',
    name: 'Family',
    price: '$19',
    period: '/month',
    features: ['Everything in Pro', 'Up to 5 profiles', 'Shared grocery lists', 'Family meal planning', 'Dedicated support'],
    missing: [],
  },
];

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [section, setSection] = useState<SettingsSection>('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name ?? '',
    age: String(profile?.age ?? ''),
    height_cm: String(profile?.height_cm ?? ''),
    weight_kg: String(profile?.weight_kg ?? ''),
    units: profile?.units ?? 'metric',
  });

  const [goalsForm, setGoalsForm] = useState({
    goal: (profile?.goal ?? 'maintain') as Goal,
    activity_level: (profile?.activity_level ?? 'moderately_active') as ActivityLevel,
    dietary_preference: (profile?.dietary_preference ?? 'none') as DietaryPreference,
    daily_calorie_target: String(profile?.daily_calorie_target ?? ''),
    protein_target_g: String(profile?.protein_target_g ?? ''),
    carbs_target_g: String(profile?.carbs_target_g ?? ''),
    fat_target_g: String(profile?.fat_target_g ?? ''),
  });

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from('profiles') as any).update({
        full_name: profileForm.full_name,
        age: parseInt(profileForm.age) || null,
        height_cm: parseFloat(profileForm.height_cm) || null,
        weight_kg: parseFloat(profileForm.weight_kg) || null,
        units: profileForm.units,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);
      
      if (error) {
        console.error('Profile save error:', error);
        setSuccess('');
      } else {
        await refreshProfile();
        setSuccess('Profile updated.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Save profile error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function saveGoals() {
    if (!profile) return;
    setSaving(true);
    try {
      const targets = computeTargets({
        weight_kg: parseFloat(profileForm.weight_kg) || (profile.weight_kg ?? undefined),
        height_cm: parseFloat(profileForm.height_cm) || (profile.height_cm ?? undefined),
        age: parseInt(profileForm.age) || (profile.age ?? undefined),
        gender: profile.gender ?? 'male',
        activity_level: goalsForm.activity_level,
        goal: goalsForm.goal,
      });
      const { error } = await (supabase.from('profiles') as any).update({
        goal: goalsForm.goal,
        activity_level: goalsForm.activity_level,
        dietary_preference: goalsForm.dietary_preference,
        daily_calorie_target: parseInt(goalsForm.daily_calorie_target) || targets?.daily_calorie_target || null,
        protein_target_g: parseInt(goalsForm.protein_target_g) || targets?.protein_g || null,
        carbs_target_g: parseInt(goalsForm.carbs_target_g) || targets?.carbs_g || null,
        fat_target_g: parseInt(goalsForm.fat_target_g) || targets?.fat_g || null,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id);
      
      if (error) {
        console.error('Goals save error:', error);
        setSuccess('');
      } else {
        await refreshProfile();
        setSuccess('Goals updated.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Save goals error:', error);
    } finally {
      setSaving(false);
    }
  }

  function recalcTargets() {
    const t = computeTargets({
      weight_kg: parseFloat(profileForm.weight_kg) || (profile?.weight_kg ?? undefined),
      height_cm: parseFloat(profileForm.height_cm) || (profile?.height_cm ?? undefined),
      age: parseInt(profileForm.age) || (profile?.age ?? undefined),
      gender: profile?.gender ?? 'male',
      activity_level: goalsForm.activity_level,
      goal: goalsForm.goal,
    });
    if (t) {
      setGoalsForm(f => ({
        ...f,
        daily_calorie_target: String(t.daily_calorie_target),
        protein_target_g: String(t.protein_g),
        carbs_target_g: String(t.carbs_g),
        fat_target_g: String(t.fat_g),
      }));
    }
  }

  const SECTIONS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'goals', label: 'Goals & Targets', icon: ChevronRight },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'account', label: 'Account', icon: Lock },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 hidden sm:block">
          <nav className="space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    section === s.id ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${section === s.id ? 'text-green-600' : 'text-gray-400'}`} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex gap-1 overflow-x-auto mb-4 flex-shrink-0">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${section === s.id ? 'bg-green-50 text-green-700' : 'text-gray-600'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
              <Check className="w-4 h-4" /> {success}
            </div>
          )}

          {/* Profile */}
          {section === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Personal Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
                  <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Age</label>
                    <input type="number" value={profileForm.age} onChange={e => setProfileForm(f => ({ ...f, age: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Units</label>
                    <select value={profileForm.units} onChange={e => setProfileForm(f => ({ ...f, units: e.target.value as 'metric' | 'imperial' }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="metric">Metric (kg, cm)</option>
                      <option value="imperial">Imperial (lbs, ft)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Height (cm)</label>
                    <input type="number" value={profileForm.height_cm} onChange={e => setProfileForm(f => ({ ...f, height_cm: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Weight (kg)</label>
                    <input type="number" step={0.1} value={profileForm.weight_kg} onChange={e => setProfileForm(f => ({ ...f, weight_kg: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <button onClick={saveProfile} disabled={saving}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Goals */}
          {section === 'goals' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Goals & Nutrition Targets</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Goal</label>
                    <select value={goalsForm.goal} onChange={e => setGoalsForm(f => ({ ...f, goal: e.target.value as Goal }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="lose_weight">Lose Weight</option>
                      <option value="maintain">Maintain</option>
                      <option value="build_muscle">Build Muscle</option>
                      <option value="eat_healthier">Eat Healthier</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Activity Level</label>
                    <select value={goalsForm.activity_level} onChange={e => setGoalsForm(f => ({ ...f, activity_level: e.target.value as ActivityLevel }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="sedentary">Sedentary</option>
                      <option value="lightly_active">Lightly Active</option>
                      <option value="moderately_active">Moderately Active</option>
                      <option value="very_active">Very Active</option>
                      <option value="extremely_active">Extremely Active</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Dietary Preference</label>
                    <select value={goalsForm.dietary_preference} onChange={e => setGoalsForm(f => ({ ...f, dietary_preference: e.target.value as DietaryPreference }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="none">No Preference</option>
                      <option value="vegan">Vegan</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="keto">Keto</option>
                      <option value="paleo">Paleo</option>
                      <option value="mediterranean">Mediterranean</option>
                      <option value="gluten_free">Gluten Free</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Daily Targets</span>
                    <button onClick={recalcTargets} className="text-xs text-green-600 font-medium hover:text-green-700">
                      Auto-calculate from metrics
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Calories (kcal)', key: 'daily_calorie_target' as const },
                      { label: 'Protein (g)', key: 'protein_target_g' as const },
                      { label: 'Carbs (g)', key: 'carbs_target_g' as const },
                      { label: 'Fat (g)', key: 'fat_target_g' as const },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
                        <input type="number" value={goalsForm[f.key]}
                          onChange={e => setGoalsForm(g => ({ ...g, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveGoals} disabled={saving}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
                  {saving ? 'Saving...' : 'Save Goals'}
                </button>
              </div>
            </div>
          )}

          {/* Subscription */}
          {section === 'subscription' && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <div>
                    <div className="font-semibold text-gray-900">Current Plan: <span className="capitalize">{profile?.subscription_tier ?? 'free'}</span></div>
                    <div className="text-sm text-gray-500">
                      {profile?.subscription_tier === 'free' ? 'Upgrade to unlock AI meal generation and more.' : 'You have full access to all features.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                  <div key={plan.id} className={`bg-white rounded-2xl border-2 p-5 relative ${plan.popular ? 'border-green-500' : 'border-gray-200'}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        POPULAR
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="font-bold text-gray-900">{plan.name}</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">
                        {plan.price}<span className="text-sm font-normal text-gray-500">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={profile?.subscription_tier === plan.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        profile?.subscription_tier === plan.id
                          ? 'bg-gray-100 text-gray-500 cursor-default'
                          : plan.popular
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {profile?.subscription_tier === plan.id ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account */}
          {section === 'account' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Download className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Export Your Data</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Download all your nutrition logs, weight entries, and meal plans as a JSON or CSV file.</p>
                <div className="flex gap-3">
                  <button className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-xl transition-colors">
                    Export as JSON
                  </button>
                  <button className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-xl transition-colors">
                    Export as CSV
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">Delete Account</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl border border-red-200 transition-colors">
                  Delete My Account
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="space-y-3 mt-4">
                  {[
                    { label: 'Daily log reminder', desc: 'Get reminded to log your meals' },
                    { label: 'Weekly summary', desc: 'Receive a weekly nutrition report' },
                    { label: 'Milestone alerts', desc: 'Celebrate your achievements' },
                  ].map(n => (
                    <div key={n.label} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{n.label}</div>
                        <div className="text-xs text-gray-500">{n.desc}</div>
                      </div>
                      <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
