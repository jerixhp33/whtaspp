import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ChatProvider } from './hooks/useChat';
import { CallProvider } from './hooks/useWebRTC';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { AdminRoute } from './components/shared/AdminRoute';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import {
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
  ChatPage,
  SettingsPage,
  AdminDashboard,
  AdminUsersPage,
  AdminReportsPage,
  AdminApiKeysPage,
  AdminAuditLogsPage,
  AdminSettingsPage
} from './pages';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <CallProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
              </Route>
              
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/settings/permissions" element={<SettingsPage />} />
                  <Route path="/permissions" element={<SettingsPage />} />
                </Route>
                
                <Route path="/admin" element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="api-keys" element={<AdminApiKeysPage />} />
                    <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CallProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
