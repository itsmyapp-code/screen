import { useEffect, useState } from 'react'

type ConsentChoice = 'accepted' | 'rejected' | null

const STORAGE_KEY = 'itsmyscreen.cookie-consent.v1'

export const CookieBanner = () => {
  const [choice, setChoice] = useState<ConsentChoice>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted' || stored === 'rejected') {
      setChoice(stored)
    }
  }, [])

  if (choice) {
    return null
  }

  const setConsent = (next: Exclude<ConsentChoice, null>): void => {
    localStorage.setItem(STORAGE_KEY, next)
    setChoice(next)
  }

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-neutral-300 bg-white p-4 shadow-xl shadow-neutral-900/20 sm:left-auto sm:max-w-md">
      <p className="text-sm font-bold uppercase tracking-wide text-neutral-600">Cookie Consent</p>
      <p className="mt-2 text-sm text-neutral-800">
        Essential cookies only by default. You can accept or reject non-essential tracking with equal prominence,
        aligned to UK requirements and 2027 Data Act updates.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="h-12 rounded-xl border border-neutral-900 bg-white font-bold text-neutral-900"
          onClick={() => setConsent('rejected')}
        >
          Reject Non-Essential
        </button>
        <button
          type="button"
          className="h-12 rounded-xl border border-neutral-900 bg-neutral-900 font-bold text-white"
          onClick={() => setConsent('accepted')}
        >
          Accept All
        </button>
      </div>
    </aside>
  )
}
