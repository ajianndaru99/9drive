import { FolderOpen, MoreVertical, Star } from 'lucide-react'
import { type MouseEvent, useState } from 'react'
import { AvatarStack } from '@/components/drive/AvatarStack'
import { FileIcon } from '@/components/drive/FileIcon'
import type { FileItem } from '@/data/drive-data'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

export function FileTable({
  files,
  mode = 'default',
  selectedFileIds = new Set<string>(),
  allSelected = false,
  onFileContextMenu,
  onToggleFile,
  onToggleAll
}: {
  files: FileItem[]
  mode?: 'default' | 'shared' | 'recent' | 'starred' | 'archived'
  selectedFileIds?: Set<string>
  allSelected?: boolean
  onFileContextMenu?: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  onToggleFile?: (file: FileItem) => void
  onToggleAll?: () => void
}) {
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null)

  return (
    <div className="mt-2 w-full">
      {/* Mobile card view */}
      <div className="grid gap-3 sm:hidden">
        {onToggleAll ? (
          <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
            <span>Select all files</span>
            <input type="checkbox" className="h-4 w-4 accent-blue-600 rounded" checked={allSelected} onChange={onToggleAll} />
          </label>
        ) : null}
        {files.map((file) => {
          const selected = selectedFileIds.has(file.id ?? '')
          const meta = mode === 'archived' ? file.location : mode === 'recent' ? file.openedDate : mode === 'starred' ? file.starredDate : file.date
          return (
            <article
              key={file.id ?? file.name}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', file.id ?? '')
                event.dataTransfer.effectAllowed = 'move'
              }}
              onClick={() => onToggleFile?.(file)}
              onContextMenu={(event) => onFileContextMenu?.(event, file)}
              className={cn(
                'overflow-hidden rounded-2xl border p-4 shadow-sm cursor-grab active:cursor-grabbing transition-all',
                selected
                  ? 'file-selected border-blue-500/40 bg-blue-500/5'
                  : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90'
              )}
            >
              <div className="flex items-center gap-3">
                {onToggleFile ? (
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-blue-600 rounded"
                    checked={selected}
                    onChange={() => onToggleFile?.(file)}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : null}
                <div className="shrink-0">
                  {mode === 'starred' ? <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> : <FileIcon kind={file.kind} />}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100" title={file.name}>
                    {file.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{meta}</span>
                    <span>·</span>
                    <span className="font-medium">{file.size}</span>
                    {file.folderName && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400 font-medium">
                          <FolderOpen className="h-3 w-3" />
                          {file.folderName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={(event) => {
                    event.stopPropagation()
                    onFileContextMenu?.(event, file)
                  }}
                  aria-label={`Open ${file.name} menu`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden overflow-x-auto sm:block rounded-xl">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="w-12 px-4 py-3.5">
                <input type="checkbox" className="h-4 w-4 accent-blue-600 rounded" checked={allSelected} onChange={onToggleAll} />
              </th>
              <th className="px-4 py-3.5 min-w-[220px]">Name</th>
              {mode === 'default' ? <th className="px-4 py-3.5 min-w-[140px]">Folder</th> : null}
              {mode === 'shared' ? <th className="px-4 py-3.5 min-w-[140px]">Owner</th> : null}
              {mode === 'recent' ? <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Last Opened</th> : null}
              {mode === 'starred' ? <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Starred On</th> : null}
              {mode === 'archived' ? <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Archived Date</th> : null}
              {mode === 'archived' ? (
                <th className="px-4 py-3.5 min-w-[160px]">Original Location</th>
              ) : (
                <th className="px-4 py-3.5 min-w-[160px] whitespace-nowrap">Last Modified</th>
              )}
              <th className="px-4 py-3.5 min-w-[100px] whitespace-nowrap">Size</th>
              <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">Access</th>
              <th className="px-4 py-3.5 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {files.map((file) => (
              <tr
                key={file.id ?? file.name}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', file.id ?? '')
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onContextMenu={(event) => onFileContextMenu?.(event, file)}
                onClick={() => onToggleFile?.(file)}
                className={cn(
                  'group transition-colors duration-150 cursor-grab active:cursor-grabbing text-[13px]',
                  selectedFileIds.has(file.id ?? '')
                    ? 'file-selected bg-blue-500/10 dark:bg-indigo-500/15'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                )}
              >
                {/* Checkbox */}
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600 rounded"
                    checked={selectedFileIds.has(file.id ?? '')}
                    onChange={() => onToggleFile?.(file)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </td>

                {/* File Name */}
                <td className="px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0">
                      {mode === 'starred' ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <FileIcon kind={file.kind} />}
                    </span>
                    <span className="truncate font-semibold text-slate-900 dark:text-slate-100 max-w-[220px] lg:max-w-[280px]" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                </td>

                {/* Folder column */}
                {mode === 'default' ? (
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                    {file.folderName ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                        <FolderOpen className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[130px]">{file.folderName}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </td>
                ) : null}

                {/* Specific metadata columns */}
                {mode === 'shared' ? <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{file.owner}</td> : null}
                {mode === 'recent' ? <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{file.openedDate}</td> : null}
                {mode === 'starred' ? <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{file.starredDate}</td> : null}
                {mode === 'archived' ? <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{file.archivedDate}</td> : null}

                {/* Date */}
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {mode === 'archived' ? file.location : file.date}
                </td>

                {/* Size */}
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                  {file.size}
                </td>

                {/* Access */}
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <AvatarStack count={file.shared} />
                    <span className="truncate max-w-[120px]">{file.access}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Hover action buttons */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1.5">
                      <button
                        title="Copy Link"
                        onClick={async (event) => {
                          event.stopPropagation()
                          try {
                            const data = await apiFetch<{ url: string | null }>(`/files/${file.id}/view-url`)
                            if (data.url) {
                              await navigator.clipboard.writeText(data.url)
                              setCopiedFileId(file.id ?? null)
                              setTimeout(() => setCopiedFileId(null), 2000)
                            } else {
                              const shareData = await apiFetch<{ url: string }>(`/files/${file.id}/share`, { method: 'POST' })
                              await navigator.clipboard.writeText(shareData.url)
                              setCopiedFileId(file.id ?? null)
                              setTimeout(() => setCopiedFileId(null), 2000)
                            }
                          } catch { /* ignore */ }
                        }}
                        className={cn(
                          'inline-flex h-7 px-2.5 items-center justify-center rounded-lg text-[11px] font-bold transition-all',
                          copiedFileId === file.id
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : 'text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/60'
                        )}
                      >
                        {copiedFileId === file.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button
                        title="Move File"
                        onClick={(event) => {
                          event.stopPropagation()
                          window.dispatchEvent(new CustomEvent('9drive:open-move-modal', { detail: file }))
                        }}
                        className="inline-flex h-7 px-2.5 items-center justify-center rounded-lg text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                      >
                        Move
                      </button>
                    </div>

                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
                      onClick={(event) => {
                        event.stopPropagation()
                        onFileContextMenu?.(event, file)
                      }}
                      aria-label={`Open ${file.name} menu`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
