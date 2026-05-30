import type { User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { defaultBoardId, defaultBoards } from '../data/defaultBoards'
import { db } from './firebase'
import type { SignageBoardConfig } from '../types/signage'

interface UserProfile {
  boardId: string
  email: string | null
  createdAt: ReturnType<typeof serverTimestamp>
}

const cloneDefaultBoard = (): SignageBoardConfig => {
  return JSON.parse(JSON.stringify(defaultBoards[defaultBoardId])) as SignageBoardConfig
}

const makeBoardId = (uid: string): string => {
  return `board-${uid.slice(0, 10)}`
}

export const ensureUserBoard = async (user: User): Promise<string> => {
  const generatedBoardId = makeBoardId(user.uid)

  if (!db) {
    return generatedBoardId
  }

  const profileRef = doc(db, 'users', user.uid)
  const profileSnapshot = await getDoc(profileRef)

  const existingProfileBoardId = profileSnapshot.exists()
    ? (profileSnapshot.data().boardId as string | undefined)
    : undefined

  const boardId =
    typeof existingProfileBoardId === 'string' && existingProfileBoardId.trim().length > 0
      ? existingProfileBoardId
      : generatedBoardId

  if (!profileSnapshot.exists() || existingProfileBoardId !== boardId) {
    const profile: UserProfile = {
      boardId,
      email: user.email,
      createdAt: serverTimestamp(),
    }

    await setDoc(profileRef, profile, { merge: true })
  }

  const boardRef = doc(db, 'boards', boardId)
  const boardSnapshot = await getDoc(boardRef)

  if (!boardSnapshot.exists()) {
    const seed = cloneDefaultBoard()
    const storeName = user.email ? `${user.email.split('@')[0]}'s Board` : 'Merchant Board'

    const seededBoard: SignageBoardConfig = {
      ...seed,
      boardId,
      ownerUid: user.uid,
      storeName,
    }

    await setDoc(boardRef, seededBoard)
  } else {
    await setDoc(
      boardRef,
      {
        ownerUid: user.uid,
      },
      { merge: true },
    )
  }

  return boardId
}
