import { useState, useEffect } from 'react';
import { Search, Heart, Clock, Flame, Filter, X, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MOCK_RECIPES, CUISINES, DIET_TAGS, type RecipeItem } from '../../lib/mockRecipes';

function NutriBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-bold ${color}`}>{value}g</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function RecipeCard({ recipe, saved, onToggleSave, onSelect }: {
  recipe: RecipeItem;
  saved: boolean;
  onToggleSave: () => void;
  onSelect: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer" onClick={onSelect}>
      <div className="relative">
        <img src={recipe.image} alt={recipe.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
        <button
          onClick={e => { e.stopPropagation(); onToggleSave(); }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
            saved ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {recipe.mealType.map(t => (
            <span key={t} className="px-2 py-0.5 bg-white/90 text-gray-700 text-xs font-medium rounded-full capitalize">{t}</span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{recipe.name}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{recipe.prepTime}m</span>
          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{recipe.calories} kcal</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{recipe.difficulty}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <NutriBadge label="Protein" value={recipe.protein} color="text-blue-600" />
            <NutriBadge label="Carbs" value={recipe.carbs} color="text-amber-600" />
            <NutriBadge label="Fat" value={recipe.fat} color="text-red-500" />
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}

function RecipeModal({ recipe, saved, onToggleSave, onClose }: {
  recipe: RecipeItem;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <img src={recipe.image} alt={recipe.name} className="w-full h-56 object-cover rounded-t-2xl" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{recipe.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{recipe.prepTime} min</span>
                <span>{recipe.servings} servings</span>
                <span>{recipe.cuisine}</span>
              </div>
            </div>
            <button
              onClick={onToggleSave}
              className={`p-2.5 rounded-xl transition-all ${saved ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl mb-5">
            {[
              { label: 'Calories', value: recipe.calories, unit: 'kcal', color: 'text-orange-600' },
              { label: 'Protein', value: recipe.protein, unit: 'g', color: 'text-blue-600' },
              { label: 'Carbs', value: recipe.carbs, unit: 'g', color: 'text-amber-600' },
              { label: 'Fat', value: recipe.fat, unit: 'g', color: 'text-red-500' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-gray-500">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {recipe.tags.map(t => (
              <span key={t} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">{t}</span>
            ))}
          </div>

          {/* Ingredients */}
          <div className="mb-5">
            <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{recipe.instructions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function loadSaved() {
      if (!profile) return;
      try {
        const { data, error } = await (supabase.from('saved_recipes') as any).select('external_id').eq('user_id', profile.id);
        if (error) {
          console.warn('Saved recipes load error:', error);
          setSavedIds(new Set());
        } else {
          setSavedIds(new Set((data ?? []).map((r: any) => r.external_id ?? '')));
        }
      } catch (error) {
        console.error('Saved recipes load error:', error);
        setSavedIds(new Set());
      }
    }
    loadSaved();
  }, [profile]);

  async function toggleSave(recipe: RecipeItem) {
    if (!profile) return;
    try {
      if (savedIds.has(recipe.id)) {
        const { error } = await supabase.from('saved_recipes').delete().eq('user_id', profile.id).eq('external_id', recipe.id);
        if (error) {
          console.error('Error unsaving recipe:', error);
          return;
        }
        setSavedIds(prev => { const s = new Set(prev); s.delete(recipe.id); return s; });
      } else {
        const { error } = await supabase.from('saved_recipes').insert({
          user_id: profile.id,
          external_id: recipe.id,
          recipe_name: recipe.name,
          image_url: recipe.image,
          calories_per_serving: recipe.calories,
          protein_g: recipe.protein,
          carbs_g: recipe.carbs,
          fat_g: recipe.fat,
          prep_time_mins: recipe.prepTime,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          tags: recipe.tags,
        } as any);
        if (error) {
          console.error('Error saving recipe:', error);
          return;
        }
        setSavedIds(prev => new Set([...prev, recipe.id]));
      }
    } catch (error) {
      console.error('Toggle save error:', error);
    }
  }

  const filtered = MOCK_RECIPES.filter(r => {
    if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (selectedCuisine && r.cuisine !== selectedCuisine) return false;
    if (selectedTag && !r.tags.includes(selectedTag)) return false;
    if (selectedMeal && !r.mealType.includes(selectedMeal)) return false;
    return true;
  });

  const hasFilters = selectedCuisine || selectedTag || selectedMeal;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recipe Library</h1>
        <p className="text-gray-500 text-sm mt-1">{MOCK_RECIPES.length} recipes • Search, filter, and save your favourites</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
            hasFilters
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters{hasFilters ? ` (${[selectedCuisine, selectedTag, selectedMeal].filter(Boolean).length})` : ''}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Meal Type</label>
            <div className="flex flex-wrap gap-2">
              {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMeal(selectedMeal === m ? '' : m)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize transition-all ${
                    selectedMeal === m ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Cuisine</label>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(selectedCuisine === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedCuisine === c ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Diet</label>
            <div className="flex flex-wrap gap-2">
              {DIET_TAGS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedTag === t ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSelectedCuisine(''); setSelectedTag(''); setSelectedMeal(''); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-4">
        Showing {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Recipe grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">No recipes found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              saved={savedIds.has(recipe.id)}
              onToggleSave={() => toggleSave(recipe)}
              onSelect={() => setSelectedRecipe(recipe)}
            />
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          saved={savedIds.has(selectedRecipe.id)}
          onToggleSave={() => toggleSave(selectedRecipe)}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
