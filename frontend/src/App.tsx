import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy-loaded page components for code splitting
const ProjectListPage = lazy(() => import('./pages/ProjectListPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const BranchListPage = lazy(() => import('./pages/BranchListPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function AuthenticatedApp() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-2">Account Restricted</h1>
          <p className="text-sm text-surface-500 mb-4">
            Your account has been restricted by an administrator.
          </p>
          {user.restrictionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Reason:</strong> {user.restrictionReason}
              </p>
            </div>
          )}
          <p className="text-xs text-surface-400 mb-6">
            If you believe this is an error, please contact the administrator.
          </p>
          <button
            onClick={logout}
            className="px-6 py-2 bg-surface-800 text-white rounded-xl text-sm font-medium hover:bg-surface-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout selectedAppId={selectedAppId} onAppChange={setSelectedAppId}>
      <Routes>
        {/* Project list — always accessible */}
        <Route path="/" element={<ProjectListPage onAppChange={setSelectedAppId} />} />

        {/* Admin settings — only for admin users */}
        {user?.isAdmin && <Route path="/admin/settings" element={<AdminSettingsPage />} />}

        {/* Project-scoped pages — require a selected project */}
        <Route
          path="/dashboard"
          element={
            selectedAppId ? <DashboardPage appId={selectedAppId} /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/graph"
          element={
            selectedAppId ? <GraphPage appId={selectedAppId} /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/branches"
          element={
            selectedAppId ? <BranchListPage appId={selectedAppId} /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/timeline"
          element={
            selectedAppId ? <TimelinePage appId={selectedAppId} /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}

/**
 * Top-level routing: checks if first-run setup is needed before showing the app.
 */
function AppRoutes() {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => setSetupRequired(!data.setupComplete))
      .catch(() => setSetupRequired(false)); // assume setup done if can't reach backend
  }, []);

  if (setupRequired === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        {setupRequired ? (
          <Route path="*" element={<Navigate to="/setup" replace />} />
        ) : (
          <Route path="/*" element={<AuthenticatedApp />} />
        )}
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
