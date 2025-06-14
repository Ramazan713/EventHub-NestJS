import { Role } from "@prisma/client";
import { PrismaService } from "../../src/prisma/prisma.service";

export async function createTestUser(
  prisma: PrismaService,
  overrides?: { sub?: number; role?: Role; email?: string, password?: string },
) {
    const user = await prisma.user.create({
        data: {
            id: overrides?.sub ?? 1,
            email: overrides?.email ?? 'user@example.com',
            passwordHash: "hashedPassword",
            role: overrides?.role ?? Role.USER,
        },
    });
    return user
}