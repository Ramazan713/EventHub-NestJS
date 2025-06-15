import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { resetTestDatabase } from './prisma-reset';

declare global {
  var app: INestApplication;
  var prisma: PrismaService;
}


beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  global.app = moduleFixture.createNestApplication({
    rawBody: true
  });
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    whitelist: true,
  }));
  
  await app.init();
  global.prisma = global.app.get(PrismaService);
});

beforeEach(async () => {
  await resetTestDatabase(prisma);
  if (global.testContext) {
        global.testContext = {};
    }
})

afterEach(async () => {
  await resetTestDatabase(global.prisma);
});

afterAll(async () => {
  await global.app.close();
});
