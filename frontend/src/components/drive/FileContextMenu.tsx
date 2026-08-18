import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { Copy, Download, Edit3, Eye, FolderInput, Info, Link2, Trash2, UserPlus, Star, Archive, ArrowRightLeft, X } from 'lucide-react'
import type { FileItem } from '@/data/drive-data'
import { MobileBottomSheet } from '@/components/drive/MobileBottomSheet'

type Props = {
  x: number
  y: number
  file: FileItem | null
  onClose: () => void
  onView: () => void
  onDownload: () => void
  onRename: () => void
  onMove: () => void
  onDetails: () => void
  onShare: () => void
  onCopyLink: () => void
  onInvite: () => void
  onDelete: () => void
  onStar?: () => void
  onArchive?: () => void
  onTransferStorage?: () => void
}

const kindColors: Record<string, string> = {
  image: 'bg-emerald-500',
  video: 'bg-violet-500',
  pdf: 'bg-red-500',
  doc: 'bg-blue-500',
}

const kindLabels: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  pdf: 'PDF',
  doc: 'Document',
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
      onClick={onClick}
      className={[
        'group relative flex w-full items-center gap-3 rounded-2xl transition-all duration-150 overflow-hidden cursor-pointer',
        isMobile ? 'px-4 py-3 text-sm font-bold min-h-[48px]' : 'px-3 py-2 text-[13px] font-semibold',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70',
      ].join(' ')}
    >
      <md-ripple />
      <span
        className={[
          'flex shrink-0 items-center justify-center rounded-xl transition-all duration-150',
          isMobile ? 'h-8 w-8' : 'h-7 w-7',
          danger
            ? 'bg-red-50 text-red-500 group-hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400'
            : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm dark:bg-slate-800 dark:text-slate-400',
        ].join(' ')}
      >
        <Icon className={isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </span>
      <span className="flex-1 text-left">{label}</span>
      {kbd && !isMobile && (
        <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 group-hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 sm:inline">
          {kbd}
        </kbd>
      )}
    </button>
  )
}

export function FileContextMenu({
  x,
  y,
  file,
  onClose,
  onView,
  onDownload,
  onRename,
  onMove,
  onDetails,
  onShare,
  onCopyLink,
  onInvite,
  onDelete,
  onStar,
  onArchive,
  onTransferStorage
}: Props) {
  if (!file) return null

  const menuRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: Math.max(12, Math.min(y, window.innerHeight - 520)),
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
    const menuHeight = rect.height || 500
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

  const kindColor = kindColors[file.kind] ?? 'bg-slate-500'
  const kindLabel = kindLabels[file.kind] ?? 'File'

  // Mobile Bottom Sheet Presentation
  if (isMobile) {
    return (
      <MobileBottomSheet
        open={Boolean(file)}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${kindColor}`}>
              {kindLabel.slice(0, 3).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">{file.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{file.size} · {file.folderName || 'All Files'}</p>
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
          <MenuItem icon={Eye} label="Preview file" onClick={() => { onView(); onClose() }} isMobile />
          <MenuItem icon={Download} label="Download" onClick={() => { onDownload(); onClose() }} isMobile />
          {onStar && <MenuItem icon={Star} label={file.isStarred ? 'Unstar file' : 'Add to Starred'} onClick={() => { onStar(); onClose() }} isMobile />}
          <MenuItem icon={Link2} label="Share link" onClick={() => { onShare(); onClose() }} isMobile />
          <MenuItem icon={Copy} label="Copy link" onClick={() => { onCopyLink(); onClose() }} isMobile />
          <MenuItem icon={UserPlus} label="Invite member" onClick={() => { onInvite(); onClose() }} isMobile />
          <MenuItem icon={Edit3} label="Rename file" onClick={() => { onRename(); onClose() }} isMobile />
          <MenuItem icon={FolderInput} label="Move to folder" onClick={() => { onMove(); onClose() }} isMobile />
          {onTransferStorage && <MenuItem icon={ArrowRightLeft} label="Transfer Drive Account" onClick={() => { onTransferStorage(); onClose() }} isMobile />}
          {onArchive && <MenuItem icon={Archive} label={file.isArchived ? 'Unarchive' : 'Archive file'} onClick={() => { onArchive(); onClose() }} isMobile />}
          <MenuItem icon={Info} label="File details" onClick={() => { onDetails(); onClose() }} isMobile />
          <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
          <MenuItem icon={Trash2} label="Delete file" onClick={() => { onDelete(); onClose() }} danger isMobile />
        </div>
      </MobileBottomSheet>
    )
  }

  // Desktop Floating Context Menu
  return (
    <>
      <button
        className="fixed inset-0 z-40 cursor-default"
        aria-label="Close file menu"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className="fixed z-50 w-56 max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/95 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        style={{ left: pos.left, top: pos.top }}
      >
        {/* Header: file name + kind badge + folder path */}
        <div className="border-b border-slate-100 bg-slate-50/80 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-start gap-2.5">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white ${kindColor}`}>
              {kindLabel.slice(0, 3).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100">{file.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {file.size}
                </span>
                {file.folderName && (
                  <span className="flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    <FolderInput className="h-2.5 w-2.5" />
                    {file.folderName}
                  </span>
                )}
                {!file.folderName && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    / All Files
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-1.5">
          <MenuItem icon={Eye} label="Preview" onClick={onView} kbd="↵" />
          <MenuItem icon={Download} label="Download" onClick={onDownload} />
          {onStar && <MenuItem icon={Star} label={file.isStarred ? 'Unstar' : 'Add to Starred'} onClick={onStar} />}
          <MenuItem icon={Edit3} label="Rename" onClick={onRename} />
          <MenuItem icon={FolderInput} label="Move to Folder" onClick={onMove} />
          {onTransferStorage && <MenuItem icon={ArrowRightLeft} label="Transfer Drive Account" onClick={onTransferStorage} />}
          {onArchive && <MenuItem icon={Archive} label={file.isArchived ? 'Unarchive' : 'Archive'} onClick={onArchive} />}
          <MenuItem icon={Info} label="Details" onClick={onDetails} />

          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

          <MenuItem icon={Link2} label="Share Link" onClick={onShare} />
          <MenuItem icon={Copy} label="Copy Link" onClick={onCopyLink} kbd="Ctrl+L" />
          <MenuItem icon={UserPlus} label="Invite Member" onClick={onInvite} />

          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

          <MenuItem icon={Trash2} label="Delete" onClick={onDelete} danger />
        </div>
      </div>
    </>
  )
}
