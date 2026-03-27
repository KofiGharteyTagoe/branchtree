import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
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
        <Route
          path="/"
          element={
            <DashboardPage
              selectedAppId={selectedAppId}
              onAppChange={setSelectedAppId}
            />
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
