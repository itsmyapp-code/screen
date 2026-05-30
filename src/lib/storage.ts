import type { SignageBoardConfig } from '../types/signage'

const keyForBoard = (boardId: string): string => `itsmyscreen.board.${boardId}`

export const saveBoardToLocal = (board: SignageBoardConfig): void => {
  localStorage.setItem(keyForBoard(board.boardId), JSON.stringify(board))
  window.dispatchEvent(new CustomEvent('itsmyscreen-sync', { detail: { boardId: board.boardId } }))
}

export const loadBoardFromLocal = (boardId: string): SignageBoardConfig | null => {
  const raw = localStorage.getItem(keyForBoard(boardId))
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SignageBoardConfig
  } catch {
    return null
  }
}
