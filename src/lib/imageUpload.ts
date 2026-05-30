export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file.'
  }

  if (file.size > 6 * 1024 * 1024) {
    return 'Image is too large. Keep it under 6MB.'
  }

  return null
}

const loadImage = async (file: File): Promise<HTMLImageElement> => {
  return await new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to decode image file.'))
    }

    image.src = objectUrl
  })
}

export const imageFileToWebpDataUrl = async (
  file: File,
  maxDimension = 1600,
  quality = 0.82,
): Promise<string> => {
  const image = await loadImage(file)

  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
  const targetWidth = Math.max(1, Math.round(image.width * scale))
  const targetHeight = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to process image.')
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  const webpUrl = canvas.toDataURL('image/webp', quality)

  if (!webpUrl.startsWith('data:image/webp')) {
    throw new Error('WEBP conversion failed.')
  }

  return webpUrl
}
