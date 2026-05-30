export type LayoutStyle = 'THREE_COLUMN' | 'TWO_COLUMN_GRID' | 'HALF_IMAGE'
export type PlaybackMode = 'MENU_ONLY' | 'MIXED' | 'MEDIA_ONLY'
export type MediaAssetType = 'IMAGE' | 'VIDEO'
export type ImageCornerStyle = 'ROUNDED' | 'SOFT' | 'SQUARE'

export type StatusTag = 'SOLD_OUT' | 'HOT_DEAL' | 'CONTAINS_GLUTEN' | 'CONTAINS_FISH'

export type AccentProfile = 'AMBER' | 'CYAN' | 'LIME' | 'ROSE'

export interface MenuItem {
  id: string
  name: string
  description: string
  pricePence: number
  statusTags: StatusTag[]
  imageUrl?: string
}

export interface MenuSection {
  id: string
  title: string
  items: MenuItem[]
}

export interface MarketingPanelItem {
  id: string
  kind: 'OFFER' | 'ALLERGEN'
  headline: string
  body: string
}

export interface MediaAsset {
  id: string
  type: MediaAssetType
  url: string
  durationSeconds: number
}

export interface SignageBoardConfig {
  boardId: string
  ownerUid?: string
  storeName: string
  layoutStyle: LayoutStyle
  playbackMode: PlaybackMode
  menuHoldSeconds: number
  currencySymbol: 'GBP'
  accentProfile: AccentProfile
  customBrandHex?: string
  displayTintHex?: string
  displayTintOpacity?: number
  imageCornerStyle?: ImageCornerStyle
  queueHeaderText?: string
  heroImageUrl?: string
  sidebarImageUrl?: string
  menuSections: MenuSection[]
  sidebarItems: MarketingPanelItem[]
  mediaPlaylist: MediaAsset[]
}
