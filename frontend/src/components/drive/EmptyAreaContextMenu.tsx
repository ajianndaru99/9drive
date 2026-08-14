import { useLayoutEffect, useRef, useState } from 'react'
import { ClipboardPaste, FolderPlus, Upload } from 'lucide-react'

type Props = {
  x: number
  y: number
  open: boolean
  canPasteFolder?: boolean
  onClose: () => void
  onUpload: () => void
  onCreateFolder: () => void
  onPasteFolder?: () => void
}

function MenuItem({ icon: Icon, label, onClick, accent = false }: { icon: React.ElementType; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-150',
        accent
          ? 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70',
      ].join(' ')}
    >
      <span className={[
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
        accent
          ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-100 dark:bg-blue-950/30'
          : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm dark:bg-slate-800 dark:text-slate-400',
      ].join(' ')}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  )
}

export function EmptyAreaContextMenu({ x, y, open, canPasteFolder = false, onClose, onUpload, onCreateFolder, onPasteFolder }: Props) {
  if (!open) return null

  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: Math.max(12, Math.min(y, window.innerHeight - 160)),
    left: Math.max(12, Math.min(x, window.innerWidth - 220)),
  })

  useLayoutEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const menuWidth = rect.width || 208
    const menuHeight = rect.height || 140
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
  }, [x, y])

  return (
    <>
      <button
        className="fixed inset-0 z-40 cursor-default"
        aria-label="Close empty area menu"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className="fixed z-50 w-52 max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/95 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        style={
          window.innerWidth >= 640
            ? { left: pos.left, top: pos.top }
            : { insetInline: '0.75rem', bottom: '0.75rem', position: 'fixed', maxHeight: 'calc(100vh - 1.5rem)' }
        }
      >
        <div className="p-1.5">
          <MenuItem icon={Upload} label="Upload File" onClick={onUpload} accent />
          <MenuItem icon={FolderPlus} label="New Folder" onClick={onCreateFolder} />
          {canPasteFolder && onPasteFolder ? (
            <>
              <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
              <MenuItem icon={ClipboardPaste} label="Paste Folder Here" onClick={onPasteFolder} />
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
