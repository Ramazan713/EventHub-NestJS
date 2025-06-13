// test/utils/prisma-reset.ts
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * PrismaService üzerinden Postgres'teki tüm tabloları truncate eder.
 * CASCADE ile bağlı tabloları da temizler, identity sequence'lerini resetler.
 */
export async function resetTestDatabase(prisma: PrismaService) {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

      const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ')

    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`)
    } catch (error) {
      console.log({ error })
    }
}
