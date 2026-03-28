import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProjectListPage from './pages/ProjectListPage';
import DashboardPage from './pages/DashboardPage';
import GraphPage from './pages/GraphPage';
import BranchListPage from './pages/BranchListPage';
import TimelinePage from './pages/TimelinePage';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import NotFoundPage from './pages/NotFoundPage';

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
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

  return (
    <MainLayout selectedAppId={selectedAppId} onAppChange={setSelectedAppId}>
      <Routes>
        {/* Project list — always accessible */}
        <Route
          path="/"
          element={
            <ProjectListPage onAppChange={setSelectedAppId} />
          }
        />

        {/* Project-scoped pages — require a selected project */}
        <Route
          path="/dashboard"
          element={
            selectedAppId ? (
              <DashboardPage appId={selectedAppId} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/graph"
          element={
            selectedAppId ? (
              <GraphPage appId={selectedAppId} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/branches"
          element={
            selectedAppId ? (
              <BranchListPage appId={selectedAppId} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/timeline"
          element={
            selectedAppId ? (
              <TimelinePage appId={selectedAppId} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        <Route path="/*" element={<AuthenticatedApp />} />
      </Routes>
    </AuthProvider>
  );
}
