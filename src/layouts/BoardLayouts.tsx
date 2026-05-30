import { useEffect, useMemo, useState } from 'react'
import { formatPriceGBP } from '../lib/format'
import { getAccentClasses } from '../lib/branding'
import type { SignageBoardConfig } from '../types/signage'
import { StatusTagBadge } from '../ui/StatusTagBadge'

interface LayoutProps {
  board: SignageBoardConfig
}

const imageShapeClass = (board: SignageBoardConfig): string => {
  if (board.imageCornerStyle === 'SQUARE') {
    return 'rounded-none'
  }

  if (board.imageCornerStyle === 'SOFT') {
    return 'rounded-lg'
  }

  return 'rounded-2xl'
}

const BottomNoticeBanner = ({ board }: LayoutProps) => {
  const [index, setIndex] = useState(0)
  const shapeClass = imageShapeClass(board)

  const noticeCount = board.sidebarItems.length

  useEffect(() => {
    if (noticeCount <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % noticeCount)
    }, 12000)

    return () => {
      window.clearInterval(timer)
    }
  }, [noticeCount])

  if (noticeCount === 0) {
    return null
  }

  const active = board.sidebarItems[index]

  return (
    <aside className="h-[170px] border-t-2 border-neutral-700 bg-[linear-gradient(90deg,rgba(15,15,15,0.98),rgba(30,12,18,0.96))] px-8 py-4">
      <div className="grid h-full grid-cols-[1fr_1.4fr] items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-400">Live Notices</p>
            <h2 className="text-3xl font-black leading-tight text-neutral-100">{active.headline}</h2>
          </div>
          <div className="h-14 w-px bg-neutral-700" />
          <p className="text-sm font-semibold text-neutral-400">Ask staff for allergen matrix and ingredient details.</p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-700 bg-neutral-900/65 px-4 py-3">
          <p className="text-xl font-semibold leading-snug text-neutral-100">{active.body}</p>

          {board.sidebarImageUrl && (
            <img
              src={board.sidebarImageUrl}
              alt={`${board.storeName} promo`}
              className={`h-20 w-36 border border-neutral-600 object-cover ${shapeClass}`}
              loading="eager"
            />
          )}
        </div>
      </div>
    </aside>
  )
}

const MenuItemLine = ({
  name,
  description,
  pricePence,
  statusTags,
  imageUrl,
  cornerClass,
}: SignageBoardConfig['menuSections'][number]['items'][number] & { cornerClass: string }) => {
  return (
    <article className="rounded-xl border border-neutral-700 bg-neutral-900/80 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className={`h-16 w-16 shrink-0 border border-neutral-600 object-cover ${cornerClass}`}
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <h4 className="text-2xl font-extrabold leading-tight text-neutral-50">{name}</h4>
            <p className="mt-1 text-lg text-neutral-300">{description}</p>
          </div>
        </div>
        <p className="min-w-[130px] text-right text-3xl font-black tabular-nums text-neutral-50">
          {formatPriceGBP(pricePence)}
        </p>
      </div>
      {statusTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {statusTags.map((tag) => (
            <StatusTagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  )
}

export const ThreeColumnLayout = ({ board }: LayoutProps) => {
  const accent = getAccentClasses(board)
  const shapeClass = imageShapeClass(board)

  return (
    <div className="flex h-full w-full flex-col">
      <section className="flex flex-1 flex-col px-8 py-8 pb-4">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-[0.12em] text-neutral-50">{board.storeName}</h1>
            <p className={accent.strapline}>Freshly Fried Every Day</p>
          </div>
          {board.heroImageUrl && (
            <img
              src={board.heroImageUrl}
              alt={`${board.storeName} logo`}
              className={`h-24 w-24 border border-neutral-600 object-cover ${shapeClass}`}
              loading="eager"
            />
          )}
          {board.queueHeaderText && board.queueHeaderText.trim().length > 0 && (
            <p className="text-xl font-semibold uppercase tracking-[0.14em] text-neutral-300">{board.queueHeaderText}</p>
          )}
        </header>

        <div className="grid flex-1 grid-cols-6 gap-4 auto-rows-fr">
          {board.menuSections.slice(0, 4).map((section, index) => (
            <section
              key={section.id}
              className={
                index === 0
                  ? 'col-span-4 row-span-2 space-y-4 rounded-3xl border border-neutral-500/80 bg-[linear-gradient(145deg,rgba(23,23,23,0.88),rgba(10,10,10,0.96))] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.35)] overflow-hidden'
                  : 'col-span-2 space-y-4 rounded-3xl border border-neutral-600/70 bg-[linear-gradient(145deg,rgba(38,38,38,0.82),rgba(10,10,10,0.92))] p-4 shadow-[0_8px_26px_rgba(0,0,0,0.28)] overflow-hidden'
              }
            >
              <h3 className={accent.sectionTitleSm}>
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <MenuItemLine key={item.id} {...item} cornerClass={shapeClass} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <BottomNoticeBanner board={board} />
    </div>
  )
}

export const TwoColumnGridLayout = ({ board }: LayoutProps) => {
  const accent = getAccentClasses(board)
  const shapeClass = imageShapeClass(board)

  return (
    <div className="flex h-full w-full flex-col">
      <section className="flex-1 px-10 py-8 pb-4">
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-6xl font-black uppercase tracking-[0.12em] text-neutral-50">{board.storeName} Drinks</h1>
          {board.heroImageUrl && (
            <img
              src={board.heroImageUrl}
              alt={`${board.storeName} logo`}
              className={`h-24 w-24 border border-neutral-600 object-cover ${shapeClass}`}
              loading="eager"
            />
          )}
        </div>
        <div className="mt-6 grid grid-cols-4 gap-5 auto-rows-fr">
          {board.menuSections.map((section, index) => (
            <section
              key={section.id}
              className={
                index % 3 === 0
                  ? 'col-span-2 rounded-3xl border border-neutral-500/80 bg-[linear-gradient(145deg,rgba(23,23,23,0.88),rgba(10,10,10,0.96))] p-5 shadow-[0_10px_35px_rgba(0,0,0,0.35)] overflow-hidden'
                  : 'col-span-2 rounded-3xl border border-neutral-600/70 bg-[linear-gradient(145deg,rgba(38,38,38,0.82),rgba(10,10,10,0.92))] p-4 shadow-[0_8px_26px_rgba(0,0,0,0.28)] overflow-hidden'
              }
            >
              <h3 className={accent.sectionTitleLg}>
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <MenuItemLine key={item.id} {...item} cornerClass={shapeClass} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <BottomNoticeBanner board={board} />
    </div>
  )
}

export const HalfImageLayout = ({ board }: LayoutProps) => {
  const accent = getAccentClasses(board)
  const shapeClass = imageShapeClass(board)

  const dessertItems = useMemo(
    () => board.menuSections.flatMap((section) => section.items),
    [board.menuSections],
  )

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-1">
      <section className="relative w-1/2 overflow-hidden border-r border-neutral-700 bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.22),rgba(10,10,10,0.95))]">
        {board.heroImageUrl && (
          <img
            src={board.heroImageUrl}
            alt={`${board.storeName} hero`}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
            loading="eager"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/80 via-neutral-900/45 to-transparent" />
        <div className="absolute inset-10 rounded-[36px] border border-neutral-400/30 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0))] p-8 backdrop-blur-sm">
          <h2 className="text-6xl font-black uppercase tracking-[0.1em] text-neutral-50">Dessert Spotlight</h2>
          <p className="mt-4 text-3xl text-neutral-100">Warm puddings, soft serve and seaside classics.</p>
          <div className={accent.spotlight}>
            <p className="text-2xl font-bold text-neutral-50">Tonight's Highlight</p>
            <p className={accent.spotlightHeadline}>Jam Roly-Poly & Custard £4.50</p>
          </div>
        </div>
      </section>
      <section className="w-1/2 px-8 py-8">
        <h1 className="text-5xl font-black uppercase tracking-[0.12em] text-neutral-50">Sweet Finish Menu</h1>
        <div className="mt-6 space-y-4">
          {dessertItems.map((item) => (
            <MenuItemLine key={item.id} {...item} cornerClass={shapeClass} />
          ))}
        </div>
      </section>
      </div>
      <BottomNoticeBanner board={board} />
    </div>
  )
}
