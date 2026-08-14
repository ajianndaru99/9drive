import { Readable } from 'node:stream'
import { google } from 'googleapis'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import type { ConnectedAccount, ProviderConfig } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { decryptText, encryptText } from '../../utils/crypto.js'
import { createS3Client, getS3ConfigForAccount } from '../s3/s3.service.js'

const googleDriveFolderMimeType = 'application/vnd.google-apps.folder'
const appFolderName = '9drive'

export function createOAuthClient(config: ProviderConfig) {
  return new google.auth.OAuth2(decryptText(config.clientIdEncrypted), decryptText(config.clientSecretEncrypted), config.redirectUri)
}

export async function getAuthedGoogleClient(account: ConnectedAccount) {
  if (!account.accessTokenEncrypted || !account.refreshTokenEncrypted || !account.tokenExpiresAt) throw new Error('Google account tokens are missing.')
  if (!account.providerConfigId) throw new Error('Google provider config is missing.')
  const config = await prisma.providerConfig.findUniqueOrThrow({ where: { id: account.providerConfigId } })
  const client = createOAuthClient(config)
  client.setCredentials({
    access_token: decryptText(account.accessTokenEncrypted),
    refresh_token: decryptText(account.refreshTokenEncrypted),
    expiry_date: account.tokenExpiresAt.getTime(),
  })

  if (account.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    const result = await client.refreshAccessToken()
    const credentials = result.credentials
    if (credentials.access_token) {
      await prisma.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessTokenEncrypted: encryptText(credentials.access_token),
          tokenExpiresAt: new Date(credentials.expiry_date ?? Date.now() + 3600_000),
        },
      })
      client.setCredentials(credentials)
    }
  }

  return client
}

export async function syncGoogleQuota(accountId: string) {
  const account = await prisma.connectedAccount.findUniqueOrThrow({ where: { id: accountId } })
  const auth = await getAuthedGoogleClient(account)
  const drive = google.drive({ version: 'v3', auth })
  const about = await drive.about.get({ fields: 'storageQuota,user' })
  const quota = about.data.storageQuota
  const total = quota?.limit ? BigInt(quota.limit) : null
  const used = quota?.usage ? BigInt(quota.usage) : 0n
  return prisma.storageAccount.upsert({
    where: { connectedAccountId: accountId },
    create: {
      connectedAccountId: accountId,
      totalBytes: total,
      usedBytes: used,
      availableBytes: total === null ? null : total - used,
      trashBytes: quota?.usageInDriveTrash ? BigInt(quota.usageInDriveTrash) : null,
      lastSyncedAt: new Date(),
    },
    update: {
      totalBytes: total,
      usedBytes: used,
      availableBytes: total === null ? null : total - used,
      trashBytes: quota?.usageInDriveTrash ? BigInt(quota.usageInDriveTrash) : null,
      lastSyncedAt: new Date(),
    },
  })
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export async function ensureGoogleAppFolder(account: ConnectedAccount) {
  const auth = await getAuthedGoogleClient(account)
  const drive = google.drive({ version: 'v3', auth })
  const queryName = escapeDriveQueryValue(appFolderName)
  const existing = await drive.files.list({
    q: `name = '${queryName}' and mimeType = '${googleDriveFolderMimeType}' and 'root' in parents and trashed = false`,
    spaces: 'drive',
    fields: 'files(id,name)',
    pageSize: 1,
  })
  const folderId = existing.data.files?.[0]?.id ?? (await drive.files.create({
    requestBody: { name: appFolderName, mimeType: googleDriveFolderMimeType, parents: ['root'] },
    fields: 'id',
  })).data.id

  if (!folderId) throw new Error('Failed to create Google Drive app folder.')
  return folderId
}

export type GoogleAppFolderSyncResult = {
  accountId: string
  created: number
  updated: number
  deleted: number
  foldersCreated?: number
}

type DriveFileMetadata = {
  id: string
  name: string
  mimeType: string
  sizeBytes: bigint
  parentId: string
}

export async function syncGoogleAppFolderFiles(accountId: string, userId: string): Promise<GoogleAppFolderSyncResult> {
  const account = await prisma.connectedAccount.findFirstOrThrow({ where: { id: accountId, userId, provider: 'google_drive', status: 'connected' } })
  const auth = await getAuthedGoogleClient(account)
  const drive = google.drive({ version: 'v3', auth })
  const appFolderId = await ensureGoogleAppFolder(account)

  const userFolders = await prisma.folder.findMany({
    where: { userId, connectedAccountId: account.id, deletedAt: null },
    select: { id: true, providerFolderId: true }
  })
  const parentIds = [
    appFolderId,
    ...userFolders.map((f) => f.providerFolderId).filter((id): id is string => !!id)
  ]

  const driveFiles: DriveFileMetadata[] = []
  let pageToken: string | undefined

  const parentsQuery = parentIds.map((id) => `'${id}' in parents`).join(' or ')
  const q = `(${parentsQuery}) and mimeType != '${googleDriveFolderMimeType}' and trashed = false`

  do {
    const response = await drive.files.list({
      q,
      spaces: 'drive',
      fields: 'nextPageToken,files(id,name,mimeType,size,parents)',
      pageSize: 1000,
      pageToken,
    })
    for (const file of response.data.files ?? []) {
      if (!file.id || !file.name || !file.mimeType) continue
      const parentId = file.parents?.[0] ?? appFolderId
      driveFiles.push({ id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: BigInt(file.size ?? 0), parentId })
    }
    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  const existingFiles = await prisma.file.findMany({ where: { userId, connectedAccountId: account.id, provider: 'google_drive' } })
  const existingByProviderId = new Map(existingFiles.map((file) => [file.providerFileId, file]))
  const driveFileIds = new Set(driveFiles.map((file) => file.id))
  let created = 0
  let updated = 0
  let deleted = 0

  const folderIdMap = new Map(userFolders.map((f) => [f.providerFolderId, f.id]))

  for (const driveFile of driveFiles) {
    const dbFolderId = driveFile.parentId === appFolderId ? null : (folderIdMap.get(driveFile.parentId) ?? null)
    const existing = existingByProviderId.get(driveFile.id)
    if (!existing) {
      await prisma.file.create({
        data: { userId, connectedAccountId: account.id, provider: 'google_drive', providerFileId: driveFile.id, name: driveFile.name, mimeType: driveFile.mimeType, sizeBytes: driveFile.sizeBytes, status: 'active', folderId: dbFolderId },
      })
      created += 1
      continue
    }

    const needsUpdate = existing.name !== driveFile.name || existing.mimeType !== driveFile.mimeType || existing.sizeBytes !== driveFile.sizeBytes || existing.status !== 'active' || existing.deletedAt !== null || existing.folderId !== dbFolderId
    if (needsUpdate) {
      await prisma.file.update({
        where: { id: existing.id },
        data: { name: driveFile.name, mimeType: driveFile.mimeType, sizeBytes: driveFile.sizeBytes, status: 'active', deletedAt: null, folderId: dbFolderId },
      })
      updated += 1
    }
  }

  const missingActiveIds = existingFiles.filter((file) => file.status === 'active' && !driveFileIds.has(file.providerFileId)).map((file) => file.id)
  if (missingActiveIds.length > 0) {
    const result = await prisma.file.updateMany({ where: { id: { in: missingActiveIds }, userId }, data: { status: 'deleted', deletedAt: new Date() } })
    deleted = result.count
  }

  await syncGoogleQuota(account.id).catch(() => undefined)
  return { accountId: account.id, created, updated, deleted }
}

export async function syncGoogleFullDrive(accountId: string, userId: string): Promise<GoogleAppFolderSyncResult> {
  const account = await prisma.connectedAccount.findFirstOrThrow({ where: { id: accountId, userId, provider: 'google_drive', status: 'connected' } })
  const auth = await getAuthedGoogleClient(account)
  const drive = google.drive({ version: 'v3', auth })

  // 1. Fetch all native folders from Google Drive
  type NativeFolder = { id: string; name: string; parentProviderId?: string }
  const driveFolders: NativeFolder[] = []
  let folderPageToken: string | undefined

  do {
    const folderRes = await drive.files.list({
      q: `mimeType = '${googleDriveFolderMimeType}' and trashed = false`,
      spaces: 'drive',
      fields: 'nextPageToken,files(id,name,parents)',
      pageSize: 1000,
      pageToken: folderPageToken,
    })
    for (const f of folderRes.data.files ?? []) {
      if (f.id && f.name) {
        driveFolders.push({ id: f.id, name: f.name, parentProviderId: f.parents?.[0] })
      }
    }
    folderPageToken = folderRes.data.nextPageToken ?? undefined
  } while (folderPageToken)

  // 2. Fetch all native files from Google Drive
  const driveFiles: DriveFileMetadata[] = []
  let filePageToken: string | undefined

  do {
    const fileRes = await drive.files.list({
      q: `mimeType != '${googleDriveFolderMimeType}' and trashed = false`,
      spaces: 'drive',
      fields: 'nextPageToken,files(id,name,mimeType,size,parents)',
      pageSize: 1000,
      pageToken: filePageToken,
    })
    for (const file of fileRes.data.files ?? []) {
      if (!file.id || !file.name || !file.mimeType) continue
      const parentId = file.parents?.[0] ?? ''
      driveFiles.push({ id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: BigInt(file.size ?? 0), parentId })
    }
    filePageToken = fileRes.data.nextPageToken ?? undefined
  } while (filePageToken)

  // 3. Upsert native folders in database
  const existingFolders = await prisma.folder.findMany({ where: { userId, connectedAccountId: account.id } })
  const folderByProviderId = new Map(existingFolders.map((f) => [f.providerFolderId, f]))
  let foldersCreated = 0

  for (const df of driveFolders) {
    const existing = folderByProviderId.get(df.id)
    if (!existing) {
      const created = await prisma.folder.create({
        data: {
          userId,
          connectedAccountId: account.id,
          provider: 'google_drive',
          providerFolderId: df.id,
          name: df.name,
          deletedAt: null
        }
      })
      folderByProviderId.set(df.id, created)
      foldersCreated += 1
    } else if (existing.name !== df.name || existing.deletedAt !== null) {
      const updated = await prisma.folder.update({
        where: { id: existing.id },
        data: { name: df.name, deletedAt: null }
      })
      folderByProviderId.set(df.id, updated)
    }
  }

  // Update folder parent relationships
  for (const df of driveFolders) {
    const current = folderByProviderId.get(df.id)
    if (current && df.parentProviderId) {
      const parentRecord = folderByProviderId.get(df.parentProviderId)
      if (parentRecord && current.parentId !== parentRecord.id) {
        await prisma.folder.update({
          where: { id: current.id },
          data: { parentId: parentRecord.id }
        }).catch(() => undefined)
      }
    }
  }

  // 4. Upsert native files in database
  const existingFiles = await prisma.file.findMany({ where: { userId, connectedAccountId: account.id, provider: 'google_drive' } })
  const existingByProviderId = new Map(existingFiles.map((file) => [file.providerFileId, file]))
  const driveFileIds = new Set(driveFiles.map((file) => file.id))
  let created = 0
  let updated = 0
  let deleted = 0

  for (const driveFile of driveFiles) {
    const parentFolder = folderByProviderId.get(driveFile.parentId)
    const dbFolderId = parentFolder?.id ?? null
    const existing = existingByProviderId.get(driveFile.id)

    if (!existing) {
      await prisma.file.create({
        data: {
          userId,
          connectedAccountId: account.id,
          provider: 'google_drive',
          providerFileId: driveFile.id,
          name: driveFile.name,
          mimeType: driveFile.mimeType,
          sizeBytes: driveFile.sizeBytes,
          status: 'active',
          folderId: dbFolderId
        },
      })
      created += 1
      continue
    }

    const needsUpdate = existing.name !== driveFile.name || existing.mimeType !== driveFile.mimeType || existing.sizeBytes !== driveFile.sizeBytes || existing.status !== 'active' || existing.deletedAt !== null || existing.folderId !== dbFolderId
    if (needsUpdate) {
      await prisma.file.update({
        where: { id: existing.id },
        data: { name: driveFile.name, mimeType: driveFile.mimeType, sizeBytes: driveFile.sizeBytes, status: 'active', deletedAt: null, folderId: dbFolderId },
      })
      updated += 1
    }
  }

  const missingActiveIds = existingFiles.filter((file) => file.status === 'active' && !driveFileIds.has(file.providerFileId)).map((file) => file.id)
  if (missingActiveIds.length > 0) {
    const result = await prisma.file.updateMany({ where: { id: { in: missingActiveIds }, userId }, data: { status: 'deleted', deletedAt: new Date() } })
    deleted = result.count
  }

  await syncGoogleQuota(account.id).catch(() => undefined)
  return { accountId: account.id, created, updated, deleted, foldersCreated }
}

export async function transferFileBetweenAccounts({
  fileId,
  userId,
  targetAccountId,
  deleteSource = true,
}: {
  fileId: string
  userId: string
  targetAccountId: string
  deleteSource?: boolean
}) {
  const file = await prisma.file.findFirstOrThrow({
    where: { id: fileId, userId, status: 'active' },
    include: { connectedAccount: true },
  })

  if (file.connectedAccountId === targetAccountId) {
    throw new Error('File is already stored in the selected account')
  }

  const targetAccount = await prisma.connectedAccount.findFirstOrThrow({
    where: { id: targetAccountId, userId, status: 'connected' },
  })

  const sourceAccount = file.connectedAccount
  if (!sourceAccount) {
    throw new Error('Source storage account is not available')
  }

  // 1. Get readable stream from source
  let stream: Readable
  if (sourceAccount.provider === 'google_drive') {
    const authSource = await getAuthedGoogleClient(sourceAccount)
    const driveSource = google.drive({ version: 'v3', auth: authSource })
    const res = await driveSource.files.get(
      { fileId: file.providerFileId, alt: 'media' },
      { responseType: 'stream' }
    )
    stream = res.data as unknown as Readable
  } else if (sourceAccount.provider === 's3') {
    const s3Config = await getS3ConfigForAccount(sourceAccount.id)
    const s3Client = createS3Client(s3Config)
    const getObj = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: file.providerFileId,
      })
    )
    if (!getObj.Body) throw new Error('Failed to read file from S3')
    stream = getObj.Body as unknown as Readable
  } else {
    throw new Error(`Unsupported source provider: ${sourceAccount.provider}`)
  }

  // 2. Stream directly into target account
  let newProviderFileId: string
  if (targetAccount.provider === 'google_drive') {
    const authTarget = await getAuthedGoogleClient(targetAccount)
    const driveTarget = google.drive({ version: 'v3', auth: authTarget })
    const appFolderId = await ensureGoogleAppFolder(targetAccount)

    const uploadRes = await driveTarget.files.create({
      requestBody: {
        name: file.name,
        parents: [appFolderId],
      },
      media: {
        mimeType: file.mimeType,
        body: stream,
      },
      fields: 'id',
    })

    if (!uploadRes.data.id) {
      throw new Error('Failed to upload file to target Google Drive')
    }
    newProviderFileId = uploadRes.data.id
  } else if (targetAccount.provider === 's3') {
    const s3Config = await getS3ConfigForAccount(targetAccount.id)
    const s3Client = createS3Client(s3Config)
    const targetKey = `9drive/${Date.now()}-${file.name}`
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: targetKey,
        Body: stream,
        ContentType: file.mimeType,
      })
    )
    newProviderFileId = targetKey
  } else {
    throw new Error(`Unsupported target provider: ${targetAccount.provider}`)
  }

  // 3. If deleteSource, remove from source account
  if (deleteSource) {
    try {
      if (sourceAccount.provider === 'google_drive') {
        const authSource = await getAuthedGoogleClient(sourceAccount)
        const driveSource = google.drive({ version: 'v3', auth: authSource })
        await driveSource.files.delete({ fileId: file.providerFileId })
      } else if (sourceAccount.provider === 's3') {
        const s3Config = await getS3ConfigForAccount(sourceAccount.id)
        const s3Client = createS3Client(s3Config)
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3Config.bucket,
            Key: file.providerFileId,
          })
        )
      }
    } catch (cleanupErr) {
      console.error('Failed to cleanup source file after transfer', cleanupErr)
    }

    // Update database record to point to target account
    const updated = await prisma.file.update({
      where: { id: file.id },
      data: {
        connectedAccountId: targetAccount.id,
        provider: targetAccount.provider,
        providerFileId: newProviderFileId,
      },
    })

    // Update quotas
    if (sourceAccount.provider === 'google_drive') await syncGoogleQuota(sourceAccount.id).catch(() => undefined)
    if (targetAccount.provider === 'google_drive') await syncGoogleQuota(targetAccount.id).catch(() => undefined)

    return updated
  } else {
    // If not deleting source, create a duplicate file record
    const duplicated = await prisma.file.create({
      data: {
        userId,
        connectedAccountId: targetAccount.id,
        provider: targetAccount.provider,
        providerFileId: newProviderFileId,
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        folderId: file.folderId,
        status: 'active',
      },
    })

    if (targetAccount.provider === 'google_drive') await syncGoogleQuota(targetAccount.id).catch(() => undefined)

    return duplicated
  }
}

