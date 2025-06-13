// test/utils/prisma-reset.ts
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * PrismaService üzerinden Postgres'teki tüm tabloları truncate eder.
 * CASCADE ile bağlı tabloları da temizler, identity sequence'lerini resetler.
 */
export async function resetTestDatabase(prisma: PrismaService) {
    try {
        // Önce foreign key constraint'leri devre dışı bırak
        await prisma.$executeRaw`SET session_replication_role = 'replica';`;
        
        const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
            SELECT tablename FROM pg_tables WHERE schemaname='public'
        `;

        const tables = tablenames
            .map(({ tablename }) => tablename)
            .filter((name) => name !== '_prisma_migrations')
            .map((name) => `"public"."${name}"`)
            .join(', ');

        if (tables) {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
        }
        
        // Foreign key constraint'leri tekrar aktif et
        await prisma.$executeRaw`SET session_replication_role = 'origin';`;
    } catch (error) {
        console.log('Database reset error:', error);
        throw error;
    }
}
