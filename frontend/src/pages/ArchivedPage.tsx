import { useEffect, useMemo, useState } from 'react'
import { Archive, RotateCcw, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileTable } from '@/components/drive/FileTable'
import { MetricCard } from '@/components/drive/MetricCard'
import { PageHeader } from '@/components/drive/PageHeader'
import { SortControl, type SortField, type SortState, sortFilesList } from '@/components/drive/SortControl'
import { DummyModal } from '@/components/drive/DummyModal'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import type { FileItem } from '@/data/drive-data'

type BackendFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  createdAt: string
  updatedAt: string
  folderId?: string | null
  folder?: { id: string; name: string } | null
  connectedAccount?: { email: string; provider: string }
}

function mimeToKind(mimeType: string): FileItem['kind'] {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'doc'
}

function mapFile(file: BackendFile): FileItem {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    createdAt: file.createdAt,
    date: formatDate(file.createdAt),
    archivedDate: formatDate(file.updatedAt),
    location: file.folder?.name ?? 'All Files',
    size: formatBytes(file.sizeBytes),
    access: file.connectedAccount?.email ?? 'Only You',
    kind: mimeToKind(file.mimeType),
    shared: 1,
    folderId: file.folderId,
    folderName: file.folder?.name
  }
}

export function ArchivedPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sortState, setSortState] = useState<SortState>({ field: 'date', direction: 'desc' })

  function handleHeaderSort(field: SortField) {
    setSortState((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sortedFiles = useMemo(() => {
    return sortFilesList(files, sortState.field, sortState.direction)
  }, [files, sortState])

  async function loadArchived() {
    setLoading(true)
    try {
      const data = await apiFetch<{ files: BackendFile[] }>('/files/archived')
      setFiles(data.files.map(mapFile))
    } catch (err) {
      console.error('Failed to load archived files', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArchived()
  }, [])

  function toggleFileSelection(file: FileItem) {
    if (!file.id) return
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(file.id!)) {
        next.delete(file.id!)
      } else {
        next.add(file.id!)
      }
      return next
    })
  }

  function toggleAllVisible() {
    if (selectedFileIds.size === files.length) {
      setSelectedFileIds(new Set())
    } else {
      setSelectedFileIds(new Set(files.map((f) => f.id!).filter(Boolean)))
    }
  }

  async function unarchiveSelected() {
    if (selectedFileIds.size === 0) return
    const ids = Array.from(selectedFileIds)
    try {
      await Promise.all(
        ids.map((id) => apiFetch(`/files/${id}/archive`, { method: 'PATCH' }))
      )
      setMessage(`Restored ${ids.length} item(s) to active files.`)
      setSelectedFileIds(new Set())
      loadArchived()
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(err.message || 'Failed to restore files')
    }
  }

  async function deleteSelected() {
    if (selectedFileIds.size === 0) return
    const ids = Array.from(selectedFileIds)
    try {
      await apiFetch('/files/batch', {
        method: 'DELETE',
        body: JSON.stringify({ fileIds: ids })
      })
      setMessage(`Moved ${ids.length} item(s) to Recycle Bin.`)
      setSelectedFileIds(new Set())
      setDeleteConfirmOpen(false)
      loadArchived()
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(err.message || 'Failed to delete files')
    }
  }

  const allSelected = files.length > 0 && selectedFileIds.size === files.length

  return (
    <>
      <PageHeader
        title="Archived Files"
        description="Safely stored files removed from the main workspace. Recover them anytime."
        actions={
          selectedFileIds.size > 0 ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={unarchiveSelected}>
                <RotateCcw className="h-4 w-4" />
                Unarchive ({selectedFileIds.size})
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete ({selectedFileIds.size})
              </Button>
            </div>
          ) : undefined
        }
      />

      {message ? <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Archived Items" value={String(files.length)} icon={Archive} />
        <MetricCard label="Recoverable Items" value={String(files.length)} icon={RotateCcw} />
        <MetricCard label="Storage in Archive" value={formatBytes(files.reduce((acc, f) => acc + BigInt(f.sizeBytes ?? '0'), 0n))} icon={FileText} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Archived Files</h2>
          <SortControl sort={sortState} onSortChange={setSortState} />
        </div>
        {files.length === 0 && !loading ? (
          <Card className="mt-3 p-8 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
            <Archive className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">No archived files</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Archive old files to keep your main workspace tidy without deleting them.</p>
          </Card>
        ) : (
          <FileTable
            files={sortedFiles}
            mode="archived"
            selectedFileIds={selectedFileIds}
            allSelected={allSelected}
            sortField={sortState.field}
            sortDirection={sortState.direction}
            onSort={handleHeaderSort}
            onToggleFile={toggleFileSelection}
            onToggleAll={toggleAllVisible}
          />
        )}
      </div>

      <DummyModal open={deleteConfirmOpen} title="Move to Trash" description={`Move ${selectedFileIds.size} archived item(s) to Recycle Bin?`} onClose={() => setDeleteConfirmOpen(false)}>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={deleteSelected}>Move to Trash</Button>
        </div>
      </DummyModal>
    </>
  )
}
