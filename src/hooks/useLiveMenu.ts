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

export const useLiveMenu = (boardId: string): LiveMenuState => {
  const [board, setBoard] = useState<SignageBoardConfig>(() => {
    return loadBoardFromLocal(boardId) ?? getFallbackBoard(boardId)
  })
  const [source, setSource] = useState<SourceType>('DEFAULTS')
  const [online, setOnline] = useState<boolean>(navigator.onLine)

  useEffect(() => {
    const local = loadBoardFromLocal(boardId)
    if (local) {
      setBoard(local)
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
        setBoard(local)
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

        const next = snapshot.data() as SignageBoardConfig
        setBoard(next)
        saveBoardToLocal(next)
        setSource('FIRESTORE')
      },
      () => {
        const local = loadBoardFromLocal(boardId)
        if (local) {
          setBoard(local)
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
