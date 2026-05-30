import { useEffect, useMemo, useState } from 'react'
import { formatPriceGBP } from '../lib/format'
import { getAccentClasses } from '../lib/branding'
import type { SignageBoardConfig } from '../types/signage'
import { StatusTagBadge } from '../ui/StatusTagBadge'

interface LayoutProps {
  board: SignageBoardConfig
}

const SidebarPanel = ({ board }: LayoutProps) => {
  const [index, setIndex] = useState(0)
  const accent = getAccentClasses(board)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % board.sidebarItems.length)
    }, 12000)

    return () => {
      window.clearInterval(timer)
    }
  }, [board.sidebarItems.length])

  const active = board.sidebarItems[index]

  return (
    <aside className={accent.sidebar}>
      <div className="space-y-4">
        <p className="text-xl font-bold uppercase tracking-[0.16em] text-neutral-300">Live Notices</p>
        <h2 className={accent.sidebarHeadline}>{active.headline}</h2>
        <p className="text-3xl leading-relaxed text-neutral-100">{active.body}</p>
      </div>
      <p className="text-xl font-semibold tracking-wide text-neutral-400">
        Ask staff for allergen matrix and ingredient details.
      </p>
    </aside>
  )
}

const MenuItemLine = ({
  name,
  description,
  pricePence,
  statusTags,
}: SignageBoardConfig['menuSections'][number]['items'][number]) => {
  return (
    <article className="rounded-xl border border-neutral-700 bg-neutral-900/80 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-2xl font-extrabold leading-tight text-neutral-50">{name}</h4>
        <p className="min-w-[130px] text-right text-3xl font-black tabular-nums text-neutral-50">
          {formatPriceGBP(pricePence)}
        </p>
      </div>
      <p className="mt-1 text-lg text-neutral-300">{description}</p>
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

  return (
    <div className="flex h-full w-full">
      <section className="flex h-full w-2/3 flex-col px-8 py-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-[0.12em] text-neutral-50">{board.storeName}</h1>
            <p className={accent.strapline}>Freshly Fried Every Day</p>
          </div>
          <p className="text-xl font-semibold uppercase tracking-[0.14em] text-neutral-300">Queue Friendly Display</p>
        </header>

        <div className="grid flex-1 grid-cols-3 gap-4">
          {board.menuSections.slice(0, 3).map((section) => (
            <section key={section.id} className="space-y-4 rounded-2xl border border-neutral-700 bg-neutral-900/70 p-4">
              <h3 className={accent.sectionTitleSm}>
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <MenuItemLine key={item.id} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <SidebarPanel board={board} />
    </div>
  )
}

export const TwoColumnGridLayout = ({ board }: LayoutProps) => {
  const accent = getAccentClasses(board)

  return (
    <div className="flex h-full w-full">
      <section className="w-2/3 px-10 py-10">
        <h1 className="text-6xl font-black uppercase tracking-[0.12em] text-neutral-50">{board.storeName} Drinks</h1>
        <div className="mt-6 grid grid-cols-2 gap-5">
          {board.menuSections.map((section) => (
            <section key={section.id} className="rounded-2xl border border-neutral-700 bg-neutral-900/70 p-4">
              <h3 className={accent.sectionTitleLg}>
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <MenuItemLine key={item.id} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      <SidebarPanel board={board} />
    </div>
  )
}

export const HalfImageLayout = ({ board }: LayoutProps) => {
  const accent = getAccentClasses(board)

  const dessertItems = useMemo(
    () => board.menuSections.flatMap((section) => section.items),
    [board.menuSections],
  )

  return (
    <div className="flex h-full w-full">
      <section className="relative w-1/2 overflow-hidden border-r border-neutral-700 bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.22),rgba(10,10,10,0.95))]">
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
            <MenuItemLine key={item.id} {...item} />
          ))}
        </div>
      </section>
    </div>
  )
}
