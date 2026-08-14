import { ArrowDown, ArrowUp, ArrowUpDown, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { FileItem, FolderItem } from '@/data/drive-data'

export type SortField = 'name' | 'folder' | 'date' | 'size'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  field: SortField
  direction: SortDirection
}

export function sortFilesList(items: FileItem[], field: SortField, direction: SortDirection): FileItem[] {
  return [...items].sort((a, b) => {
    let comparison = 0
    if (field === 'name') {
      comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    } else if (field === 'folder') {
      const folderA = a.folderName || ''
      const folderB = b.folderName || ''
      comparison = folderA.localeCompare(folderB, undefined, { numeric: true, sensitivity: 'base' })
    } else if (field === 'date') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      comparison = timeA - timeB
    } else if (field === 'size') {
      const sizeA = Number(a.sizeBytes || 0)
      const sizeB = Number(b.sizeBytes || 0)
      comparison = sizeA - sizeB
    }
    return direction === 'asc' ? comparison : -comparison
  })
}

export function sortFoldersList(items: FolderItem[], field: SortField, direction: SortDirection): FolderItem[] {
  return [...items].sort((a, b) => {
    let comparison = 0
    if (field === 'name') {
      comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    } else {
      comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    }
    return direction === 'asc' ? comparison : -comparison
  })
}

export const sortOptions: { label: string; field: SortField; direction: SortDirection }[] = [
  { label: 'Name (A to Z)', field: 'name', direction: 'asc' },
  { label: 'Name (Z to A)', field: 'name', direction: 'desc' },
  { label: 'Last Modified (Newest)', field: 'date', direction: 'desc' },
  { label: 'Last Modified (Oldest)', field: 'date', direction: 'asc' },
  { label: 'File Size (Largest)', field: 'size', direction: 'desc' },
  { label: 'File Size (Smallest)', field: 'size', direction: 'asc' },
  { label: 'Folder Name (A to Z)', field: 'folder', direction: 'asc' },
]

export function SortControl({
  sort,
  onSortChange,
  className
}: {
  sort: SortState
  onSortChange: (next: SortState) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const activeOption = sortOptions.find(
    (opt) => opt.field === sort.field && opt.direction === sort.direction
  ) ?? sortOptions[0]

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="h-10 gap-2 rounded-xl px-3 text-xs font-semibold shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        aria-label="Sort files"
        aria-expanded={open}
      >
        <ArrowUpDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline">Sort: </span>
        <span className="font-bold text-slate-900 dark:text-white">{activeOption.label}</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Sort Options
          </div>
          <div className="mt-1 space-y-0.5">
            {sortOptions.map((option) => {
              const isSelected = sort.field === option.field && sort.direction === option.direction
              return (
                <button
                  key={`${option.field}-${option.direction}`}
                  type="button"
                  onClick={() => {
                    onSortChange({ field: option.field, direction: option.direction })
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors',
                    isSelected
                      ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {option.direction === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span>{option.label}</span>
                  </span>
                  {isSelected ? <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : null}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
