import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function MobileBottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  className
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet Modal Container */}
      <div
        className={cn(
          'relative z-50 max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] border-t border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111827] p-4 shadow-2xl pb-[max(env(safe-area-inset-bottom),1.5rem)] animate-in slide-in-from-bottom duration-250 ease-out',
          className
        )}
      >
        {/* M3 Drag Handle */}
        <div className="mx-auto mb-3.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />

        {(title || subtitle) && (
          <div className="mb-3 px-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            {typeof title === 'string' ? (
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        )}

        <div className="space-y-1">{children}</div>
      </div>
    </div>
  )
}
