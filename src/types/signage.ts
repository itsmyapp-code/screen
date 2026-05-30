export type LayoutStyle = 'THREE_COLUMN' | 'TWO_COLUMN_GRID' | 'HALF_IMAGE'

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

export interface SignageBoardConfig {
  boardId: string
  storeName: string
  layoutStyle: LayoutStyle
  currencySymbol: 'GBP'
  accentProfile: AccentProfile
  customBrandHex?: string
  heroImageUrl?: string
  sidebarImageUrl?: string
  menuSections: MenuSection[]
  sidebarItems: MarketingPanelItem[]
}
