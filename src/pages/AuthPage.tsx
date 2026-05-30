import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { ensureUserBoard } from '../lib/userBoard'
import { useAuthUser } from '../hooks/useAuthUser'
import { PoweredByStrip } from '../ui/PoweredByStrip'

type AuthMode = 'LOGIN' | 'SIGNUP'

export const AuthPage = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuthUser()
  const [mode, setMode] = useState<AuthMode>('LOGIN')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string>('')
  const [resetMessage, setResetMessage] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const submit = async (): Promise<void> => {
    if (!auth) {
      setError('Firebase auth is not configured. Add VITE_FIREBASE_* variables.')
      return
    }

    setSubmitting(true)
    setError('')
    setResetMessage('')

    try {
      if (mode === 'LOGIN') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await ensureUserBoard(result.user)
      }

      navigate('/dashboard')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const forgotPassword = async (): Promise<void> => {
    if (!auth) {
      setError('Firebase auth is not configured. Add VITE_FIREBASE_* variables.')
      return
    }

    if (!email.trim()) {
      setError('Enter your email first, then tap Forgot password.')
      return
    }

    try {
      setError('')
      await sendPasswordResetEmail(auth, email.trim())
      setResetMessage('Password reset email sent. Check your inbox and spam folder.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to send reset email.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#ffe7b0_0%,#f5f5f5_55%,#e5e7eb_100%)] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white/95 p-6 shadow-xl shadow-neutral-900/10">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-500">Merchant Access</p>
        <h1 className="mt-2 text-3xl font-black text-neutral-900">Sign in to manage your screen</h1>
        <p className="mt-2 text-sm text-neutral-700">Email/password auth with unique board URL provisioning per merchant.</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={
              mode === 'LOGIN'
                ? 'h-12 rounded-xl border border-neutral-900 bg-neutral-900 text-sm font-bold text-white'
                : 'h-12 rounded-xl border border-neutral-300 bg-white text-sm font-bold text-neutral-800'
            }
            onClick={() => setMode('LOGIN')}
          >
            Login
          </button>
          <button
            type="button"
            className={
              mode === 'SIGNUP'
                ? 'h-12 rounded-xl border border-neutral-900 bg-neutral-900 text-sm font-bold text-white'
                : 'h-12 rounded-xl border border-neutral-300 bg-white text-sm font-bold text-neutral-800'
            }
            onClick={() => setMode('SIGNUP')}
          >
            Sign up
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Email</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Password</span>
            <div className="relative">
              <input
                className="h-12 w-full rounded-xl border border-neutral-300 px-4 pr-28 text-base"
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-bold text-neutral-800"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button
            type="button"
            className="h-12 w-full rounded-xl border border-neutral-300 bg-white text-sm font-bold text-neutral-800"
            onClick={() => {
              void forgotPassword()
            }}
          >
            Forgot password
          </button>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
          {resetMessage && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{resetMessage}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-neutral-900 text-base font-bold text-white disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : mode === 'LOGIN' ? 'Login' : 'Create account'}
          </button>
        </form>

        <PoweredByStrip className="mt-4" />
      </section>
    </main>
  )
}
