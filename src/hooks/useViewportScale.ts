import { useEffect, useState } from 'react'

const BOARD_WIDTH = 1920
const BOARD_HEIGHT = 1080

export const useViewportScale = (): number => {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = (): void => {
      const widthRatio = window.innerWidth / BOARD_WIDTH
      const heightRatio = window.innerHeight / BOARD_HEIGHT
      setScale(Math.min(widthRatio, heightRatio))
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  return scale
}
