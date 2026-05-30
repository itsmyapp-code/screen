import type { StatusTag } from '../types/signage'

interface Props {
  tag: StatusTag
}

const TAG_CLASSES: Record<StatusTag, string> = {
  SOLD_OUT:
    'inline-flex items-center rounded-md bg-red-500/20 px-2 py-1 text-xs font-bold tracking-wide text-red-200 ring-1 ring-inset ring-red-200/70',
  HOT_DEAL:
    'inline-flex items-center rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-bold tracking-wide text-emerald-200 ring-1 ring-inset ring-emerald-200/70',
  CONTAINS_GLUTEN:
    'inline-flex items-center rounded-md bg-yellow-500/20 px-2 py-1 text-xs font-bold tracking-wide text-yellow-100 ring-1 ring-inset ring-yellow-100/70',
  CONTAINS_FISH:
    'inline-flex items-center rounded-md bg-sky-500/20 px-2 py-1 text-xs font-bold tracking-wide text-sky-100 ring-1 ring-inset ring-sky-100/70',
}

const TAG_LABELS: Record<StatusTag, string> = {
  SOLD_OUT: 'SOLD OUT',
  HOT_DEAL: 'HOT DEAL',
  CONTAINS_GLUTEN: 'CONTAINS GLUTEN',
  CONTAINS_FISH: 'CONTAINS FISH',
}

export const StatusTagBadge = ({ tag }: Props) => {
  return <span className={TAG_CLASSES[tag]}>{TAG_LABELS[tag]}</span>
}
