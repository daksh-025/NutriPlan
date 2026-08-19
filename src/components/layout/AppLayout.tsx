import { useState } from 'react';
import Sidebar, { MobileMenuButton } from './Sidebar';
import type { AppView } from '../../lib/types';
import Dashboard from '../dashboard/Dashboard';
import MealPlanPage from '../meal-plan/MealPlanPage';
import RecipesPage from '../recipes/RecipesPage';
import TrackerPage from '../tracker/TrackerPage';
import GroceryPage from '../grocery/GroceryPage';
import ProgressPage from '../progress/ProgressPage';
import SettingsPage from '../settings/SettingsPage';

export default function AppLayout() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const VIEW_TITLES: Record<AppView, string> = {
    dashboard: 'Dashboard',
    'meal-plan': 'Meal Plan',
    recipes: 'Recipes',
    tracker: 'Food Log',
    grocery: 'Grocery List',
    progress: 'Progress',
    settings: 'Settings',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <span className="font-semibold text-gray-900">{VIEW_TITLES[currentView]}</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
          {currentView === 'meal-plan' && <MealPlanPage />}
          {currentView === 'recipes' && <RecipesPage />}
          {currentView === 'tracker' && <TrackerPage />}
          {currentView === 'grocery' && <GroceryPage />}
          {currentView === 'progress' && <ProgressPage />}
          {currentView === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
