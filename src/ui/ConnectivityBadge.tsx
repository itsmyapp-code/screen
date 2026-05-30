interface Props {
  online: boolean
}

export const ConnectivityBadge = ({ online }: Props) => {
  if (online) {
    return (
      <div className="absolute right-6 top-6 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold tracking-wide text-emerald-100 ring-1 ring-inset ring-emerald-200/70">
        ONLINE
      </div>
    )
  }

  return (
    <div className="absolute right-6 top-6 rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold tracking-wide text-red-100 ring-1 ring-inset ring-red-200/70">
      OFFLINE
    </div>
  )
}
