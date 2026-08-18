import { Readable } from 'node:stream'
import type { Response } from 'express'
import type { ConnectedAccount, File } from '@prisma/client'
import { getAuthedGoogleClient } from '../google/google.service.js'

type FileWithAccount = File & { connectedAccount: ConnectedAccount }
type StreamOptions = { disposition?: 'inline' | 'attachment' }

export const googleDownloadExportMimeTypes: Record<string, { mimeType: string; extension: string }> = {
  'application/vnd.google-apps.document': { mimeType: 'application/pdf', extension: '.pdf' },
  'application/vnd.google-apps.spreadsheet': { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: '.xlsx' },
  'application/vnd.google-apps.presentation': { mimeType: 'application/pdf', extension: '.pdf' },
  'application/vnd.google-apps.drawing': { mimeType: 'image/png', extension: '.png' },
}

const googlePreviewExportMimeTypes: Record<string, { mimeType: string; extension: string }> = {
  ...googleDownloadExportMimeTypes,
  'application/vnd.google-apps.spreadsheet': { mimeType: 'application/pdf', extension: '.pdf' },
}

function contentDisposition(type: 'inline' | 'attachment', fileName: string) {
  return `${type}; filename="${fileName.replaceAll('"', '')}"`
}

export function withExtension(fileName: string, extension: string) {
  return fileName.toLowerCase().endsWith(extension) ? fileName : `${fileName}${extension}`
}

export function normalizeHeaders(headers: Headers | Record<string, string>) {
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  return headers
}

export async function streamGoogleFile(file: FileWithAccount, range: string | undefined, res: Response, options: StreamOptions = {}) {
  const auth = await getAuthedGoogleClient(file.connectedAccount)
  const headers = normalizeHeaders(await auth.getRequestHeaders())
  const exportTarget = (options.disposition === 'inline' ? googlePreviewExportMimeTypes : googleDownloadExportMimeTypes)[file.mimeType]

  // Resolve accurate MIME type
  let responseMimeType = exportTarget?.mimeType ?? file.mimeType
  if (!responseMimeType || responseMimeType === 'application/octet-stream') {
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'pdf') responseMimeType = 'application/pdf'
    else if (ext === 'mov') responseMimeType = 'video/quicktime'
    else if (ext === 'mp4') responseMimeType = 'video/mp4'
    else if (ext === 'webm') responseMimeType = 'video/webm'
    else if (ext === 'mkv') responseMimeType = 'video/x-matroska'
    else if (ext === 'jpg' || ext === 'jpeg') responseMimeType = 'image/jpeg'
    else if (ext === 'png') responseMimeType = 'image/png'
    else if (ext === 'gif') responseMimeType = 'image/gif'
    else if (ext === 'webp') responseMimeType = 'image/webp'
    else if (ext === 'svg') responseMimeType = 'image/svg+xml'
    else if (ext === 'mp3') responseMimeType = 'audio/mpeg'
    else if (ext === 'wav') responseMimeType = 'audio/wav'
  }

  const responseFileName = exportTarget ? withExtension(file.name, exportTarget.extension) : file.name
  const url = exportTarget
    ? `https://www.googleapis.com/drive/v3/files/${file.providerFileId}/export?mimeType=${encodeURIComponent(exportTarget.mimeType)}`
    : `https://www.googleapis.com/drive/v3/files/${file.providerFileId}?alt=media`

  const response = await fetch(url, {
    headers: {
      ...headers,
      ...(range && !exportTarget ? { Range: range } : {}),
    },
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return res.status(response.status).json({ code: 'GOOGLE_FILE_STREAM_FAILED', message: message || response.statusText })
  }

  res.status(response.status)
  res.setHeader('Content-Type', responseMimeType)
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  if (options.disposition) res.setHeader('Content-Disposition', contentDisposition(options.disposition, responseFileName))

  const contentLength = response.headers.get('content-length')
  const contentRange = response.headers.get('content-range')
  if (contentLength) res.setHeader('Content-Length', contentLength)
  if (contentRange) res.setHeader('Content-Range', contentRange)

  if (!response.body) {
    res.end()
    return
  }

  // Use native stream pipeline for maximum throughput without memory buffer latency
  const nodeStream = Readable.fromWeb(response.body as any)
  nodeStream.pipe(res)

  res.on('close', () => {
    nodeStream.destroy()
  })
}

export async function streamGoogleThumbnail(
  file: FileWithAccount,
  res: Response,
  size = 1200
) {
  try {
    const auth = await getAuthedGoogleClient(file.connectedAccount)
    const { google } = await import('googleapis')
    const drive = google.drive({ version: 'v3', auth })
    const metadata = await drive.files.get({
      fileId: file.providerFileId,
      fields: 'thumbnailLink,hasThumbnail',
    })

    if (metadata.data.thumbnailLink) {
      let thumbUrl = metadata.data.thumbnailLink
      if (thumbUrl.includes('=s')) {
        thumbUrl = thumbUrl.replace(/=s\d+/, `=s${size}`)
      } else {
        thumbUrl = `${thumbUrl}=s${size}`
      }

      const headers = normalizeHeaders(await auth.getRequestHeaders())
      const response = await fetch(thumbUrl, { headers })

      if (response.ok && response.body) {
        res.status(response.status)
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg')
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
        const contentLength = response.headers.get('content-length')
        if (contentLength) res.setHeader('Content-Length', contentLength)

        const nodeStream = Readable.fromWeb(response.body as any)
        nodeStream.pipe(res)
        res.on('close', () => {
          nodeStream.destroy()
        })
        return
      }
    }
  } catch {
    // If thumbnail fetching fails, fallback to full image stream
  }

  // Fallback to standard stream if thumbnail not available
  return streamGoogleFile(file, undefined, res, { disposition: 'inline' })
}


