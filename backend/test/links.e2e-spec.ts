import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { startContainers, stopContainers } from './test-setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { execSync } from 'child_process';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Links (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const { databaseUrl } = await startContainers();

    execSync('npx prisma db push', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  }, 90000);

  afterAll(async () => {
    await app.close();
    await stopContainers();
  });

  beforeEach(async () => {
    await prisma.link.deleteMany();
  });

  describe('POST /links', () => {
    it('should create a link (201 Scenario)', async () => {
      const response = await request(app.getHttpServer())
        .post('/links')
        .send({ url: 'https://www.mercadolivre.com.br/product' })
        .expect(201);

      expect(response.body.url).toBe('https://www.mercadolivre.com.br/product');
    });

    it('should return 400 for invalid URL (400 Scenario)', async () => {
      const response = await request(app.getHttpServer())
        .post('/links')
        .send({ url: 'not-a-url' })
        .expect(400);
    });

    it('should return 500 on prisma error (500 Scenario)', async () => {
      jest.spyOn(prisma.link, 'create').mockRejectedValueOnce(new Error('Crash'));

      const response = await request(app.getHttpServer())
        .post('/links')
        .send({ url: 'https://valid.url' })
        .expect(500);
    });
  });

  describe('GET /links/:invalid_id', () => {
    it('should return 404 for non-existent link (404 Scenario)', async () => {
      const response = await request(app.getHttpServer())
        .get('/links/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
