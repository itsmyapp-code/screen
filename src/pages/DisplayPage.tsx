import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { defaultBoardId } from '../data/defaultBoards'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useLiveMenu } from '../hooks/useLiveMenu'
import { useViewportScale } from '../hooks/useViewportScale'
import {
  HalfImageLayout,
  ThreeColumnLayout,
  TwoColumnGridLayout,
} from '../layouts/BoardLayouts'
import type { PlaybackMode } from '../types/signage'

const MediaFrame = ({
  url,
  type,
  liteMode,
}: {
  url: string
  type: 'IMAGE' | 'VIDEO'
  liteMode: boolean
}) => {
  if (type === 'VIDEO') {
    return (
      <video
        className="h-full w-full object-cover"
        src={url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    )
  }

  return (
    <img
      src={url}
      alt="Promotional slide"
      className={liteMode ? 'h-full w-full object-cover' : 'ken-burns-media h-full w-full object-cover'}
      loading="eager"
    />
  )
}

export const DisplayPage = () => {
  const params = useParams<{ boardId: string }>()
  const [searchParams] = useSearchParams()
  const boardId = params.boardId ?? defaultBoardId
  const scale = useViewportScale()
  const { board } = useLiveMenu(boardId)
  const tvMode = searchParams.get('tv')
  const liteMode = tvMode === 'lite' || tvMode === '1'
  const [showMedia, setShowMedia] = useState(false)
  const [mediaIndex, setMediaIndex] = useState(0)

  useAutoRefresh(300_000)

  const hasMedia = board.mediaPlaylist.length > 0
  const queryView = searchParams.get('view')
  const forcedMode: PlaybackMode | null =
    queryView === 'media' ? 'MEDIA_ONLY' : queryView === 'menu' ? 'MENU_ONLY' : null
  const mode = forcedMode ?? board.playbackMode

  useEffect(() => {
    setShowMedia(mode === 'MEDIA_ONLY')
    setMediaIndex(0)
  }, [mode, board.boardId])

  useEffect(() => {
    if (!hasMedia || mode === 'MENU_ONLY') {
      setShowMedia(false)
      return
    }

    if (mode === 'MEDIA_ONLY') {
      setShowMedia(true)
      const active = board.mediaPlaylist[mediaIndex % board.mediaPlaylist.length]
      const timer = window.setTimeout(() => {
        setMediaIndex((current) => (current + 1) % board.mediaPlaylist.length)
      }, Math.max(active.durationSeconds, 3) * 1000)

      return () => {
        window.clearTimeout(timer)
      }
    }

    const menuTimer = window.setTimeout(() => {
      setShowMedia(true)
    }, Math.max(board.menuHoldSeconds, 5) * 1000)

    return () => {
      window.clearTimeout(menuTimer)
    }
  }, [hasMedia, mode, board.mediaPlaylist, board.menuHoldSeconds, mediaIndex])

  useEffect(() => {
    if (!hasMedia || mode !== 'MIXED' || !showMedia) {
      return
    }

    const active = board.mediaPlaylist[mediaIndex % board.mediaPlaylist.length]
    const mediaTimer = window.setTimeout(() => {
      setShowMedia(false)
      setMediaIndex((current) => (current + 1) % board.mediaPlaylist.length)
    }, Math.max(active.durationSeconds, 3) * 1000)

    return () => {
      window.clearTimeout(mediaTimer)
    }
  }, [hasMedia, mode, showMedia, board.mediaPlaylist, mediaIndex])

  const content = useMemo(() => {
    if ((mode === 'MEDIA_ONLY' || (mode === 'MIXED' && showMedia)) && hasMedia) {
      const activeMedia = board.mediaPlaylist[mediaIndex % board.mediaPlaylist.length]
      return <MediaFrame type={activeMedia.type} url={activeMedia.url} liteMode={liteMode} />
    }

    if (liteMode) {
      return <ThreeColumnLayout board={board} />
    }

    if (board.layoutStyle === 'TWO_COLUMN_GRID') {
      return <TwoColumnGridLayout board={board} />
    }

    if (board.layoutStyle === 'HALF_IMAGE') {
      return <HalfImageLayout board={board} />
    }

    return <ThreeColumnLayout board={board} />
  }, [board, hasMedia, mediaIndex, mode, showMedia, liteMode])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-neutral-50">
      <div
        className="origin-center"
        style={{
          width: '1920px',
          height: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="relative h-[1080px] w-[1920px] overflow-hidden bg-neutral-950 text-neutral-50">
          {content}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundColor: board.displayTintHex ?? '#000000',
              opacity: board.displayTintOpacity ?? 0,
            }}
          />
        </div>
      </div>
    </main>
  )
}
