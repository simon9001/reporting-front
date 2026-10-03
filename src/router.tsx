import { createBrowserRouter, Navigate } from 'react-router'
import { ChangePasswordPage } from './auth/ChangePasswordPage'
import { HomeRedirect, RequireAuth, RequireRole } from './auth/guards'
import { LoginPage } from './auth/LoginPage'
import { AppShell } from './layout/AppShell'
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
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
