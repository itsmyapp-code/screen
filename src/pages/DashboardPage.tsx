import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { defaultBoardId, defaultBoards } from '../data/defaultBoards'
import { useAuthUser } from '../hooks/useAuthUser'
import { useLiveMenu } from '../hooks/useLiveMenu'
import { auth } from '../lib/firebase'
import { pushBoardUpdate } from '../lib/pushBoardUpdate'
import { formatDateUK } from '../lib/format'
import { ensureUserBoard } from '../lib/userBoard'
import type { MediaAsset, PlaybackMode, SignageBoardConfig, StatusTag } from '../types/signage'
import { PoweredByStrip } from '../ui/PoweredByStrip'

const TAG_OPTIONS: Array<{ label: string; value: StatusTag }> = [
  { label: 'SOLD OUT', value: 'SOLD_OUT' },
  { label: 'HOT DEAL', value: 'HOT_DEAL' },
  { label: 'CONTAINS GLUTEN', value: 'CONTAINS_GLUTEN' },
  { label: 'CONTAINS FISH', value: 'CONTAINS_FISH' },
]

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthUser()
  const [boardId, setBoardId] = useState<string | null>(null)
  const [loadingBoard, setLoadingBoard] = useState(true)
  const [setupError, setSetupError] = useState<string>('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [board, setBoard] = useState<SignageBoardConfig>(defaultBoards[defaultBoardId])
  const [selectedSectionId, setSelectedSectionId] = useState(board.menuSections[0].id)
  const [selectedItemId, setSelectedItemId] = useState(board.menuSections[0].items[0].id)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const live = useLiveMenu(boardId ?? defaultBoardId)

  useEffect(() => {
    const setup = async (): Promise<void> => {
      if (!user) {
        return
      }

      try {
        const provisionedBoardId = await ensureUserBoard(user)
        setBoardId(provisionedBoardId)
        setSetupError('')
      } catch (reason) {
        setSetupError(reason instanceof Error ? reason.message : 'Unable to access board data.')
      } finally {
        setLoadingBoard(false)
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

  useEffect(() => {
    const firstSection = board.menuSections[0]
    if (!firstSection) {
      return
    }

    if (!board.menuSections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(firstSection.id)
      setSelectedItemId(firstSection.items[0]?.id ?? '')
      return
    }

    const section = board.menuSections.find((entry) => entry.id === selectedSectionId)
    if (!section) {
      return
    }

    if (!section.items.some((item) => item.id === selectedItemId) && section.items[0]) {
      setSelectedItemId(section.items[0].id)
    }
  }, [board.menuSections, selectedSectionId, selectedItemId])

  const selectedSection = useMemo(
    () => board.menuSections.find((section) => section.id === selectedSectionId) ?? board.menuSections[0],
    [board.menuSections, selectedSectionId],
  )

  const selectedItem = useMemo(
    () => selectedSection?.items.find((item) => item.id === selectedItemId) ?? selectedSection?.items[0],
    [selectedSection, selectedItemId],
  )

  const updateItem = (updater: (draft: typeof selectedItem) => typeof selectedItem): void => {
    if (!selectedSection || !selectedItem) {
      return
    }

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
    if (!selectedItem) {
      return
    }

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

  const updatePlaybackMode = (mode: PlaybackMode): void => {
    setBoard((prev) => ({ ...prev, playbackMode: mode }))
  }

  const updateMediaAsset = (assetId: string, updater: (asset: MediaAsset) => MediaAsset): void => {
    setBoard((prev) => ({
      ...prev,
      mediaPlaylist: prev.mediaPlaylist.map((asset) => (asset.id === assetId ? updater(asset) : asset)),
    }))
  }

  const addMediaAsset = (): void => {
    const nextId = `media-${Date.now()}`
    setBoard((prev) => ({
      ...prev,
      mediaPlaylist: [
        ...prev.mediaPlaylist,
        {
          id: nextId,
          type: 'IMAGE',
          url: '/screen-logo.png',
          durationSeconds: 10,
        },
      ],
    }))
  }

  const removeMediaAsset = (assetId: string): void => {
    setBoard((prev) => ({
      ...prev,
      mediaPlaylist: prev.mediaPlaylist.filter((asset) => asset.id !== assetId),
    }))
  }

  const onSignOut = async (): Promise<void> => {
    if (!auth) {
      return
    }

    await signOut(auth)
  }

  const fileToDataUrl = async (file: File): Promise<string> => {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
          return
        }

        reject(new Error('Image read failed.'))
      }
      reader.onerror = () => reject(new Error('Image read failed.'))
      reader.readAsDataURL(file)
    })
  }

  const validateImageFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please choose an image file.'
    }

    if (file.size > 2 * 1024 * 1024) {
      return 'Image is too large. Keep it under 2MB for reliable sync.'
    }

    return null
  }

  const uploadBoardImage = async (
    event: ChangeEvent<HTMLInputElement>,
    field: 'heroImageUrl' | 'sidebarImageUrl',
  ): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      setSetupError(validationError)
      event.target.value = ''
      return
    }

    try {
      const url = await fileToDataUrl(file)
      setBoard((prev) => ({
        ...prev,
        [field]: url,
      }))
      setSetupError('')
    } catch (reason) {
      setSetupError(reason instanceof Error ? reason.message : 'Unable to upload image.')
    } finally {
      event.target.value = ''
    }
  }

  const uploadSelectedItemImage = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      setSetupError(validationError)
      event.target.value = ''
      return
    }

    try {
      const url = await fileToDataUrl(file)
      updateItem((current) => ({ ...current, imageUrl: url }))
      setSetupError('')
    } catch (reason) {
      setSetupError(reason instanceof Error ? reason.message : 'Unable to upload image.')
    } finally {
      event.target.value = ''
    }
  }

  const uploadMediaAssetImage = async (
    event: ChangeEvent<HTMLInputElement>,
    assetId: string,
  ): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const validationError = validateImageFile(file)
    if (validationError) {
      setSetupError(validationError)
      event.target.value = ''
      return
    }

    try {
      const url = await fileToDataUrl(file)
      updateMediaAsset(assetId, (asset) => ({
        ...asset,
        type: 'IMAGE',
        url,
      }))
      setSetupError('')
    } catch (reason) {
      setSetupError(reason instanceof Error ? reason.message : 'Unable to upload media image.')
    } finally {
      event.target.value = ''
    }
  }

  if (loadingBoard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700">
        Preparing your board...
      </main>
    )
  }

  if (setupError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 text-neutral-700">
        <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">Board setup failed</p>
          <p className="mt-1">{setupError}</p>
          <p className="mt-2">Check Firestore rules deployment and ensure Email/Password auth is enabled.</p>
        </div>
      </main>
    )
  }

  if (!selectedSection || !selectedItem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 text-neutral-700">
        Board has no editable menu items.
      </main>
    )
  }

  const origin = window.location.origin
  const displayLink = `${origin}/display/${board.boardId}`
  const mediaOnlyLink = `${origin}/display/${board.boardId}?view=media`

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#fef3c7_0%,#f3f4f6_55%,#e5e7eb_100%)] px-4 py-6 text-neutral-900 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-xl shadow-neutral-900/10 sm:p-6">
        {menuOpen && (
          <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-800"
                onClick={() => {
                  void navigate('/dashboard/settings')
                }}
              >
                Display Settings
              </button>
              <button
                type="button"
                className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-800"
                onClick={() => {
                  setHelpOpen((current) => !current)
                }}
              >
                {helpOpen ? 'Hide Help' : 'Open Help'}
              </button>
              <button
                type="button"
                className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-800"
                onClick={() => {
                  setMenuOpen(false)
                }}
              >
                Close Menu
              </button>
            </div>

            {helpOpen && (
              <article className="mt-3 space-y-3 rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800">
                <h2 className="text-base font-black text-neutral-900">Help: Running Your Screen</h2>
                <p className="font-semibold">Quick start</p>
                <p>1. Choose Menu section and item, edit name/price/tags, then tap Push Update to Display.</p>
                <p>2. Open Your Unique Display URL on the TV browser.</p>
                <p>3. For a media loop-only screen, use the Media-only URL.</p>
                <p className="font-semibold">How customers upload images</p>
                <p>1. Use Upload image buttons next to Header Image, Sidebar Image, and Menu Item Image.</p>
                <p>2. For Media Playlist image slides, use Upload image in each media card.</p>
                <p>3. Keep images under 2MB for faster sync and stable playback.</p>
                <p className="font-semibold">Videos</p>
                <p>1. Select Video in Media Playlist.</p>
                <p>2. Paste a direct video URL in the media URL field.</p>
                <p>3. Set duration and push update.</p>
              </article>
            )}
          </div>
        )}

        <header className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-300 bg-white"
                aria-label="Open dashboard menu"
                onClick={() => {
                  setMenuOpen((current) => !current)
                }}
              >
                <span className="space-y-1.5">
                  <span className="block h-0.5 w-5 bg-neutral-900" />
                  <span className="block h-0.5 w-5 bg-neutral-900" />
                  <span className="block h-0.5 w-5 bg-neutral-900" />
                </span>
              </button>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">Merchant Remote</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-800"
                onClick={() => {
                  setHelpOpen(true)
                  setMenuOpen(true)
                }}
              >
                Help
              </button>
              <button
                type="button"
                className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-800"
                onClick={() => {
                  void onSignOut()
                }}
              >
                Sign out
              </button>
            </div>
          </div>
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
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Playback Mode</span>
            <select
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base"
              value={board.playbackMode}
              onChange={(event) => updatePlaybackMode(event.target.value as PlaybackMode)}
            >
              <option value="MENU_ONLY">Menu only</option>
              <option value="MIXED">Menu + media rotation</option>
              <option value="MEDIA_ONLY">Media only</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Menu Hold (seconds)</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              type="number"
              min="5"
              max="120"
              value={board.menuHoldSeconds}
              onChange={(event) => {
                const seconds = Number.parseInt(event.target.value, 10)
                setBoard((prev) => ({
                  ...prev,
                  menuHoldSeconds: Number.isFinite(seconds) ? Math.max(5, seconds) : 20,
                }))
              }}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Header Image URL</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              placeholder="/screen-logo.png or https://..."
              value={board.heroImageUrl ?? ''}
              onChange={(event) => updateBoardImage('heroImageUrl', event.target.value)}
            />
            <input
              className="mt-2 h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => {
                void uploadBoardImage(event, 'heroImageUrl')
              }}
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
            <input
              className="mt-2 h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => {
                void uploadBoardImage(event, 'sidebarImageUrl')
              }}
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
            <input
              className="mt-2 h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
              type="file"
              accept="image/*"
              onChange={(event) => {
                void uploadSelectedItemImage(event)
              }}
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

          <fieldset className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <legend className="px-1 text-sm font-bold uppercase tracking-wide text-neutral-600">Media Playlist</legend>
            {board.mediaPlaylist.map((asset) => (
              <div key={asset.id} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="h-12 rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                    value={asset.type}
                    onChange={(event) => updateMediaAsset(asset.id, (current) => ({
                      ...current,
                      type: event.target.value === 'VIDEO' ? 'VIDEO' : 'IMAGE',
                    }))}
                  >
                    <option value="IMAGE">Image (Ken Burns)</option>
                    <option value="VIDEO">Video</option>
                  </select>

                  <input
                    className="h-12 rounded-xl border border-neutral-300 px-3 text-sm"
                    type="number"
                    min="3"
                    max="180"
                    value={asset.durationSeconds}
                    onChange={(event) => updateMediaAsset(asset.id, (current) => ({
                      ...current,
                      durationSeconds: Math.max(3, Number.parseInt(event.target.value, 10) || 10),
                    }))}
                  />
                </div>

                <input
                  className="h-12 w-full rounded-xl border border-neutral-300 px-3 text-sm"
                  placeholder="https://...mp4 or /your-image.jpg"
                  value={asset.url}
                  onChange={(event) => updateMediaAsset(asset.id, (current) => ({
                    ...current,
                    url: event.target.value,
                  }))}
                />

                <input
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    void uploadMediaAssetImage(event, asset.id)
                  }}
                />

                <button
                  type="button"
                  className="h-12 w-full rounded-xl border border-red-300 bg-red-50 text-sm font-bold text-red-700"
                  onClick={() => removeMediaAsset(asset.id)}
                >
                  Remove Asset
                </button>
              </div>
            ))}

            <button
              type="button"
              className="h-12 w-full rounded-xl border border-neutral-300 bg-white text-sm font-bold text-neutral-800"
              onClick={addMediaAsset}
            >
              Add Media Asset
            </button>
          </fieldset>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-neutral-900 text-base font-bold text-white shadow-lg shadow-neutral-900/20"
          >
            Push Update to Display
          </button>
        </form>

        <section className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-bold text-neutral-900">Your Unique Display URLs</p>
          <Link className="mt-1 inline-block font-semibold text-blue-700 underline" to={`/display/${board.boardId}`}>
            Open live board view for {board.boardId}
          </Link>
          <p className="mt-2 break-all text-neutral-700">{displayLink}</p>
          <p className="mt-3 font-semibold text-neutral-900">Media-only screen</p>
          <p className="mt-1 break-all text-neutral-700">{mediaOnlyLink}</p>
          {savedAt && <p className="mt-2">Last pushed: {formatDateUK(savedAt)}</p>}
        </section>

        <footer className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-neutral-600">
          <Link className="underline" to="/terms">Terms</Link>
          <Link className="underline" to="/privacy">Privacy</Link>
          <Link className="underline" to="/cookies">Cookies</Link>
          <Link className="underline" to="/accessibility">Accessibility</Link>
        </footer>

        <PoweredByStrip className="mt-4" />
      </section>
    </main>
  )
}
