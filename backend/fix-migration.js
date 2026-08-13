const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Cleaning up any failed migration records...');
    await prisma.$executeRawUnsafe(
      `DELETE FROM _prisma_migrations WHERE migration_name = '20260813010000_add_user_role';`
    );
    console.log('Successfully cleaned up failed migration records.');
  } catch (err) {
    console.log('Migration cleanup info:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
