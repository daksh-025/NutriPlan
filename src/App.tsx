import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import OnboardingWizard from './components/onboarding/OnboardingWizard';
import AppLayout from './components/layout/AppLayout';

function AppContent() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading NutriPlan...</p>
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage />;
  if (profile && !profile.onboarding_complete) return <OnboardingWizard />;
  return <AppLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
