import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
  
  global.app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    whitelist: true,
  }));
  
  await global.app.init();
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
