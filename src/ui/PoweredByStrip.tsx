import type { SyntheticEvent } from 'react'

interface Props {
  tone?: 'light' | 'dark'
  compact?: boolean
  className?: string
}

const logoErrorFallback = (
  event: SyntheticEvent<HTMLImageElement, Event>,
): void => {
  const image = event.currentTarget

  if (image.src.includes('/screen-logo.png')) {
    image.style.display = 'none'
    return
  }

  image.src = '/screen-logo.png'
}

const LIGHT_BASE =
  'rounded-2xl border border-neutral-200 bg-white/90 text-neutral-800 shadow-sm shadow-neutral-900/10'
const DARK_BASE =
  'rounded-2xl border border-neutral-700 bg-neutral-950/75 text-neutral-100 shadow-sm shadow-black/30'

export const PoweredByStrip = ({ tone = 'light', compact = false, className = '' }: Props) => {
  const baseClasses = tone === 'dark' ? DARK_BASE : LIGHT_BASE
  const logoFrame = tone === 'dark'
    ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 p-1'
    : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 p-1'
  const logoImage = 'h-full w-full object-contain'

  if (compact) {
    return (
      <div className={`${baseClasses} ${className} flex items-center gap-3 px-3 py-2`}>
        <div className={logoFrame}>
          <img
            src="/itsmyapp_logo.png"
            alt="Its My Screen logo"
            className={logoImage}
            loading="lazy"
            onError={logoErrorFallback}
          />
        </div>
        <div className="min-w-0 text-[11px] leading-tight sm:text-xs">
          <p className="font-bold">Powered by Its My Screen</p>
          <p className="truncate">Developed by itsmyapp.co.uk | Copyright 2026</p>
          <p className="truncate">hello@itsmyapp.co.uk</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${baseClasses} ${className} flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-center gap-3">
        <div className={logoFrame}>
          <img
            src="/itsmyapp_logo.png"
            alt="Its My Screen logo"
            className={logoImage}
            loading="lazy"
            onError={logoErrorFallback}
          />
        </div>
        <p className="text-sm font-black uppercase tracking-wide">Powered by Its My Screen</p>
      </div>
      <div className="text-xs font-semibold sm:text-right">
        <p>Developed by itsmyapp.co.uk</p>
        <p>Copyright 2026</p>
        <p>hello@itsmyapp.co.uk</p>
      </div>
    </div>
  )
}
