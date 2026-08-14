import { useMemo } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  name?: string | null
  email?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showOnlineBadge?: boolean
  className?: string
}

const sizeConfig = {
  xs: {
    container: 'h-6 w-6 rounded-lg text-[10px]',
    badge: 'h-2 w-2 -bottom-0.5 -right-0.5 border',
  },
  sm: {
    container: 'h-8 w-8 rounded-xl text-xs',
    badge: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5 border-1.5',
  },
  md: {
    container: 'h-10 w-10 rounded-xl text-sm',
    badge: 'h-3 w-3 -bottom-0.5 -right-0.5 border-2',
  },
  lg: {
    container: 'h-12 w-12 rounded-2xl text-base',
    badge: 'h-3.5 w-3.5 -bottom-1 -right-1 border-2',
  },
  xl: {
    container: 'h-14 w-14 rounded-2xl text-lg sm:h-16 sm:w-16 sm:text-xl',
    badge: 'h-4 w-4 -bottom-1 -right-1 border-2',
  },
}

const gradientPalettes = [
  'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-indigo-500/25',
  'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-purple-500/25',
  'bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-rose-500 shadow-fuchsia-500/25',
  'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 shadow-teal-500/25',
  'bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-700 shadow-blue-500/25',
  'bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 shadow-orange-500/25',
]

function getInitials(name?: string | null, email?: string | null): string {
  const cleanName = name?.trim()
  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return cleanName.slice(0, 2).toUpperCase()
  }

  const cleanEmail = email?.trim()
  if (cleanEmail) {
    const username = cleanEmail.split('@')[0]
    return username.slice(0, 2).toUpperCase()
  }

  return '9D'
}

function getGradientIndex(str?: string | null): number {
  if (!str) return 0
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % gradientPalettes.length
}

export function UserInitialsAvatar({
  name,
  email,
  size = 'md',
  showOnlineBadge = true,
  className,
}: Props) {
  const cfg = sizeConfig[size]
  const initials = useMemo(() => getInitials(name, email), [name, email])
  const gradient = useMemo(() => gradientPalettes[getGradientIndex(name || email)], [name, email])

  return (
    <div className="relative inline-flex shrink-0 select-none">
      <div
        className={cn(
          'flex items-center justify-center font-black tracking-wider text-white shadow-md transition-transform duration-200 hover:scale-105',
          'border border-white/20 dark:border-white/15',
          gradient,
          cfg.container,
          className
        )}
      >
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{initials}</span>
      </div>

      {showOnlineBadge && (
        <span
          className={cn(
            'absolute rounded-full border-white bg-emerald-500 shadow-sm dark:border-slate-900',
            cfg.badge
          )}
          title="Online"
        />
      )}
    </div>
  )
}
