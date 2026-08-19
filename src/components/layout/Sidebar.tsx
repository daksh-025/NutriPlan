import {
  LayoutDashboard, Calendar, BookOpen, ClipboardList,
  ShoppingCart, TrendingUp, Settings, LogOut, Leaf, Crown, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { AppView } from '../../lib/types';

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'meal-plan', label: 'Meal Plan', icon: Calendar },
  { view: 'recipes', label: 'Recipes', icon: BookOpen },
  { view: 'tracker', label: 'Food Log', icon: ClipboardList },
  { view: 'grocery', label: 'Grocery List', icon: ShoppingCart },
  { view: 'progress', label: 'Progress', icon: TrendingUp },
];

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ currentView, onNavigate, mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, signOut } = useAuth();

  function navigate(view: AppView) {
    onNavigate(view);
    onMobileClose();
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">NutriPlan</span>
        </div>
        <button
          onClick={onMobileClose}
          className="lg:hidden text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Pro badge */}
      {profile?.subscription_tier === 'free' && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-amber-600">Unlock AI meal plans, advanced analytics & more.</p>
          <button
            onClick={() => navigate('settings')}
            className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
          >
            View Plans
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => navigate(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <button
          onClick={() => navigate('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-green-50 text-green-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings className={`w-5 h-5 ${currentView === 'settings' ? 'text-green-600' : 'text-gray-400'}`} />
          Settings
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-bold text-sm">
              {(profile?.full_name ?? profile?.email ?? 'U')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{profile?.full_name ?? 'User'}</div>
            <div className="text-xs text-gray-500 truncate capitalize">{profile?.subscription_tier ?? 'free'} plan</div>
          </div>
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 h-screen sticky top-0">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="relative w-72 flex flex-col h-full shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lg:hidden p-2 text-gray-500 hover:text-gray-900">
      <Menu className="w-6 h-6" />
    </button>
  );
}
