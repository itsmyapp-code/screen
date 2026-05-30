import type { SignageBoardConfig } from '../types/signage'

export const defaultBoards: Record<string, SignageBoardConfig> = {
  'chipshop-main': {
    boardId: 'chipshop-main',
    storeName: 'Seaside Fry House',
    layoutStyle: 'THREE_COLUMN',
    playbackMode: 'MENU_ONLY',
    menuHoldSeconds: 20,
    currencySymbol: 'GBP',
    accentProfile: 'AMBER',
    customBrandHex: '#f59e0b',
    displayTintHex: '#000000',
    displayTintOpacity: 0,
    imageCornerStyle: 'ROUNDED',
    queueHeaderText: 'Queue Friendly Display',
    heroImageUrl: '/screen-logo.png',
    sidebarImageUrl: '/screen-logo.png',
    menuSections: [
      {
        id: 'popular',
        title: 'Popular Orders',
        items: [
          {
            id: 'haddock-large',
            name: 'Large Haddock & Chips',
            description: 'Crisp battered fillet with chunky chips',
            pricePence: 1095,
            statusTags: ['HOT_DEAL', 'CONTAINS_FISH'],
            imageUrl: '/screen-logo.png',
          },
          {
            id: 'pie-gravy',
            name: 'Pie & Gravy',
            description: 'Steak pie with rich homemade gravy',
            pricePence: 795,
            statusTags: ['CONTAINS_GLUTEN'],
          },
          {
            id: 'sausage-batch',
            name: 'Battered Sausage Meal',
            description: 'Battered sausage, chips and curry sauce',
            pricePence: 825,
            statusTags: [],
          },
        ],
      },
      {
        id: 'classics',
        title: 'Chip Shop Classics',
        items: [
          {
            id: 'cod-regular',
            name: 'Regular Cod & Chips',
            description: 'Fresh cod fillet with chips',
            pricePence: 965,
            statusTags: ['CONTAINS_FISH'],
          },
          {
            id: 'scampi',
            name: 'Breaded Scampi Basket',
            description: 'Breaded scampi with tartare dip',
            pricePence: 925,
            statusTags: ['CONTAINS_FISH', 'CONTAINS_GLUTEN'],
          },
          {
            id: 'fish-cake',
            name: 'Fish Cake & Chips',
            description: 'Crisped fish cake with chips',
            pricePence: 785,
            statusTags: ['CONTAINS_FISH', 'CONTAINS_GLUTEN'],
          },
        ],
      },
      {
        id: 'sides',
        title: 'Sides & Extras',
        items: [
          {
            id: 'peas',
            name: 'Mushy Peas',
            description: 'Traditional side pot',
            pricePence: 250,
            statusTags: [],
          },
          {
            id: 'curry',
            name: 'Curry Sauce',
            description: 'Mild house curry sauce',
            pricePence: 250,
            statusTags: [],
          },
          {
            id: 'pickled-egg',
            name: 'Pickled Egg',
            description: 'Chip shop counter classic',
            pricePence: 120,
            statusTags: ['SOLD_OUT'],
          },
        ],
      },
    ],
    sidebarItems: [
      {
        id: 'offer-1',
        kind: 'OFFER',
        headline: 'Lunch Saver 12:00-14:00',
        body: 'Any regular fish & chips + can for only £8.95.',
      },
      {
        id: 'allergen-1',
        kind: 'ALLERGEN',
        headline: 'Allergen Notice',
        body: 'Frying oil may contain fish, gluten and milk traces.',
      },
      {
        id: 'offer-2',
        kind: 'OFFER',
        headline: 'Family Friday Bundle',
        body: '2 large fish, 2 kids meals, 2 sauces for £24.00.',
      },
    ],
    mediaPlaylist: [
      {
        id: 'media-main-1',
        type: 'IMAGE',
        url: '/screen-logo.png',
        durationSeconds: 12,
      },
    ],
  },
  drinks: {
    boardId: 'drinks',
    storeName: 'Seaside Fry House',
    layoutStyle: 'TWO_COLUMN_GRID',
    playbackMode: 'MENU_ONLY',
    menuHoldSeconds: 20,
    currencySymbol: 'GBP',
    accentProfile: 'CYAN',
    displayTintHex: '#000000',
    displayTintOpacity: 0,
    imageCornerStyle: 'ROUNDED',
    queueHeaderText: 'Queue Friendly Display',
    heroImageUrl: '/screen-logo.png',
    sidebarImageUrl: '/screen-logo.png',
    menuSections: [
      {
        id: 'cold',
        title: 'Cold Drinks',
        items: [
          { id: 'cola', name: 'Cola Can', description: '330ml', pricePence: 180, statusTags: [] },
          { id: 'diet-cola', name: 'Diet Cola', description: '330ml', pricePence: 180, statusTags: [] },
          { id: 'water', name: 'Still Water', description: '500ml', pricePence: 130, statusTags: [] },
        ],
      },
      {
        id: 'hot',
        title: 'Hot Drinks',
        items: [
          { id: 'tea', name: 'Builder Tea', description: 'Large cup', pricePence: 190, statusTags: [] },
          { id: 'coffee', name: 'Filter Coffee', description: 'Fresh brew', pricePence: 210, statusTags: [] },
        ],
      },
    ],
    sidebarItems: [
      {
        id: 'promo-drink',
        kind: 'OFFER',
        headline: 'Meal Deal Upgrade',
        body: 'Add any drink for £1.20 with a main meal.',
      },
    ],
    mediaPlaylist: [
      {
        id: 'media-drink-1',
        type: 'IMAGE',
        url: '/screen-logo.png',
        durationSeconds: 10,
      },
    ],
  },
  desserts: {
    boardId: 'desserts',
    storeName: 'Seaside Fry House',
    layoutStyle: 'HALF_IMAGE',
    playbackMode: 'MENU_ONLY',
    menuHoldSeconds: 20,
    currencySymbol: 'GBP',
    accentProfile: 'ROSE',
    displayTintHex: '#000000',
    displayTintOpacity: 0,
    imageCornerStyle: 'ROUNDED',
    queueHeaderText: 'Queue Friendly Display',
    heroImageUrl: '/screen-logo.png',
    sidebarImageUrl: '/screen-logo.png',
    menuSections: [
      {
        id: 'desserts-core',
        title: 'Sweet Finish',
        items: [
          { id: 'jam-roly', name: 'Jam Roly-Poly', description: 'Custard included', pricePence: 450, statusTags: ['HOT_DEAL'] },
          { id: 'apple-pie', name: 'Apple Pie', description: 'Served warm', pricePence: 420, statusTags: ['CONTAINS_GLUTEN'] },
          { id: 'ice-cream', name: 'Vanilla Soft Serve', description: 'Flake optional', pricePence: 300, statusTags: [] },
        ],
      },
    ],
    sidebarItems: [
      {
        id: 'allergen-dessert',
        kind: 'ALLERGEN',
        headline: 'Allergens',
        body: 'Desserts may contain milk, eggs, gluten and nuts.',
      },
    ],
    mediaPlaylist: [
      {
        id: 'media-dessert-1',
        type: 'IMAGE',
        url: '/screen-logo.png',
        durationSeconds: 10,
      },
    ],
  },
}

export const defaultBoardId = 'chipshop-main'
