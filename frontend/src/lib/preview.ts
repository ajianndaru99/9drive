export type PreviewKind = 'image' | 'video' | 'document' | 'office' | 'audio' | 'text'

const officeMimeTypes = new Set([
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const googleDocumentMimeTypes = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
])

export function getPreviewKind(mimeType: string | undefined, fileName?: string): PreviewKind | null {
  const ext = fileName?.toLowerCase().split('.').pop() || ''

  if (mimeType) {
    if (mimeType.startsWith('image/') || mimeType === 'application/vnd.google-apps.drawing') return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType === 'application/pdf' || googleDocumentMimeTypes.has(mimeType)) return 'document'
    if (officeMimeTypes.has(mimeType)) return 'office'
    if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/javascript') return 'text'
  }

  // Fallback to extension check if mimeType is generic (e.g. application/octet-stream)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', '3gp', 'flv', 'wmv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'wma'].includes(ext)) return 'audio'
  if (ext === 'pdf') return 'document'
  if (['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'csv'].includes(ext)) return 'office'
  if (['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'sql', 'env', 'log', 'xml', 'yaml', 'yml'].includes(ext)) return 'text'

  return null
}

export function officeViewerUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
}

export function isSpreadsheetMimeType(mimeType: string | undefined) {
  return mimeType === 'application/vnd.google-apps.spreadsheet' || mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

