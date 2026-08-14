import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/90 shadow-sm transition-colors duration-200', className)} {...props} />
}
