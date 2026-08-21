import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { Copy, Edit3, FolderOpen, Scissors, Trash2, UserPlus, X } from 'lucide-react'
import type { FolderItem } from '@/data/drive-data'
import { MobileBottomSheet } from '@/components/drive/MobileBottomSheet'

type Props = {
  x: number
  y: number
  folder: FolderItem | null
  onClose: () => void
  onCut: () => void
  onRename: () => void
  onInvite: () => void
  onCopyLink: () => void
  onDelete: () => void
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
  kbd,
  isMobile = false
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  danger?: boolean
  kbd?: string
  isMobile?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={[
        'group relative flex w-full items-center gap-3 rounded-2xl transition-all duration-150 overflow-hidden cursor-pointer select-none',
        isMobile ? 'px-4 py-3 text-sm font-bold min-h-[48px]' : 'px-3 py-2 text-[13px] font-semibold',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none flex shrink-0 items-center justify-center rounded-xl transition-all duration-150',
          isMobile ? 'h-8 w-8' : 'h-7 w-7',
          danger
            ? 'bg-red-50 text-red-500 group-hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400'
            : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm dark:bg-slate-800 dark:text-slate-400',
        ].join(' ')}
      >
        <Icon className={isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </span>
      <span className="pointer-events-none flex-1 text-left">{label}</span>
      {kbd && !isMobile && (
        <kbd className="pointer-events-none hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 group-hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 sm:inline">
          {kbd}
        </kbd>
      )}
    </button>
  )
}

export function FolderContextMenu({ x, y, folder, onClose, onCut, onRename, onInvite, onCopyLink, onDelete }: Props) {
  if (!folder) return null

  const menuRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: Math.max(12, Math.min(y, window.innerHeight - 300)),
    left: Math.max(12, Math.min(x, window.innerWidth - 236)),
  })

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useLayoutEffect(() => {
    if (!menuRef.current || isMobile) return
    const rect = menuRef.current.getBoundingClientRect()
    const menuWidth = rect.width || 224
    const menuHeight = rect.height || 280
    const padding = 12

    let nextX = x
    let nextY = y

    if (nextX + menuWidth > window.innerWidth - padding) {
      nextX = Math.max(padding, window.innerWidth - menuWidth - padding)
    }
    if (nextX < padding) nextX = padding

    if (nextY + menuHeight > window.innerHeight - padding) {
      if (y - menuHeight >= padding) {
        nextY = y - menuHeight
      } else {
        nextY = Math.max(padding, window.innerHeight - menuHeight - padding)
      }
    }
    if (nextY < padding) nextY = padding

    setPos({ left: nextX, top: nextY })
  }, [x, y, isMobile])

  // Mobile Bottom Sheet Presentation
  if (isMobile) {
    return (
      <MobileBottomSheet
        open={Boolean(folder)}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-500">
              <FolderOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">{folder.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Virtual Folder</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <div className="grid gap-1 py-1">
          <MenuItem icon={Copy} label="Copy folder link" onClick={() => { onCopyLink(); onClose() }} isMobile />
          <MenuItem icon={Scissors} label="Cut & move folder" onClick={() => { onCut(); onClose() }} isMobile />
          <MenuItem icon={Edit3} label="Rename folder" onClick={() => { onRename(); onClose() }} isMobile />
          <MenuItem icon={UserPlus} label="Invite collaborator" onClick={() => { onInvite(); onClose() }} isMobile />
          <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
          <MenuItem icon={Trash2} label="Delete folder" onClick={() => { onDelete(); onClose() }} danger isMobile />
        </div>
      </MobileBottomSheet>
    )
  }

  // Desktop Floating Context Menu
  return (
    <>
      <button
        className="fixed inset-0 z-40 cursor-default"
        aria-label="Close folder menu"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className="fixed z-50 w-56 max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/95 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        style={{ left: pos.left, top: pos.top }}
      >
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100">{folder.name}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Virtual folder</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-1.5">
          <MenuItem icon={Copy} label="Copy Link" onClick={onCopyLink} />
          <MenuItem icon={Scissors} label="Cut" onClick={onCut} kbd="⌘X" />
          <MenuItem icon={Edit3} label="Rename" onClick={onRename} />
          <MenuItem icon={UserPlus} label="Invite Member" onClick={onInvite} />
          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
          <MenuItem icon={Trash2} label="Delete Folder" onClick={onDelete} danger />
        </div>
      </div>
    </>
  )
}
