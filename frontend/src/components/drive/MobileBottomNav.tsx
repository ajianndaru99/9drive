import { NavLink, useLocation } from 'react-router-dom'
import { FileArchive, Clock, Star, Share2, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { label: 'Files', icon: FileArchive, href: '/all-files' },
  { label: 'Recent', icon: Clock, href: '/recent' },
  { label: 'Starred', icon: Star, href: '/starred' },
  { label: 'Shared', icon: Share2, href: '/shared' },
  { label: 'Storage', icon: Gauge, href: '/quota' },
]

export function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 block lg:hidden border-t border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.4)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-colors duration-200">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href === '/all-files' && location.pathname === '/')
          const Icon = item.icon

          return (
            <NavLink
              key={item.label}
              to={item.href}
              className="group relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-all cursor-pointer"
            >
              {/* Material 3 Active Indicator Pill */}
              <div
                className={cn(
                  'relative flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 overflow-hidden',
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60 group-active:scale-95'
                )}
              >
                <md-ripple />
                <Icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
              </div>
              <span
                className={cn(
                  'mt-1 text-[11px] font-bold tracking-tight transition-colors duration-150',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
