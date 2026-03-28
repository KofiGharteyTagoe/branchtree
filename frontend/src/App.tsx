import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import ProjectListPage from './pages/ProjectListPage';
import DashboardPage from './pages/DashboardPage';
import GraphPage from './pages/GraphPage';
import BranchListPage from './pages/BranchListPage';
import TimelinePage from './pages/TimelinePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

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
