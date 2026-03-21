import React, { useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { getTheme } from './theme';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import GroupsPage from './pages/GroupsPage';
import AttributesPage from './pages/AttributesPage';
import NasPage from './pages/NasPage';
import SessionsPage from './pages/SessionsPage';
import AuthLogsPage from './pages/AuthLogsPage';
import AdminsPage from './pages/AdminsPage';
import RolesPage from './pages/RolesPage';
import SettingsPage from './pages/SettingsPage';
import CertificatesPage from './pages/CertificatesPage';
import AuditPage from './pages/AuditPage';
import HealthPage from './pages/HealthPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved === 'dark' ? 'dark' : 'light');
  });

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout mode={mode} onToggleTheme={toggleTheme}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/groups" element={<GroupsPage />} />
                  <Route path="/attributes" element={<AttributesPage />} />
                  <Route path="/nas" element={<NasPage />} />
                  <Route path="/sessions" element={<SessionsPage />} />
                  <Route path="/auth-logs" element={<AuthLogsPage />} />
                  <Route path="/admins" element={<AdminsPage />} />
                  <Route path="/roles" element={<RolesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/certificates" element={<CertificatesPage />} />
                  <Route path="/audit" element={<AuditPage />} />
                  <Route path="/health" element={<HealthPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
