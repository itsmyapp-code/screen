import { useEffect } from 'react'

export const useAutoRefresh = (intervalMs = 300_000): void => {
  useEffect(() => {
    const interval = window.setInterval(() => {
      window.location.reload()
    }, intervalMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [intervalMs])
}
