import { prisma } from '../config/prisma.js'

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM _prisma_migrations WHERE migration_name = '20260813010000_add_user_role';`
    )
    console.log('Migration cleanup script executed successfully.')
  } catch (error: any) {
    console.warn('Migration cleanup skipped:', error?.message || error)
  }
}

main()
  .catch(() => {})
  .finally(async () => {
    await prisma.$disconnect()
  })
