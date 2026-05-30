import { useEffect, useState } from 'react'
import { formatDateUK } from '../lib/format'

export const DisplayUpdatedBadge = () => {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div className="rounded-lg border border-emerald-200/50 bg-neutral-950/65 px-3 py-1.5 text-xs font-semibold text-emerald-100">
      Updated {formatDateUK(now)}
    </div>
  )
}
