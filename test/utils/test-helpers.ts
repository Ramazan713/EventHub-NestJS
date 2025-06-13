import * as bcrypt from 'bcrypt';
import { Role } from "../../generated/prisma";
import { PrismaService } from "src/prisma/prisma.service";

export async function createTestUser(
  prisma: PrismaService,
  overrides?: { sub?: number; role?: Role; email?: string, password?: string },
) {
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(overrides?.password ?? 'password', salt)
    return prisma.user.create({
        data: {
            id: overrides?.sub ?? 1,
            email: overrides?.email ?? 'user@example.com',
            passwordHash: hashedPassword,
            role: overrides?.role ?? Role.USER,
        },
    });
}