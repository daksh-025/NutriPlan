import { useEffect, useState } from 'react';
import { Plus, Check, Trash2, ShoppingCart, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { GroceryList, GroceryItem } from '../../lib/types';

const CATEGORIES = ['produce', 'protein', 'dairy', 'grains', 'pantry', 'frozen', 'beverages', 'other'];
const CATEGORY_ICONS: Record<string, string> = {
  produce: '🥦', protein: '🥩', dairy: '🥛', grains: '🌾', pantry: '🫙', frozen: '🧊', beverages: '🥤', other: '📦',
};

const SUGGESTED_ITEMS = [
  { name: 'Chicken Breast', category: 'protein', quantity: '500g' },
  { name: 'Salmon Fillet', category: 'protein', quantity: '300g' },
  { name: 'Greek Yogurt', category: 'dairy', quantity: '500g' },
  { name: 'Eggs', category: 'dairy', quantity: '12 pack' },
  { name: 'Broccoli', category: 'produce', quantity: '1 head' },
  { name: 'Spinach', category: 'produce', quantity: '200g' },
  { name: 'Brown Rice', category: 'grains', quantity: '1kg' },
  { name: 'Quinoa', category: 'grains', quantity: '500g' },
  { name: 'Olive Oil', category: 'pantry', quantity: '500ml' },
  { name: 'Avocado', category: 'produce', quantity: '3 pcs' },
  { name: 'Almond Milk', category: 'beverages', quantity: '1L' },
  { name: 'Oats', category: 'grains', quantity: '500g' },
];

export default function GroceryPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<GroceryList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newCategory, setNewCategory] = useState('other');
  const [showAddForm, setShowAddForm] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      if (!profile) return;
      try {
        const { data: listData, error: listError } = await supabase
          .from('grocery_lists')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (listError) {
          console.warn('Grocery list fetch error:', listError);
          setList(null);
          setItems([]);
        } else if (listData) {
          setList(listData as any);
          const { data: itemData, error: itemError } = await (supabase.from('grocery_items') as any).select('*').eq('grocery_list_id', (listData as any).id).order('created_at');
          if (itemError) {
            console.warn('Grocery items fetch error:', itemError);
            setItems([]);
          } else {
            setItems((itemData ?? []) as GroceryItem[]);
          }
        }
      } catch (error) {
        console.error('Grocery list load error:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  async function ensureList(): Promise<string> {
    if (list) return list.id;
    if (!profile) throw new Error('No profile');
    try {
      const { data, error } = await supabase.from('grocery_lists').insert({ user_id: profile.id, name: 'My Grocery List' } as any).select().single();
      if (error || !data) {
        console.error('Ensure list error:', error);
        throw error || new Error('Failed to create list');
      }
      setList(data as any as GroceryList);
      return (data as any).id;
    } catch (error) {
      console.error('Ensure list error:', error);
      throw error;
    }
  }

  async function addItem() {
    if (!newItem.trim()) return;
    try {
      const listId = await ensureList();
      const { data, error } = await supabase.from('grocery_items').insert({
        grocery_list_id: listId,
        name: newItem.trim(),
        quantity: newQty.trim() || null,
        category: newCategory,
        is_custom: true,
      } as any).select().single();
      if (error || !data) {
        console.error('Add item error:', error);
        return;
      }
      setItems(prev => [...prev, data as GroceryItem]);
      setNewItem('');
      setNewQty('');
      setNewCategory('other');
      setShowAddForm(false);
    } catch (error) {
      console.error('Add item error:', error);
    }
  }

  async function addSuggested(s: typeof SUGGESTED_ITEMS[0]) {
    try {
      const listId = await ensureList();
      const { data, error } = await supabase.from('grocery_items').insert({
        grocery_list_id: listId,
        name: s.name,
        quantity: s.quantity,
        category: s.category,
        is_custom: false,
      } as any).select().single();
      if (error || !data) {
        console.error('Add suggested error:', error);
        return;
      }
      setItems(prev => [...prev, data as GroceryItem]);
    } catch (error) {
      console.error('Add suggested error:', error);
    }
  }

  async function toggleCheck(item: GroceryItem) {
    try {
      const { error } = await (supabase.from('grocery_items') as any).update({ is_checked: !item.is_checked }).eq('id', item.id);
      if (error) {
        console.error('Toggle check error:', error);
        return;
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i));
    } catch (error) {
      console.error('Toggle check error:', error);
    }
  }

  async function deleteItem(id: string) {
    try {
      const { error } = await supabase.from('grocery_items').delete().eq('id', id);
      if (error) {
        console.error('Delete item error:', error);
        return;
      }
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Delete item error:', error);
    }
  }

  async function clearChecked() {
    const checkedIds = items.filter(i => i.is_checked).map(i => i.id);
    if (checkedIds.length === 0) return;
    try {
      const { error } = await supabase.from('grocery_items').delete().in('id', checkedIds);
      if (error) {
        console.error('Clear checked error:', error);
        return;
      }
      setItems(prev => prev.filter(i => !i.is_checked));
    } catch (error) {
      console.error('Clear checked error:', error);
    }
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories(prev => {
      const s = new Set(prev);
      if (s.has(cat)) s.delete(cat);
      else s.add(cat);
      return s;
    });
  }

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  const checkedCount = items.filter(i => i.is_checked).length;
  const totalCount = items.length;
  const suggestionsNotAdded = SUGGESTED_ITEMS.filter(s => !items.some(i => i.name === s.name));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grocery List</h1>
          {totalCount > 0 && <p className="text-gray-500 text-sm mt-1">{checkedCount} of {totalCount} items checked</p>}
        </div>
        <div className="flex gap-2">
          {checkedCount > 0 && (
            <button onClick={clearChecked}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
              Clear checked
            </button>
          )}
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Shopping progress</span>
            <span className="text-gray-500">{checkedCount}/{totalCount}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
          {checkedCount === totalCount && totalCount > 0 && (
            <p className="text-sm text-green-600 font-medium mt-2 text-center">Shopping complete!</p>
          )}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Add custom item</h3>
            <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="space-y-3">
            <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Item name"
              onKeyDown={e => e.key === 'Enter' && addItem()}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={newQty} onChange={e => setNewQty(e.target.value)} placeholder="Quantity (optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <button onClick={addItem}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors">
              Add to List
            </button>
          </div>
        </div>
      )}

      {/* Items by category */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : Object.keys(byCategory).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">Your list is empty</h3>
          <p className="text-gray-400 text-sm mb-4">Add items manually or pick from suggestions below</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {Object.entries(byCategory).map(([cat, catItems]) => {
            const collapsed = collapsedCategories.has(cat);
            const catChecked = catItems.filter(i => i.is_checked).length;
            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                    <span className="font-semibold text-gray-900 capitalize">{cat}</span>
                    <span className="text-sm text-gray-500">({catChecked}/{catItems.length})</span>
                  </div>
                  {collapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                </button>

                {!collapsed && (
                  <div className="divide-y divide-gray-50">
                    {catItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 px-5 py-3 group hover:bg-gray-50">
                        <button
                          onClick={() => toggleCheck(item)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            item.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {item.is_checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                          {item.quantity && <span className="text-xs text-gray-500 ml-2">{item.quantity}</span>}
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestions */}
      {suggestionsNotAdded.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Add Suggestions</h3>
          <div className="flex flex-wrap gap-2">
            {suggestionsNotAdded.slice(0, 8).map(s => (
              <button
                key={s.name}
                onClick={() => addSuggested(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 text-sm rounded-xl border border-gray-200 hover:border-green-200 transition-all"
              >
                <Plus className="w-3 h-3" />
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
