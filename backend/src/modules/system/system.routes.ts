import { Router } from 'express'
import { exec, spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../../middleware/auth.middleware.js'
import { requireAdmin } from '../../middleware/admin.middleware.js'
import { prisma } from '../../config/prisma.js'
import { decryptText, encryptText } from '../../utils/crypto.js'
import Busboy from 'busboy'

export const systemRouter = Router()


systemRouter.post('/update', requireAuth, requireAdmin, (req, res, next) => {
  const projectRoot = path.resolve(process.cwd(), '..')
  const updateScript = path.join(projectRoot, 'update.sh')

  // Check if git is installed
  exec('git --version', (gitError) => {
    if (gitError) {
      return res.status(400).json({
        code: 'GIT_NOT_FOUND',
        message: 'Git is not installed inside the app container. Since you are running 9Drive in Docker, please update by running:\n\n1. cd 9drive\n2. git pull\n3. docker-compose down && docker-compose up -d --build\n\ndirectly in your host terminal.'
      })
    }

    if (fs.existsSync(updateScript)) {
      try {
        // Clear old update log to prevent race conditions on frontend polling
        const logFile = path.join(projectRoot, 'update.log')
        fs.writeFileSync(logFile, 'Initiating update...\n')

        const child = spawn('bash', ['update.sh'], {
          cwd: projectRoot,
          detached: true,
          stdio: 'ignore'
        })
        child.unref()

        return res.json({
          status: 'success',
          message: 'System update initiated. Rebuilding and restarting backend & frontend in the background. Please wait ~1 minute and refresh the page.'
        })
      } catch (err: any) {
        return res.status(500).json({
          code: 'UPDATE_FAILED',
          message: 'Failed to start update script.',
          error: err.message
        })
      }
    } else {
      // Fallback to simple git pull if update.sh doesn't exist
      exec('git pull', { cwd: projectRoot }, (error, stdout, stderr) => {
        if (error) {
          console.error('System update failed:', error)
          return res.status(500).json({
            code: 'UPDATE_FAILED',
            message: 'Failed to run git pull. Make sure git is installed and configured.',
            error: error.message,
            stderr
          })
        }

        console.log('System update stdout:', stdout)
        if (stderr) {
          console.warn('System update stderr:', stderr)
        }

        return res.json({
          status: 'success',
          message: 'System code updated successfully. Dev servers will auto-restart.',
          stdout,
          stderr
        })
      })
    }
  })
})

systemRouter.get('/update-log', requireAuth, requireAdmin, (req, res) => {
  const projectRoot = path.resolve(process.cwd(), '..')
  const logFile = path.join(projectRoot, 'update.log')

  if (!fs.existsSync(logFile)) {
    return res.json({
      log: 'No update history found.'
    })
  }

  try {
    const logContent = fs.readFileSync(logFile, 'utf8')
    return res.json({
      log: logContent
    })
  } catch (error: any) {
    return res.status(500).json({
      code: 'READ_LOG_FAILED',
      message: 'Failed to read update log file.',
      error: error.message
    })
  }
})

systemRouter.get('/google-config', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const config = await prisma.providerConfig.findFirst({
      where: { userId: null, provider: 'google_drive', status: 'active' },
      orderBy: { createdAt: 'desc' }
    })

    const defaultRedirect = `${req.protocol}://${req.get('host')}/connected-accounts/google/callback`

    if (!config) {
      return res.json({
        exists: false,
        defaultRedirectUri: defaultRedirect
      })
    }

    let clientId = ''
    try {
      clientId = decryptText(config.clientIdEncrypted)
    } catch {
      clientId = ''
    }

    return res.json({
      exists: true,
      clientId,
      redirectUri: config.redirectUri,
      hasSecret: !!config.clientSecretEncrypted,
      defaultRedirectUri: defaultRedirect
    })
  } catch (error) {
    return next(error)
  }
})

systemRouter.post('/google-config', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body

    if (!clientId) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Client ID is required.' })
    }

    const defaultRedirect = `${req.protocol}://${req.get('host')}/connected-accounts/google/callback`
    const finalRedirectUri = redirectUri || defaultRedirect

    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    // Disable old global active config
    await prisma.providerConfig.updateMany({
      where: { userId: null, provider: 'google_drive', status: 'active' },
      data: { status: 'disabled' }
    })

    // Retrieve the old config to see if we need to reuse the secret if it was not provided in the request
    let finalSecret = clientSecret
    if (!finalSecret) {
      const oldConfig = await prisma.providerConfig.findFirst({
        where: { userId: null, provider: 'google_drive', status: 'disabled' },
        orderBy: { createdAt: 'desc' }
      })
      if (oldConfig) {
        try {
          finalSecret = decryptText(oldConfig.clientSecretEncrypted)
        } catch {
          // ignore
        }
      }
    }

    if (!finalSecret) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Client Secret is required for first-time setup.' })
    }

    const config = await prisma.providerConfig.create({
      data: {
        userId: null,
        provider: 'google_drive',
        clientIdEncrypted: encryptText(clientId),
        clientSecretEncrypted: encryptText(finalSecret),
        redirectUri: finalRedirectUri,
        scopes,
        status: 'active'
      }
    })

    return res.status(201).json({
      status: 'success',
      message: 'Global Google OAuth configuration updated successfully.',
      id: config.id
    })
  } catch (error) {
    return next(error)
  }
})

systemRouter.get('/backup', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const [users, providerConfigs, connectedAccounts, s3Configs, folders, files, fileShares, apiKeys, policies] = await Promise.all([
      prisma.user.findMany(),
      prisma.providerConfig.findMany(),
      prisma.connectedAccount.findMany(),
      prisma.s3StorageConfig.findMany(),
      prisma.folder.findMany(),
      prisma.file.findMany(),
      prisma.fileShare.findMany(),
      prisma.apiKey.findMany(),
      prisma.uploadRoutingPolicy.findMany(),
    ])

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        providerConfigs,
        connectedAccounts,
        s3Configs,
        folders,
        files: files.map((f) => ({ ...f, sizeBytes: f.sizeBytes.toString() })),
        fileShares,
        apiKeys,
        policies,
      }
    }

    res.setHeader('Content-Disposition', 'attachment; filename="9drive-backup.json"')
    res.setHeader('Content-Type', 'application/json')
    return res.send(JSON.stringify(backupData, null, 2))
  } catch (error) {
    return next(error)
  }
})

systemRouter.post('/restore', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const contentType = req.headers['content-type']
    if (!contentType?.includes('multipart/form-data')) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'multipart/form-data required.' })
    }

    const busboy = Busboy({ headers: req.headers, limits: { files: 1 } })
    let fileReceived = false
    let rawContent = ''

    busboy.on('file', (_name, fileStream) => {
      fileReceived = true
      fileStream.on('data', (chunk) => {
        rawContent += chunk.toString('utf8')
      })

      fileStream.on('end', async () => {
        try {
          const parsed = JSON.parse(rawContent)
          if (!parsed.data) {
            return res.status(400).json({ code: 'INVALID_BACKUP', message: 'Invalid backup file structure.' })
          }

          const { users, providerConfigs, connectedAccounts, s3Configs, folders, files, fileShares, apiKeys, policies } = parsed.data

          // Rehydrate users
          if (Array.isArray(users)) {
            for (const u of users) {
              await prisma.user.upsert({
                where: { id: u.id },
                create: { ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) },
                update: { name: u.name, email: u.email, role: u.role, status: u.status, passwordHash: u.passwordHash },
              }).catch(() => undefined)
            }
          }

          // Rehydrate provider configs
          if (Array.isArray(providerConfigs)) {
            for (const p of providerConfigs) {
              await prisma.providerConfig.upsert({
                where: { id: p.id },
                create: { ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) },
                update: p,
              }).catch(() => undefined)
            }
          }

          // Rehydrate connected accounts
          if (Array.isArray(connectedAccounts)) {
            for (const acc of connectedAccounts) {
              await prisma.connectedAccount.upsert({
                where: { id: acc.id },
                create: { ...acc, createdAt: new Date(acc.createdAt), updatedAt: new Date(acc.updatedAt), tokenExpiresAt: acc.tokenExpiresAt ? new Date(acc.tokenExpiresAt) : null },
                update: acc,
              }).catch(() => undefined)
            }
          }

          // Rehydrate s3 configs
          if (Array.isArray(s3Configs)) {
            for (const s of s3Configs) {
              await prisma.s3StorageConfig.upsert({
                where: { id: s.id },
                create: { ...s, quotaBytes: s.quotaBytes ? BigInt(s.quotaBytes) : null, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) },
                update: { ...s, quotaBytes: s.quotaBytes ? BigInt(s.quotaBytes) : null },
              }).catch(() => undefined)
            }
          }

          // Rehydrate folders
          if (Array.isArray(folders)) {
            for (const fol of folders) {
              await prisma.folder.upsert({
                where: { id: fol.id },
                create: { ...fol, createdAt: new Date(fol.createdAt), updatedAt: new Date(fol.updatedAt), deletedAt: fol.deletedAt ? new Date(fol.deletedAt) : null, lastOpenedAt: fol.lastOpenedAt ? new Date(fol.lastOpenedAt) : null },
                update: fol,
              }).catch(() => undefined)
            }
          }

          // Rehydrate files
          if (Array.isArray(files)) {
            for (const fil of files) {
              await prisma.file.upsert({
                where: { id: fil.id },
                create: { ...fil, sizeBytes: BigInt(fil.sizeBytes), createdAt: new Date(fil.createdAt), updatedAt: new Date(fil.updatedAt), deletedAt: fil.deletedAt ? new Date(fil.deletedAt) : null, lastOpenedAt: fil.lastOpenedAt ? new Date(fil.lastOpenedAt) : null },
                update: { ...fil, sizeBytes: BigInt(fil.sizeBytes) },
              }).catch(() => undefined)
            }
          }

          // Rehydrate file shares
          if (Array.isArray(fileShares)) {
            for (const fs of fileShares) {
              await prisma.fileShare.upsert({
                where: { id: fs.id },
                create: { ...fs, createdAt: new Date(fs.createdAt), updatedAt: new Date(fs.updatedAt), expiresAt: fs.expiresAt ? new Date(fs.expiresAt) : null },
                update: fs,
              }).catch(() => undefined)
            }
          }

          // Rehydrate api keys
          if (Array.isArray(apiKeys)) {
            for (const k of apiKeys) {
              await prisma.apiKey.upsert({
                where: { id: k.id },
                create: { ...k, createdAt: new Date(k.createdAt), updatedAt: new Date(k.updatedAt), lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt) : null, expiresAt: k.expiresAt ? new Date(k.expiresAt) : null, revokedAt: k.revokedAt ? new Date(k.revokedAt) : null },
                update: k,
              }).catch(() => undefined)
            }
          }

          // Rehydrate policies
          if (Array.isArray(policies)) {
            for (const pol of policies) {
              await prisma.uploadRoutingPolicy.upsert({
                where: { id: pol.id },
                create: { ...pol, createdAt: new Date(pol.createdAt), updatedAt: new Date(pol.updatedAt) },
                update: pol,
              }).catch(() => undefined)
            }
          }

          return res.json({
            status: 'success',
            message: 'Database restored successfully.'
          })
        } catch (err: any) {
          console.error('Failed to restore backup:', err)
          return res.status(500).json({ code: 'RESTORE_FAILED', message: err.message || 'Failed to restore database.' })
        }
      })
    })

    busboy.on('error', (err) => {
      console.error('Busboy error:', err)
      if (!res.headersSent) next(err)
    })

    busboy.on('finish', () => {
      if (!fileReceived && !res.headersSent) {
        return res.status(400).json({ code: 'BAD_REQUEST', message: 'No file uploaded.' })
      }
    })

    req.pipe(busboy)
  } catch (error) {
    return next(error)
  }
})
