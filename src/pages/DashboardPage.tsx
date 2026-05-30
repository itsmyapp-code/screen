import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { defaultBoardId, defaultBoards } from '../data/defaultBoards'
import { pushBoardUpdate } from '../lib/pushBoardUpdate'
import { formatDateUK } from '../lib/format'
import type { SignageBoardConfig, StatusTag } from '../types/signage'

const TAG_OPTIONS: Array<{ label: string; value: StatusTag }> = [
  { label: 'SOLD OUT', value: 'SOLD_OUT' },
  { label: 'HOT DEAL', value: 'HOT_DEAL' },
  { label: 'CONTAINS GLUTEN', value: 'CONTAINS_GLUTEN' },
  { label: 'CONTAINS FISH', value: 'CONTAINS_FISH' },
]

export const DashboardPage = () => {
  const [board, setBoard] = useState<SignageBoardConfig>(defaultBoards[defaultBoardId])
  const [selectedSectionId, setSelectedSectionId] = useState(board.menuSections[0].id)
  const [selectedItemId, setSelectedItemId] = useState(board.menuSections[0].items[0].id)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const selectedSection = useMemo(
    () => board.menuSections.find((section) => section.id === selectedSectionId) ?? board.menuSections[0],
    [board.menuSections, selectedSectionId],
  )

  const selectedItem = useMemo(
    () => selectedSection.items.find((item) => item.id === selectedItemId) ?? selectedSection.items[0],
    [selectedSection, selectedItemId],
  )

  const updateItem = (updater: (draft: typeof selectedItem) => typeof selectedItem): void => {
    setBoard((prev) => ({
      ...prev,
      menuSections: prev.menuSections.map((section) => {
        if (section.id !== selectedSection.id) {
          return section
        }

        return {
          ...section,
          items: section.items.map((item) => (item.id === selectedItem.id ? updater(item) : item)),
        }
      }),
    }))
  }

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    await pushBoardUpdate(board)
    setSavedAt(new Date())
  }

  const onTagToggle = (tag: StatusTag) => {
    updateItem((current) => {
      const hasTag = current.statusTags.includes(tag)
      return {
        ...current,
        statusTags: hasTag
          ? current.statusTags.filter((entry) => entry !== tag)
          : [...current.statusTags, tag],
      }
    })
  }

  const updateBoardImage = (field: 'heroImageUrl' | 'sidebarImageUrl', value: string): void => {
    setBoard((prev) => ({
      ...prev,
      [field]: value.trim() === '' ? undefined : value,
    }))
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#fef3c7_0%,#f3f4f6_55%,#e5e7eb_100%)] px-4 py-6 text-neutral-900 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-xl shadow-neutral-900/10 sm:p-6">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">Merchant Remote</p>
          <h1 className="text-3xl font-black text-neutral-900">Digital Signage Dashboard</h1>
          <p className="text-base text-neutral-700">
            Counter-first controls with instant board sync simulation and Firestore push support.
          </p>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-bold">Subscription Logic (DMCCA 2027)</p>
            <p className="mt-1">Easy Exit enabled in one tap. Cooling-off reminder at day 13 for all paid plans.</p>
            <p className="mt-1">All prices shown upfront in GBP with no drip pricing patterns.</p>
          </div>
        </header>

        <form className="mt-6 space-y-4" onSubmit={onSave}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Header Image URL</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              placeholder="/screen-logo.png or https://..."
              value={board.heroImageUrl ?? ''}
              onChange={(event) => updateBoardImage('heroImageUrl', event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Sidebar Image URL</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              placeholder="/screen-logo.png or https://..."
              value={board.sidebarImageUrl ?? ''}
              onChange={(event) => updateBoardImage('sidebarImageUrl', event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Menu Section</span>
            <select
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base"
              value={selectedSection.id}
              onChange={(event) => {
                const nextSection = board.menuSections.find((section) => section.id === event.target.value)
                if (!nextSection) {
                  return
                }

                setSelectedSectionId(nextSection.id)
                setSelectedItemId(nextSection.items[0].id)
              }}
            >
              {board.menuSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Menu Item</span>
            <select
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base"
              value={selectedItem.id}
              onChange={(event) => setSelectedItemId(event.target.value)}
            >
              {selectedSection.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Name</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              value={selectedItem.name}
              onChange={(event) => updateItem((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Description</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-neutral-300 px-4 py-3 text-base"
              value={selectedItem.description}
              onChange={(event) => updateItem((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Price (GBP)</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              type="number"
              min="0"
              step="0.01"
              value={(selectedItem.pricePence / 100).toFixed(2)}
              onChange={(event) => {
                const pounds = Number.parseFloat(event.target.value)
                const pence = Number.isFinite(pounds) ? Math.round(pounds * 100) : 0
                updateItem((current) => ({ ...current, pricePence: pence }))
              }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Menu Item Image URL</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              placeholder="/screen-logo.png or https://..."
              value={selectedItem.imageUrl ?? ''}
              onChange={(event) => updateItem((current) => ({
                ...current,
                imageUrl: event.target.value.trim() === '' ? undefined : event.target.value,
              }))}
            />
          </label>

          <fieldset>
            <legend className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Status Tags</legend>
            <div className="grid grid-cols-2 gap-2">
              {TAG_OPTIONS.map((tag) => {
                const active = selectedItem.statusTags.includes(tag.value)
                return (
                  <button
                    key={tag.value}
                    type="button"
                    className={
                      active
                        ? 'h-12 rounded-xl border border-emerald-400 bg-emerald-100 px-4 text-sm font-bold text-emerald-900'
                        : 'h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-800'
                    }
                    onClick={() => onTagToggle(tag.value)}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-neutral-900 text-base font-bold text-white shadow-lg shadow-neutral-900/20"
          >
            Push Update to Display
          </button>
        </form>

        <section className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-bold text-neutral-900">Instant Sync Preview Link</p>
          <Link className="mt-1 inline-block font-semibold text-blue-700 underline" to={`/display/${board.boardId}`}>
            Open live board view for {board.boardId}
          </Link>
          {savedAt && <p className="mt-2">Last pushed: {formatDateUK(savedAt)}</p>}
        </section>

        <footer className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-neutral-600">
          <Link className="underline" to="/terms">Terms</Link>
          <Link className="underline" to="/privacy">Privacy</Link>
          <Link className="underline" to="/cookies">Cookies</Link>
          <Link className="underline" to="/accessibility">Accessibility</Link>
        </footer>
      </section>
    </main>
  )
}
