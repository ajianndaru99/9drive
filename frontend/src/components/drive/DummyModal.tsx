import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DummyModal({ open, title, description, children, onClose, className }: { open: boolean; title: string; description: string; children: ReactNode; onClose: () => void; className?: string }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
      <button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-default" aria-label="Close modal" onClick={onClose} />
      <div className={cn('relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-t-[28px] border border-slate-200/80 bg-white dark:bg-[#111827] dark:border-slate-800 p-6 shadow-2xl shadow-slate-950/30 sm:max-w-lg sm:rounded-[28px] animate-in zoom-in-95 duration-200', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Close modal" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}
