import type { SignageBoardConfig } from '../types/signage'
import { saveBoardToLocal } from './storage'

export const pushBoardUpdate = async (board: SignageBoardConfig): Promise<void> => {
  saveBoardToLocal(board)

  const firebaseModule = await import('./firebase')
  if (!firebaseModule.db) {
    return
  }

  const firestore = await import('firebase/firestore')
  const boardRef = firestore.doc(firebaseModule.db, 'boards', board.boardId)
  await firestore.setDoc(boardRef, board, { merge: true })
}
