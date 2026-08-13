import type { NextFunction, Response } from 'express'
import { prisma } from '../config/prisma.js'
import type { AuthRequest } from './auth.middleware.js'

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { role: true } })
    if (!user || user.role !== 'admin') return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required.' })
    return next()
  } catch {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required.' })
  }
}
