import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { resetTestDatabase } from './prisma-reset';

declare global {
  var app: INestApplication;
  var prisma: PrismaService;
}


beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  global.app = moduleFixture.createNestApplication();
  await app.init();

  app.useGlobalPipes(new ValidationPipe({ 
    transform: true
   }));
  global.prisma = global.app.get(PrismaService);
});

afterEach(async () => {
  await resetTestDatabase(global.prisma);
});

afterAll(async () => {
  await global.app.close();
});
