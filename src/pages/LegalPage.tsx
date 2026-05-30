import { Link } from 'react-router-dom'
import { PoweredByStrip } from '../ui/PoweredByStrip'

type LegalKind = 'terms' | 'privacy' | 'cookies' | 'accessibility'

interface Props {
  title: string
  kind: LegalKind
}

const legalCopy: Record<LegalKind, string[]> = {
  terms: [
    'Service subscriptions include a one-click cancellation path that stays available at all times.',
    'Paid plans include a 14-day cooling-off notice in compliance with UK consumer obligations.',
    'Pricing is displayed in GBP and excludes hidden, staged, or drip fees.',
  ],
  privacy: [
    'We process merchant and menu data under UK GDPR principles of minimization and purpose limitation.',
    'Authentication uses Firebase Authentication and records are stored in Firebase Firestore when enabled.',
    'Data subject requests can be submitted by the account owner from the dashboard support panel.',
  ],
  cookies: [
    'First layer controls provide equal prominence for Accept and Reject non-essential cookies.',
    'Only essential service cookies load prior to explicit user action.',
    'Cookie consent logs support 2027 Data Act accountability updates.',
  ],
  accessibility: [
    'This app targets WCAG 2.1 Level AA for all merchant and display workflows.',
    'Color accents are constrained by automatic contrast guardrails over dark surfaces.',
    'Touch controls in the dashboard maintain a minimum target height of 48px.',
  ],
}

export const LegalPage = ({ title, kind }: Props) => {
  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg shadow-neutral-900/10 sm:p-8">
        <h1 className="text-3xl font-black text-neutral-900">{title}</h1>
        <p className="mt-2 text-neutral-700">UK-specific policy baseline for signage SaaS and white-label licensing.</p>
        <ul className="mt-5 space-y-3 text-neutral-800">
          {legalCopy[kind].map((line) => (
            <li key={line} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              {line}
            </li>
          ))}
        </ul>
        <Link to="/dashboard" className="mt-6 inline-flex h-12 items-center rounded-xl bg-neutral-900 px-5 font-bold text-white">
          Back to Dashboard
        </Link>
        <PoweredByStrip className="mt-4" />
      </article>
    </main>
  )
}
