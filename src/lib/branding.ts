import type { AccentProfile, SignageBoardConfig } from '../types/signage'
import { passesWcagAA } from './contrast'

interface AccentClasses {
  sidebar: string
  sidebarHeadline: string
  strapline: string
  sectionTitleSm: string
  sectionTitleLg: string
  spotlight: string
  spotlightHeadline: string
}

const ACCENT_CLASS_MAP: Record<AccentProfile, AccentClasses> = {
  AMBER: {
    sidebar: 'flex h-full w-1/3 flex-col justify-between border-l-2 border-amber-400 bg-amber-500/15 px-8 py-8',
    sidebarHeadline: 'text-5xl font-black leading-tight text-amber-300',
    strapline: 'mt-1 text-2xl font-bold tracking-[0.1em] text-amber-300',
    sectionTitleSm: 'border-b border-amber-400 pb-2 text-2xl font-black uppercase tracking-wide text-amber-300',
    sectionTitleLg: 'mb-3 border-b border-amber-400 pb-2 text-3xl font-black uppercase tracking-wide text-amber-300',
    spotlight: 'mt-8 rounded-2xl border border-amber-400 bg-amber-500/15 p-5',
    spotlightHeadline: 'mt-2 text-4xl font-black text-amber-300',
  },
  CYAN: {
    sidebar: 'flex h-full w-1/3 flex-col justify-between border-l-2 border-cyan-400 bg-cyan-500/15 px-8 py-8',
    sidebarHeadline: 'text-5xl font-black leading-tight text-cyan-300',
    strapline: 'mt-1 text-2xl font-bold tracking-[0.1em] text-cyan-300',
    sectionTitleSm: 'border-b border-cyan-400 pb-2 text-2xl font-black uppercase tracking-wide text-cyan-300',
    sectionTitleLg: 'mb-3 border-b border-cyan-400 pb-2 text-3xl font-black uppercase tracking-wide text-cyan-300',
    spotlight: 'mt-8 rounded-2xl border border-cyan-400 bg-cyan-500/15 p-5',
    spotlightHeadline: 'mt-2 text-4xl font-black text-cyan-300',
  },
  LIME: {
    sidebar: 'flex h-full w-1/3 flex-col justify-between border-l-2 border-lime-400 bg-lime-500/15 px-8 py-8',
    sidebarHeadline: 'text-5xl font-black leading-tight text-lime-300',
    strapline: 'mt-1 text-2xl font-bold tracking-[0.1em] text-lime-300',
    sectionTitleSm: 'border-b border-lime-400 pb-2 text-2xl font-black uppercase tracking-wide text-lime-300',
    sectionTitleLg: 'mb-3 border-b border-lime-400 pb-2 text-3xl font-black uppercase tracking-wide text-lime-300',
    spotlight: 'mt-8 rounded-2xl border border-lime-400 bg-lime-500/15 p-5',
    spotlightHeadline: 'mt-2 text-4xl font-black text-lime-300',
  },
  ROSE: {
    sidebar: 'flex h-full w-1/3 flex-col justify-between border-l-2 border-rose-400 bg-rose-500/15 px-8 py-8',
    sidebarHeadline: 'text-5xl font-black leading-tight text-rose-300',
    strapline: 'mt-1 text-2xl font-bold tracking-[0.1em] text-rose-300',
    sectionTitleSm: 'border-b border-rose-400 pb-2 text-2xl font-black uppercase tracking-wide text-rose-300',
    sectionTitleLg: 'mb-3 border-b border-rose-400 pb-2 text-3xl font-black uppercase tracking-wide text-rose-300',
    spotlight: 'mt-8 rounded-2xl border border-rose-400 bg-rose-500/15 p-5',
    spotlightHeadline: 'mt-2 text-4xl font-black text-rose-300',
  },
}

const FALLBACK_PROFILE: AccentProfile = 'AMBER'

export const resolveAccentProfile = (board: SignageBoardConfig): AccentProfile => {
  if (!board.customBrandHex) {
    return board.accentProfile
  }

  const safeForDark = passesWcagAA(board.customBrandHex, '#0a0a0a')
  return safeForDark ? board.accentProfile : FALLBACK_PROFILE
}

export const getAccentClasses = (board: SignageBoardConfig): AccentClasses => {
  return ACCENT_CLASS_MAP[resolveAccentProfile(board)]
}
