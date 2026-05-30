import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { defaultBoardId, defaultBoards } from '../data/defaultBoards'
import { useAuthUser } from '../hooks/useAuthUser'
import { useLiveMenu } from '../hooks/useLiveMenu'
import { auth } from '../lib/firebase'
import { imageFileToWebpDataUrl, validateImageFile } from '../lib/imageUpload'
import { pushBoardUpdate } from '../lib/pushBoardUpdate'
import { formatDateUK } from '../lib/format'
import { ensureUserBoard } from '../lib/userBoard'
import type {
  MediaAsset,
  PlaybackMode,
  SignageBoardConfig,
  StatusTag,
} from '../types/signage'
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
  const [selectedNoticeId, setSelectedNoticeId] = useState(board.sidebarItems[0]?.id ?? '')
  const [priceInput, setPriceInput] = useState(
    ((board.menuSections[0].items[0]?.pricePence ?? 0) / 100).toFixed(2),
  )
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

  useEffect(() => {
    if (board.sidebarItems.length === 0) {
      setSelectedNoticeId('')
      return
    }

    if (!board.sidebarItems.some((notice) => notice.id === selectedNoticeId)) {
      setSelectedNoticeId(board.sidebarItems[0].id)
    }
  }, [board.sidebarItems, selectedNoticeId])

  const selectedSection = useMemo(
    () => board.menuSections.find((section) => section.id === selectedSectionId) ?? board.menuSections[0],
    [board.menuSections, selectedSectionId],
  )

  const selectedItem = useMemo(
    () => selectedSection?.items.find((item) => item.id === selectedItemId) ?? selectedSection?.items[0],
    [selectedSection, selectedItemId],
  )

  const selectedNotice = useMemo(
    () => board.sidebarItems.find((notice) => notice.id === selectedNoticeId) ?? board.sidebarItems[0],
    [board.sidebarItems, selectedNoticeId],
  )

  useEffect(() => {
    setPriceInput(((selectedItem?.pricePence ?? 0) / 100).toFixed(2))
  }, [selectedItem?.id, selectedItem?.pricePence])

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
    try {
      await pushBoardUpdate(board)
      setSavedAt(new Date())
      setSetupError('')
    } catch (reason) {
      setSetupError(reason instanceof Error ? reason.message : 'Unable to save changes to board.')
    }
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

  const addMenuSection = (): void => {
    const sectionId = `section-${Date.now()}`
    const firstItemId = `item-${Date.now()}`

    setBoard((prev) => ({
      ...prev,
      menuSections: [
        ...prev.menuSections,
        {
          id: sectionId,
          title: 'New section',
          items: [
            {
              id: firstItemId,
              name: 'New item',
              description: '',
              pricePence: 0,
              statusTags: [],
            },
          ],
        },
      ],
    }))

    setSelectedSectionId(sectionId)
    setSelectedItemId(firstItemId)
  }

  const deleteSelectedSection = (): void => {
    if (!selectedSection || board.menuSections.length <= 1) {
      return
    }

    const nextSections = board.menuSections.filter((section) => section.id !== selectedSection.id)
    const nextSection = nextSections[0]

    setBoard((prev) => ({
      ...prev,
      menuSections: nextSections,
    }))

    if (nextSection) {
      setSelectedSectionId(nextSection.id)
      setSelectedItemId(nextSection.items[0]?.id ?? '')
    }
  }

  const addMenuItem = (): void => {
    if (!selectedSection) {
      return
    }

    const nextId = `item-${Date.now()}`
    const nextItem = {
      id: nextId,
      name: 'New item',
      description: '',
      pricePence: 0,
      statusTags: [] as StatusTag[],
    }

    setBoard((prev) => ({
      ...prev,
      menuSections: prev.menuSections.map((section) =>
        section.id === selectedSection.id
          ? {
              ...section,
              items: [...section.items, nextItem],
            }
          : section,
      ),
    }))
    setSelectedItemId(nextId)
  }

  const deleteSelectedMenuItem = (): void => {
    if (!selectedSection || !selectedItem || selectedSection.items.length <= 1) {
      return
    }

    const nextItems = selectedSection.items.filter((item) => item.id !== selectedItem.id)
    setBoard((prev) => ({
      ...prev,
      menuSections: prev.menuSections.map((section) =>
        section.id === selectedSection.id
          ? {
              ...section,
              items: nextItems,
            }
          : section,
      ),
    }))
    setSelectedItemId(nextItems[0]?.id ?? '')
  }

  const updateNotice = (updater: (notice: typeof selectedNotice) => typeof selectedNotice): void => {
    if (!selectedNotice) {
      return
    }

    setBoard((prev) => ({
      ...prev,
      sidebarItems: prev.sidebarItems.map((notice) =>
        notice.id === selectedNotice.id ? updater(notice) : notice,
      ),
    }))
  }

  const addNotice = (): void => {
    const nextId = `notice-${Date.now()}`
    setBoard((prev) => ({
      ...prev,
      sidebarItems: [
        ...prev.sidebarItems,
        {
          id: nextId,
          kind: 'OFFER',
          headline: 'New notice',
          body: '',
        },
      ],
    }))
    setSelectedNoticeId(nextId)
  }

  const deleteSelectedNotice = (): void => {
    if (!selectedNotice || board.sidebarItems.length <= 1) {
      return
    }

    const nextNotices = board.sidebarItems.filter((notice) => notice.id !== selectedNotice.id)
    setBoard((prev) => ({
      ...prev,
      sidebarItems: nextNotices,
    }))
    setSelectedNoticeId(nextNotices[0]?.id ?? '')
  }

  const commitPriceInput = (): void => {
    if (!selectedItem) {
      return
    }

    const cleaned = priceInput.replace(',', '.').replace(/[^\d.]/g, '')
    const parts = cleaned.split('.')
    const normalized = parts.length <= 1 ? cleaned : `${parts[0]}.${parts.slice(1).join('')}`
    const pounds = Number.parseFloat(normalized)
    const pence = Number.isFinite(pounds) ? Math.max(0, Math.round(pounds * 100)) : 0
    updateItem((current) => ({ ...current, pricePence: pence }))
    setPriceInput((pence / 100).toFixed(2))
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
      const url = await imageFileToWebpDataUrl(file)
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
      const url = await imageFileToWebpDataUrl(file)
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
      const url = await imageFileToWebpDataUrl(file)
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

  if (!selectedSection) {
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
          <div className="fixed inset-0 z-40">
            <button
              type="button"
              className="absolute inset-0 bg-black/35"
              aria-label="Close menu"
              onClick={() => {
                setMenuOpen(false)
              }}
            />
            <aside className="absolute left-0 top-0 h-full w-[92%] max-w-sm overflow-y-auto border-r border-neutral-300 bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.12em] text-neutral-700">Dashboard Menu</p>
                <button
                  type="button"
                  className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-bold text-neutral-800"
                  onClick={() => {
                    setMenuOpen(false)
                  }}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-bold text-neutral-800"
                  onClick={() => {
                    void navigate('/dashboard/settings')
                    setMenuOpen(false)
                  }}
                >
                  Display Settings
                </button>
                <button
                  type="button"
                  className="h-11 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-bold text-neutral-800"
                  onClick={() => {
                    setHelpOpen((current) => !current)
                  }}
                >
                  {helpOpen ? 'Hide Help' : 'Open Help'}
                </button>
              </div>

              <p className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                Menu, section, item, and live notice editing is now on the main dashboard page below.
              </p>

              {helpOpen && (
                <article className="mt-4 space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-800">
                  <h2 className="text-base font-black text-neutral-900">Help: Running Your Screen</h2>
                  <p>Select a section, item, and notice in the on-page manager cards.</p>
                  <p>Edit content and pricing, then tap Push Update to Display.</p>
                </article>
              )}
            </aside>
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
            Update menu sections, items, prices, and notices directly on this screen.
          </p>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-bold">Subscription Logic (DMCCA 2027)</p>
            <p className="mt-1">Easy Exit enabled in one tap. Cooling-off reminder at day 13 for all paid plans.</p>
            <p className="mt-1">All prices shown upfront in GBP with no drip pricing patterns.</p>
          </div>
        </header>

        <form className="mt-6 space-y-4" onSubmit={onSave}>
          <section className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-3">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-neutral-700">Section and Item</p>

              <div className="space-y-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">Section</span>
                  <select
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                    value={selectedSection.id}
                    onChange={(event) => {
                      const nextSection = board.menuSections.find((section) => section.id === event.target.value)
                      if (!nextSection) {
                        return
                      }

                      setSelectedSectionId(nextSection.id)
                      setSelectedItemId(nextSection.items[0]?.id ?? '')
                    }}
                  >
                    {board.menuSections.map((section) => (
                      <option key={section.id} value={section.id}>{section.title}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="h-10 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-bold text-neutral-800"
                    onClick={addMenuSection}
                  >
                    Add Section
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded-lg border border-red-300 bg-red-50 px-2 text-xs font-bold text-red-700 disabled:opacity-50"
                    onClick={deleteSelectedSection}
                    disabled={board.menuSections.length <= 1}
                  >
                    Delete Section
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">Item</span>
                  <select
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                    value={selectedItem?.id ?? ''}
                    onChange={(event) => {
                      setSelectedItemId(event.target.value)
                    }}
                  >
                    {selectedSection.items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="h-10 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-bold text-neutral-800"
                    onClick={addMenuItem}
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded-lg border border-red-300 bg-red-50 px-2 text-xs font-bold text-red-700 disabled:opacity-50"
                    onClick={deleteSelectedMenuItem}
                    disabled={!selectedItem || selectedSection.items.length <= 1}
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-3">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-neutral-700">Live Notices</p>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">Notice</span>
                <select
                  className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                  value={selectedNotice?.id ?? ''}
                  onChange={(event) => {
                    setSelectedNoticeId(event.target.value)
                  }}
                >
                  {board.sidebarItems.map((notice) => (
                    <option key={notice.id} value={notice.id}>{notice.headline || 'Untitled notice'}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-bold text-neutral-800"
                  onClick={addNotice}
                >
                  Add Notice
                </button>
                <button
                  type="button"
                  className="h-10 rounded-lg border border-red-300 bg-red-50 px-2 text-xs font-bold text-red-700 disabled:opacity-50"
                  onClick={deleteSelectedNotice}
                  disabled={!selectedNotice || board.sidebarItems.length <= 1}
                >
                  Delete Notice
                </button>
              </div>
              <p className="text-xs text-neutral-600">Tip: choose a notice here, then edit its fields below.</p>
            </div>
          </section>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            <p>
              Editing section: <span className="font-bold text-neutral-900">{selectedSection.title}</span>
            </p>
            <p>
              Editing item: <span className="font-bold text-neutral-900">{selectedItem?.name ?? 'No item selected'}</span>
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Menu Section Name</span>
            <input
              className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
              value={selectedSection.title}
              onChange={(event) => {
                setBoard((prev) => ({
                  ...prev,
                  menuSections: prev.menuSections.map((section) =>
                    section.id === selectedSection.id ? { ...section, title: event.target.value } : section,
                  ),
                }))
              }}
            />
          </label>

          {selectedItem && (
            <>
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
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={priceInput}
                  onChange={(event) => {
                    setPriceInput(event.target.value)
                  }}
                  onBlur={() => {
                    commitPriceInput()
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      commitPriceInput()
                    }
                  }}
                />
                <p className="mt-1 text-xs text-neutral-600">Type freely (for example 7.9 or 7.90), then tab out.</p>
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
            </>
          )}

          <fieldset className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <legend className="px-1 text-sm font-bold uppercase tracking-wide text-neutral-600">Edit Selected Notice</legend>
            {selectedNotice && (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Notice Type</span>
                  <select
                    className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base"
                    value={selectedNotice.kind}
                    onChange={(event) => updateNotice((current) => ({
                      ...current,
                      kind: event.target.value === 'ALLERGEN' ? 'ALLERGEN' : 'OFFER',
                    }))}
                  >
                    <option value="OFFER">Offer</option>
                    <option value="ALLERGEN">Allergen</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Headline</span>
                  <input
                    className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base"
                    value={selectedNotice.headline}
                    onChange={(event) => updateNotice((current) => ({ ...current, headline: event.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold uppercase tracking-wide text-neutral-600">Body</span>
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-neutral-300 px-4 py-3 text-base"
                    value={selectedNotice.body}
                    onChange={(event) => updateNotice((current) => ({ ...current, body: event.target.value }))}
                  />
                </label>
              </>
            )}
          </fieldset>

          <details className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-neutral-700">Advanced Media and Playback</summary>
            <div className="mt-3 space-y-4">
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

              <fieldset className="space-y-2 rounded-2xl border border-neutral-200 bg-white p-3">
                <legend className="px-1 text-sm font-bold uppercase tracking-wide text-neutral-600">Media Playlist</legend>
                {board.mediaPlaylist.map((asset) => (
                  <div key={asset.id} className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
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
            </div>
          </details>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-neutral-900 text-base font-bold text-white shadow-lg shadow-neutral-900/20"
          >
            Push Update to Display
          </button>
        </form>

        <section className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          {setupError && (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 font-semibold text-red-700">
              {setupError}
            </p>
          )}
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
