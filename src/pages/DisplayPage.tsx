import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { defaultBoardId } from '../data/defaultBoards'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { useLiveMenu } from '../hooks/useLiveMenu'
import { useViewportScale } from '../hooks/useViewportScale'
import {
  HalfImageLayout,
  ThreeColumnLayout,
  TwoColumnGridLayout,
} from '../layouts/BoardLayouts'
import { ConnectivityBadge } from '../ui/ConnectivityBadge'

export const DisplayPage = () => {
  const params = useParams<{ boardId: string }>()
  const boardId = params.boardId ?? defaultBoardId
  const scale = useViewportScale()
  const { board, online } = useLiveMenu(boardId)

  useAutoRefresh(300_000)

  const content = useMemo(() => {
    if (board.layoutStyle === 'TWO_COLUMN_GRID') {
      return <TwoColumnGridLayout board={board} />
    }

    if (board.layoutStyle === 'HALF_IMAGE') {
      return <HalfImageLayout board={board} />
    }

    return <ThreeColumnLayout board={board} />
  }, [board])

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
          <ConnectivityBadge online={online} />
        </div>
      </div>
    </main>
  )
}
