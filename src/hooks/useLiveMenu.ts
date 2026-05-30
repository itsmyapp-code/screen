import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { defaultBoardId, defaultBoards } from '../data/defaultBoards'
import { db } from '../lib/firebase'
import { loadBoardFromLocal, saveBoardToLocal } from '../lib/storage'
import type { SignageBoardConfig } from '../types/signage'

type SourceType = 'FIRESTORE' | 'LOCAL_CACHE' | 'DEFAULTS'

interface LiveMenuState {
  board: SignageBoardConfig
  source: SourceType
  online: boolean
}

const getFallbackBoard = (boardId: string): SignageBoardConfig => {
  return defaultBoards[boardId] ?? defaultBoards[defaultBoardId]
}

const normalizeBoard = (input: SignageBoardConfig): SignageBoardConfig => {
  return {
    ...input,
    playbackMode: input.playbackMode ?? 'MENU_ONLY',
    menuHoldSeconds: input.menuHoldSeconds ?? 20,
    displayTintHex: input.displayTintHex ?? '#000000',
    displayTintOpacity: input.displayTintOpacity ?? 0,
    imageCornerStyle: input.imageCornerStyle ?? 'ROUNDED',
    queueHeaderText: input.queueHeaderText ?? 'Queue Friendly Display',
    mediaPlaylist: input.mediaPlaylist ?? [],
  }
}

export const useLiveMenu = (boardId: string): LiveMenuState => {
  const [board, setBoard] = useState<SignageBoardConfig>(() => {
    const local = loadBoardFromLocal(boardId)
    return local ? normalizeBoard(local) : getFallbackBoard(boardId)
  })
  const [source, setSource] = useState<SourceType>('DEFAULTS')
  const [online, setOnline] = useState<boolean>(navigator.onLine)

  useEffect(() => {
    const local = loadBoardFromLocal(boardId)
    if (local) {
      setBoard(normalizeBoard(local))
      setSource('LOCAL_CACHE')
      return
    }

    setBoard(getFallbackBoard(boardId))
    setSource('DEFAULTS')
  }, [boardId])

  useEffect(() => {
    const syncFromLocal = (): void => {
      const local = loadBoardFromLocal(boardId)
      if (local) {
        setBoard(normalizeBoard(local))
        setSource('LOCAL_CACHE')
      }
    }

    const onStorage = (event: StorageEvent): void => {
      if (event.key === `itsmyscreen.board.${boardId}`) {
        syncFromLocal()
      }
    }

    const onCustomSync = (event: Event): void => {
      const custom = event as CustomEvent<{ boardId?: string }>
      if (!custom.detail?.boardId || custom.detail.boardId === boardId) {
        syncFromLocal()
      }
    }

    const onNetworkOnline = (): void => setOnline(true)
    const onNetworkOffline = (): void => setOnline(false)

    window.addEventListener('storage', onStorage)
    window.addEventListener('itsmyscreen-sync', onCustomSync)
    window.addEventListener('online', onNetworkOnline)
    window.addEventListener('offline', onNetworkOffline)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('itsmyscreen-sync', onCustomSync)
      window.removeEventListener('online', onNetworkOnline)
      window.removeEventListener('offline', onNetworkOffline)
    }
  }, [boardId])

  useEffect(() => {
    if (!db) {
      return
    }

    const boardRef = doc(db, 'boards', boardId)
    const unsubscribe = onSnapshot(
      boardRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return
        }

        const next = normalizeBoard(snapshot.data() as SignageBoardConfig)
        setBoard(next)
        saveBoardToLocal(next)
        setSource('FIRESTORE')
      },
      () => {
        const local = loadBoardFromLocal(boardId)
        if (local) {
          setBoard(normalizeBoard(local))
          setSource('LOCAL_CACHE')
        }
      },
    )

    return () => {
      unsubscribe()
    }
  }, [boardId])

  const state = useMemo(
    () => ({ board, source, online }),
    [board, source, online],
  )

  return state
}
