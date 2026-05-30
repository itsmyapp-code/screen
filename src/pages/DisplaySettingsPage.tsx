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

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700">Loading settings...</main>
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-900 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-neutral-200 bg-white/95 p-4 shadow-xl shadow-neutral-900/10 sm:p-6">
        <header className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Display Settings</p>
          <h1 className="mt-1 text-3xl font-black text-neutral-900">Screen Name, Images and Colours</h1>
          <p className="mt-2 text-sm text-neutral-700">
            Header image and sidebar image are rendered from these fields. Uploading stores an optimized data URL directly in your board settings.
          </p>
        </header>

        <form className="space-y-4" onSubmit={(event) => { void save(event) }}>
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

        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-neutral-700">
          <Link to="/dashboard" className="underline">Back to Dashboard</Link>
          <Link to={`/display/${board.boardId}`} className="underline">Open Display Preview</Link>
        </div>
      </section>
    </main>
  )
}
