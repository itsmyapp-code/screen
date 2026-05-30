import { Suspense, StrictMode, lazy } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { CookieBanner } from './ui/CookieBanner'
import { useAuthUser } from './hooks/useAuthUser'

const LegalPage = lazy(async () => import('./pages/LegalPage').then((module) => ({ default: module.LegalPage })))
const AuthPage = lazy(async () => import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const DashboardPage = lazy(async () =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const DisplayPage = lazy(async () => import('./pages/DisplayPage').then((module) => ({ default: module.DisplayPage })))

const withFallback = (element: ReactNode) => (
  <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700">Loading...</div>}>
    {element}
  </Suspense>
)

registerSW({ immediate: true })

const DashboardRoute = () => {
  const { user, loading } = useAuthUser()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700">Checking access...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <DashboardPage />
}

const AuthRoute = () => {
  const { user, loading } = useAuthUser()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700">Loading...</div>
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <AuthPage />
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/auth" replace /> },
  { path: '/auth', element: withFallback(<AuthRoute />) },
  { path: '/dashboard', element: withFallback(<DashboardRoute />) },
  { path: '/display/:boardId', element: withFallback(<DisplayPage />) },
  {
    path: '/terms',
    element: withFallback(<LegalPage kind="terms" title="Terms of Service" />),
  },
  {
    path: '/privacy',
    element: withFallback(<LegalPage kind="privacy" title="Privacy Policy" />),
  },
  {
    path: '/cookies',
    element: withFallback(<LegalPage kind="cookies" title="Cookie Policy" />),
  },
  {
    path: '/accessibility',
    element: withFallback(<LegalPage kind="accessibility" title="Accessibility Statement" />),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <CookieBanner />
  </StrictMode>,
)
