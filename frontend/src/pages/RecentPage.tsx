import { useEffect, useState } from 'react'
import { Clock, Eye, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FileTable } from '@/components/drive/FileTable'
import { MetricCard } from '@/components/drive/MetricCard'
import { PageHeader } from '@/components/drive/PageHeader'
import { DummyModal } from '@/components/drive/DummyModal'
import { Button } from '@/components/ui/button'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import type { FileItem } from '@/data/drive-data'

type BackendFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  createdAt: string
  lastOpenedAt?: string | null
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
    openedDate: file.lastOpenedAt ? formatDate(file.lastOpenedAt) : formatDate(file.createdAt),
    size: formatBytes(file.sizeBytes),
    access: file.connectedAccount?.email ?? 'Only You',
    kind: mimeToKind(file.mimeType),
    shared: 1,
    folderId: file.folderId,
    folderName: file.folder?.name
  }
}

export function RecentPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  async function loadRecent() {
    setLoading(true)
    try {
      const data = await apiFetch<{ files: BackendFile[] }>('/files/recent')
      setFiles(data.files.map(mapFile))
    } catch (err) {
      console.error('Failed to load recent files', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecent()
  }, [])

  async function openPreview(file: FileItem) {
    if (!file.id) return
    setActiveFile(file)
    try {
      const data = await apiFetch<{ path: string }>(`/files/${file.id}/preview-token`, { method: 'POST' })
      setPreviewUrl(data.path)
      setPreviewOpen(true)
    } catch (err) {
      console.error('Failed to load preview', err)
    }
  }

  const todayCount = files.filter((f) => {
    if (!f.createdAt) return false
    const date = new Date(f.createdAt)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }).length

  return (
    <>
      <PageHeader title="Recent" description="Latest accessed, uploaded, and modified files in your workspace." />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Recent Files" value={String(files.length)} icon={Clock} />
        <MetricCard label="Added / Opened Today" value={String(todayCount)} icon={Eye} />
        <MetricCard label="Total Recent Size" value={formatBytes(files.reduce((acc, f) => acc + BigInt(f.sizeBytes ?? '0'), 0n))} icon={FileText} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Recent Files</h2>
        {files.length === 0 && !loading ? (
          <Card className="mt-3 p-8 text-center bg-slate-50 border border-dashed border-slate-200">
            <Clock className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-700">No recent activity yet</p>
            <p className="text-xs text-slate-500">Files you open, upload, or preview will appear here automatically.</p>
          </Card>
        ) : (
          <FileTable
            files={files}
            mode="recent"
            onFileContextMenu={(_e, file) => openPreview(file)}
          />
        )}
      </div>

      {/* Preview modal */}
      <DummyModal open={previewOpen} title={activeFile?.name ?? 'Preview'} description="Recent file preview" onClose={() => setPreviewOpen(false)}>
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
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </div>
      </DummyModal>
    </>
  )
}
