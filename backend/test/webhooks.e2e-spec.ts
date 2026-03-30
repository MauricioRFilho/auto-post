import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { startContainers, stopContainers } from './test-setup';
import { WebhooksService } from '../src/webhooks/webhooks.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Webhooks (e2e)', () => {
  let app: INestApplication;
  let webhooksService: WebhooksService;

  beforeAll(async () => {
    await startContainers();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    webhooksService = app.get<WebhooksService>(WebhooksService);
  }, 90000);

  afterAll(async () => {
    await app.close();
    await stopContainers();
  });

  describe('POST /webhooks/n8n/status', () => {
    it('should process status correctly (201 Scenario)', async () => {
      jest.spyOn(webhooksService, 'handleN8nStatus').mockResolvedValueOnce({ success: true });

      const response = await request(app.getHttpServer())
        .post('/webhooks/n8n/status')
        .send({ id: 'link_123', status: 'completed' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid body (400 Scenario)', async () => {
      const response = await request(app.getHttpServer())
        .post('/webhooks/n8n/status')
        .send({ status: 'missing_id' })
        .expect(400);
    });

    it('should return 500 on service crash (500 Scenario)', async () => {
      jest.spyOn(webhooksService, 'handleN8nStatus').mockRejectedValueOnce(new Error('Processing Fail'));

      const response = await request(app.getHttpServer())
        .post('/webhooks/n8n/status')
        .send({ id: '123', status: 'error' })
        .expect(500);
    });
  });
});
