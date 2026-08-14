import { useEffect, useState } from 'react'
import { FileText, Folder, Star, FolderOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FileTable } from '@/components/drive/FileTable'
import { MetricCard } from '@/components/drive/MetricCard'
import { PageHeader } from '@/components/drive/PageHeader'
import { Button } from '@/components/ui/button'
import { DummyModal } from '@/components/drive/DummyModal'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import type { FileItem, FolderItem } from '@/data/drive-data'

type BackendFile = { id: string; name: string; mimeType: string; sizeBytes: string; createdAt: string; updatedAt: string; isStarred?: boolean; folderId?: string | null; folder?: { id: string; name: string } | null; connectedAccount?: { email: string; provider: string } }
type BackendFolder = { id: string; name: string; color: string; iconUrl?: string | null; updatedAt: string }

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
    starredDate: formatDate(file.updatedAt),
    size: formatBytes(file.sizeBytes),
    access: file.connectedAccount?.email ?? 'Only You',
    kind: mimeToKind(file.mimeType),
    shared: 1,
    folderId: file.folderId,
    folderName: file.folder?.name,
    isStarred: true
  }
}

export function StarredPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [message, setMessage] = useState('')

  async function loadStarred() {
    setLoading(true)
    try {
      const [fileData, folderData] = await Promise.all([
        apiFetch<{ files: BackendFile[] }>('/files/starred'),
        apiFetch<{ folders: BackendFolder[] }>('/folders/starred')
      ])
      setFiles(fileData.files.map(mapFile))
      setFolders(folderData.folders.map((f) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        iconUrl: f.iconUrl,
        updated: `Starred ${formatDate(f.updatedAt)}`
      })))
    } catch (err: any) {
      setMessage(err.message || 'Failed to load starred items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStarred()
  }, [])

  async function unstarFile(file: FileItem) {
    if (!file.id) return
    try {
      await apiFetch(`/files/${file.id}/star`, { method: 'PATCH' })
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      setMessage(`Removed "${file.name}" from starred items.`)
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(err.message || 'Failed to update star')
    }
  }

  async function openPreview(file: FileItem) {
    if (!file.id) return
    setActiveFile(file)
    try {
      const data = await apiFetch<{ path: string }>(`/files/${file.id}/preview-token`, { method: 'POST' })
      setPreviewUrl(data.path)
      setPreviewOpen(true)
    } catch (err: any) {
      setMessage(err.message || 'Failed to load preview')
    }
  }

  return (
    <>
      <PageHeader title="Starred" description="Pinned files and folders for fast, instant access." />

      {message ? <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Starred Files" value={String(files.length)} icon={Star} />
        <MetricCard label="Starred Folders" value={String(folders.length)} icon={Folder} />
        <MetricCard label="Total Starred Size" value={formatBytes(files.reduce((acc, f) => acc + BigInt(f.sizeBytes ?? '0'), 0n))} icon={FileText} />
      </div>

      {folders.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Starred Folders</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {folders.map((folder) => (
              <a
                key={folder.id}
                href={`/all-files?folderId=${folder.id}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-slate-900">{folder.name}</h3>
                  <p className="text-xs text-slate-400">{folder.updated}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Starred Files</h2>
        {files.length === 0 && !loading ? (
          <Card className="mt-3 p-8 text-center bg-slate-50 border border-dashed border-slate-200">
            <Star className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-700">No starred files yet</p>
            <p className="text-xs text-slate-500">Right click or tap the star icon on any file in All Files to pin it here.</p>
          </Card>
        ) : (
          <FileTable
            files={files}
            mode="starred"
            onFileContextMenu={(_e, file) => openPreview(file)}
          />
        )}
      </div>

      {/* Preview modal */}
      <DummyModal open={previewOpen} title={activeFile?.name ?? 'Preview'} description="Starred file preview" onClose={() => setPreviewOpen(false)}>
        <div className="grid gap-4">
          {previewUrl && activeFile?.kind === 'image' && (
            <img src={previewUrl} alt={activeFile.name} className="max-h-[60vh] w-full rounded-xl object-contain bg-slate-950" />
          )}
          {previewUrl && activeFile?.kind === 'video' && (
            <video src={previewUrl} controls autoPlay className="max-h-[60vh] w-full rounded-xl bg-black" />
          )}
          {previewUrl && activeFile?.kind === 'pdf' && (
            <iframe src={previewUrl} className="h-[60vh] w-full rounded-xl border border-slate-200" title={activeFile.name} />
          )}
          <div className="flex justify-between items-center pt-2">
            {activeFile && (
              <Button variant="outline" size="sm" onClick={() => unstarFile(activeFile)}>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" /> Unstar
              </Button>
            )}
            <Button size="sm" onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </div>
      </DummyModal>
    </>
  )
}
