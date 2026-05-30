import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { defaultBoardId, defaultBoards } from '../data/defaultBoards'
import { useAuthUser } from '../hooks/useAuthUser'
import { useLiveMenu } from '../hooks/useLiveMenu'
import { imageFileToWebpDataUrl, validateImageFile } from '../lib/imageUpload'
import { pushBoardUpdate } from '../lib/pushBoardUpdate'
import { ensureUserBoard } from '../lib/userBoard'
import type { AccentProfile, ImageCornerStyle, SignageBoardConfig } from '../types/signage'

const ACCENT_OPTIONS: AccentProfile[] = ['AMBER', 'CYAN', 'LIME', 'ROSE']
const CORNER_OPTIONS: ImageCornerStyle[] = ['ROUNDED', 'SOFT', 'SQUARE']
const LAYOUT_OPTIONS: Array<{ value: SignageBoardConfig['layoutStyle']; label: string; description: string }> = [
  {
    value: 'THREE_COLUMN',
    label: 'Three Column Bento',
    description: 'Menu-heavy layout with bento-style section tiles and sidebar notices.',
  },
  {
    value: 'TWO_COLUMN_GRID',
    label: 'Two Column Grid',
    description: 'Balanced menu grid with a right notices panel.',
  },
  {
    value: 'HALF_IMAGE',
    label: 'Half Image Spotlight',
    description: 'Strong hero visual on left and menu list on right.',
  },
]

const VIBRANT_PRESETS: Array<{
  id: string
  name: string
  accentProfile: AccentProfile
  displayTintHex: string
  displayTintOpacity: number
  layoutStyle: SignageBoardConfig['layoutStyle']
}> = [
  {
    id: 'sunset-pop',
    name: 'Sunset Pop',
    accentProfile: 'ROSE',
    displayTintHex: '#22050f',
    displayTintOpacity: 0.12,
    layoutStyle: 'THREE_COLUMN',
  },
  {
    id: 'electric-cool',
    name: 'Electric Cool',
    accentProfile: 'CYAN',
    displayTintHex: '#001b2d',
    displayTintOpacity: 0.1,
    layoutStyle: 'TWO_COLUMN_GRID',
  },
  {
    id: 'citrus-flare',
    name: 'Citrus Flare',
    accentProfile: 'LIME',
    displayTintHex: '#1a2205',
    displayTintOpacity: 0.1,
    layoutStyle: 'THREE_COLUMN',
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    accentProfile: 'AMBER',
    displayTintHex: '#2b1400',
    displayTintOpacity: 0.12,
    layoutStyle: 'HALF_IMAGE',
  },
]

export const DisplaySettingsPage = () => {
  const { user } = useAuthUser()
  const [boardId, setBoardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState<'success' | 'error'>('success')
  const [board, setBoard] = useState<SignageBoardConfig>(defaultBoards[defaultBoardId])

  const live = useLiveMenu(boardId ?? defaultBoardId)

  useEffect(() => {
    const setup = async (): Promise<void> => {
      if (!user) {
        return
      }

      try {
        const nextBoardId = await ensureUserBoard(user)
        setBoardId(nextBoardId)
      } finally {
        setLoading(false)
      }
    }

    void setup()
  }, [user])

  useEffect(() => {
    if (!boardId) {
      return
    }

    setBoard(live.board)
  }, [boardId, live.board])

  const uploadBoardImage = async (
    event: ChangeEvent<HTMLInputElement>,
    field: 'heroImageUrl' | 'sidebarImageUrl',
  ): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.')
      setMessageKind('error')
      event.target.value = ''
      return
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      setMessage(validationError)
      setMessageKind('error')
      event.target.value = ''
      return
    }

    try {
      const url = await imageFileToWebpDataUrl(file)
      setBoard((prev) => ({
        ...prev,
        [field]: url,
      }))
      setMessage('Image converted to WEBP and loaded. Save settings to publish.')
      setMessageKind('success')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to process image file.')
      setMessageKind('error')
    }
    event.target.value = ''
  }

  const save = async (event: FormEvent): Promise<void> => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      await pushBoardUpdate(board)
      setMessage('Display settings saved successfully.')
      setMessageKind('success')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to save settings.')
      setMessageKind('error')
    } finally {
      setSaving(false)
    }
  }

  const applyPreset = (presetId: string): void => {
    const preset = VIBRANT_PRESETS.find((entry) => entry.id === presetId)
    if (!preset) {
      return
    }

    setBoard((prev) => ({
      ...prev,
      accentProfile: preset.accentProfile,
      displayTintHex: preset.displayTintHex,
      displayTintOpacity: preset.displayTintOpacity,
      layoutStyle: preset.layoutStyle,
    }))
    setMessage(`Applied preset: ${preset.name}. Save settings to publish.`)
    setMessageKind('success')
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700">Loading settings...</main>
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_20%,#fef08a_0%,#cffafe_48%,#fecdd3_100%)] px-4 py-6 text-neutral-900 sm:px-6">
      <section className="mx-auto grid w-full max-w-5xl gap-4 rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-xl shadow-neutral-900/10 sm:grid-cols-6 sm:p-6">
        <header className="mb-1 sm:col-span-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Display Settings</p>
          <h1 className="mt-1 text-3xl font-black text-neutral-900">Screen Name, Images and Colours</h1>
          <p className="mt-2 text-sm text-neutral-700">
            Header image and sidebar image are rendered from these fields. Uploading stores an optimized data URL directly in your board settings.
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:col-span-6">
          <p className="text-sm font-bold uppercase tracking-wide text-neutral-600">Vibrant Presets</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VIBRANT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="rounded-xl border border-neutral-200 bg-[linear-gradient(135deg,#111827_0%,#334155_45%,#0f172a_100%)] p-3 text-left text-white shadow-md"
              >
                <p className="text-sm font-black">{preset.name}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-white/80">{preset.layoutStyle.replaceAll('_', ' ')}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:col-span-6">
          <p className="text-sm font-bold uppercase tracking-wide text-neutral-600">Complete Screen Layout</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {LAYOUT_OPTIONS.map((layout) => (
              <button
                key={layout.value}
                type="button"
                onClick={() => {
                  setBoard((prev) => ({ ...prev, layoutStyle: layout.value }))
                }}
                className={
                  board.layoutStyle === layout.value
                    ? 'rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3 text-left'
                    : 'rounded-xl border border-neutral-200 bg-white p-3 text-left'
                }
              >
                <p className="text-sm font-black text-neutral-900">{layout.label}</p>
                <p className="mt-1 text-xs text-neutral-700">{layout.description}</p>
              </button>
            ))}
          </div>
        </section>

        <form className="space-y-4 sm:col-span-4" onSubmit={(event) => { void save(event) }}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Display Name</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              value={board.storeName}
              onChange={(event) => setBoard((prev) => ({ ...prev, storeName: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Queue Header Text</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              value={board.queueHeaderText ?? ''}
              onChange={(event) => setBoard((prev) => ({
                ...prev,
                queueHeaderText: event.target.value,
              }))}
              placeholder="Queue Friendly Display"
            />
            <p className="mt-1 text-xs text-neutral-600">Leave empty to hide this label on the display.</p>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Accent Colour Theme</span>
            <select
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base"
              value={board.accentProfile}
              onChange={(event) => setBoard((prev) => ({
                ...prev,
                accentProfile: event.target.value as AccentProfile,
              }))}
            >
              {ACCENT_OPTIONS.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Image Corner Style</span>
            <select
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base"
              value={board.imageCornerStyle ?? 'ROUNDED'}
              onChange={(event) => setBoard((prev) => ({
                ...prev,
                imageCornerStyle: event.target.value as ImageCornerStyle,
              }))}
            >
              {CORNER_OPTIONS.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Global Tint Colour</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              type="color"
              value={board.displayTintHex ?? '#000000'}
              onChange={(event) => setBoard((prev) => ({ ...prev, displayTintHex: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Tint Opacity (%)</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              type="number"
              min="0"
              max="60"
              value={Math.round((board.displayTintOpacity ?? 0) * 100)}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10)
                const safe = Number.isFinite(value) ? Math.max(0, Math.min(60, value)) : 0
                setBoard((prev) => ({ ...prev, displayTintOpacity: safe / 100 }))
              }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Header Image URL</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              value={board.heroImageUrl ?? ''}
              onChange={(event) => setBoard((prev) => ({ ...prev, heroImageUrl: event.target.value }))}
              placeholder="https://... or /screen-logo.png"
            />
            <input
              className="mt-2 h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => { void uploadBoardImage(event, 'heroImageUrl') }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Sidebar Image URL</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              value={board.sidebarImageUrl ?? ''}
              onChange={(event) => setBoard((prev) => ({ ...prev, sidebarImageUrl: event.target.value }))}
              placeholder="https://... or /screen-logo.png"
            />
            <input
              className="mt-2 h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => { void uploadBoardImage(event, 'sidebarImageUrl') }}
            />
          </label>

          {message && (
            <p className={
              messageKind === 'success'
                ? 'rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800'
                : 'rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700'
            }>{message}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-xl bg-neutral-900 text-base font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Display Settings'}
          </button>
        </form>

        <aside className="space-y-4 sm:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-neutral-600">Live Preview Summary</p>
            <p className="mt-2 text-sm text-neutral-700">Accent: <span className="font-bold text-neutral-900">{board.accentProfile}</span></p>
            <p className="text-sm text-neutral-700">Layout: <span className="font-bold text-neutral-900">{board.layoutStyle}</span></p>
            <p className="text-sm text-neutral-700">Tint: <span className="font-bold text-neutral-900">{Math.round((board.displayTintOpacity ?? 0) * 100)}%</span></p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
            <p className="font-bold text-neutral-900">Bento Tip</p>
            <p className="mt-1">Use <span className="font-semibold">THREE_COLUMN</span> or <span className="font-semibold">TWO_COLUMN_GRID</span> for the strongest bento look.</p>
          </div>
        </aside>

        <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-neutral-700 sm:col-span-6">
          <Link to="/dashboard" className="underline">Back to Dashboard</Link>
          <Link to={`/display/${board.boardId}`} className="underline">Open Display Preview</Link>
        </div>
      </section>
    </main>
  )
}
