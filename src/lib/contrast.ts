export const hexToRgb = (hex: string): [number, number, number] | null => {
  const clean = hex.replace('#', '').trim()
  const normalized =
    clean.length === 3
      ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
      : clean

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

const relativeChannel = (value: number): number => {
  const sRgb = value / 255
  return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4
}

const luminance = ([r, g, b]: [number, number, number]): number => {
  return 0.2126 * relativeChannel(r) + 0.7152 * relativeChannel(g) + 0.0722 * relativeChannel(b)
}

export const contrastRatio = (foregroundHex: string, backgroundHex: string): number => {
  const fg = hexToRgb(foregroundHex)
  const bg = hexToRgb(backgroundHex)

  if (!fg || !bg) {
    return 1
  }

  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const lightest = Math.max(l1, l2)
  const darkest = Math.min(l1, l2)

  return (lightest + 0.05) / (darkest + 0.05)
}

export const passesWcagAA = (foregroundHex: string, backgroundHex: string): boolean => {
  return contrastRatio(foregroundHex, backgroundHex) >= 4.5
}
