import { createBrowserRouter, Navigate } from 'react-router'
import { ChangePasswordPage } from './auth/ChangePasswordPage'
import { HomeRedirect, RequireAuth, RequireRole } from './auth/guards'
import { LoginPage } from './auth/LoginPage'
import { AppShell } from './layout/AppShell'
import { AuditPage } from './pages/admin/AuditPage'
import { LookupsPage } from './pages/admin/LookupsPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { UsersPage } from './pages/admin/UsersPage'
import { VehiclesPage } from './pages/admin/VehiclesPage'
import { DashboardPage } from './pages/DashboardPage'
import { MyShiftPage } from './pages/MyShiftPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { path: 'change-password', element: <ChangePasswordPage /> },
      {
        element: <AppShell />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { element: <RequireRole roles={['OFFICER']} />, children: [{ path: 'my-shift', element: <MyShiftPage /> }] },
          { element: <RequireRole roles={['DEPUTY_DIRECTOR', 'ADMIN']} />, children: [{ path: 'dashboard', element: <DashboardPage /> }] },
          {
            element: <RequireRole roles={['ADMIN']} />,
            children: [
              { path: 'admin/users', element: <UsersPage /> },
              { path: 'admin/settings', element: <SettingsPage /> },
              { path: 'admin/lookups', element: <LookupsPage /> },
              { path: 'admin/vehicles', element: <VehiclesPage /> },
              { path: 'admin/audit', element: <AuditPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
