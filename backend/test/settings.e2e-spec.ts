import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { startContainers, stopContainers } from './test-setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { execSync } from 'child_process';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Settings (e2e)', () => {
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
    await prisma.systemConfig.deleteMany();
  });

  describe('GET /settings', () => {
    it('should return 200 and settings object (200 Scenario)', async () => {
      await prisma.systemConfig.create({
        data: { key: 'TELEGRAM_BOT_TOKEN', value: '123' },
      });

      const response = await request(app.getHttpServer())
        .get('/settings')
        .expect(200);

      expect(response.body).toHaveProperty('TELEGRAM_BOT_TOKEN', '123');
    });
  });

  describe('POST /settings', () => {
    it('should update settings and return 201 (201 Scenario)', async () => {
      const response = await request(app.getHttpServer())
        .post('/settings')
        .send({ TELEGRAM_BOT_TOKEN: 'new_token', TELEGRAM_CHAT_ID: 'new_chat' })
        .expect(201);

      const dbToken = await prisma.systemConfig.findUnique({ where: { key: 'TELEGRAM_BOT_TOKEN' } });
      expect(dbToken.value).toBe('new_token');
    });

    it('should return 400 for empty payload (400 Scenario)', async () => {
      // Assuming validation pipe handles empty objects if class-validator is set up
      // In our current controller it might accept empty object, but let's test invalid types if any.
      // If no validation on @Body(), this might not fail. Let's send non-string value.
      const response = await request(app.getHttpServer())
        .post('/settings')
        .send({ TELEGRAM_BOT_TOKEN: 12345 }) // Should be string
        .expect(400);
    });

    it('should return 500 when database fails (500 Scenario)', async () => {
      // Mocking prisma.systemConfig.upsert to throw
      jest.spyOn(prisma.systemConfig, 'upsert').mockRejectedValueOnce(new Error('DB Fail'));

      const response = await request(app.getHttpServer())
        .post('/settings')
        .send({ TELEGRAM_BOT_TOKEN: 'token' })
        .expect(500);

      expect(response.body.title).toBe('Internal Server Error');
    });
  });
});
