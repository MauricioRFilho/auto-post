import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { startContainers, stopContainers } from './test-setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { execSync } from 'child_process';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // 1. Start Docker Containers
    const { databaseUrl } = await startContainers();

    // 2. Sync Prisma Schema to Test DB
    console.log('🔄 Syncing Prisma schema...');
    execSync('npx prisma db push', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });

    // 3. Initialize Nest App
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same global configurations as main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  }, 60000); // Higher timeout for container startup

  afterAll(async () => {
    await app.close();
    await stopContainers();
  });

  beforeEach(async () => {
    // Clean database between tests
    await prisma.productVersion.deleteMany();
    await prisma.product.deleteMany();
  });

  describe('GET /products', () => {
    it('should return empty list initially', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });

    it('should return products when they exist', async () => {
      await prisma.product.create({
        data: {
          marketplace: 'mercado_livre',
          title: 'Smartphone Test',
          priceCents: 150000n, // BigInt
          urlAffiliate: 'http://test.com',
          canonicalProductId: 'TEST123',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Smartphone Test');
      // Verify BigInt was serialized correctly via our custom logic in main.ts (Wait, main.ts logic isn't here, it's in app initialization)
      // Actually BigInt prototype update is global.
      expect(response.body[0].priceCents).toBe('150000');
    });
  });

  describe('GET /products/:id', () => {
    it('should return 404 in RFC 7807 format for non-existent product', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toMatchObject({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: expect.stringContaining('Product with ID'),
        instance: '/products/00000000-0000-0000-0000-000000000000',
      });
    });

    it('should return a product with detail', async () => {
      const product = await prisma.product.create({
        data: {
          marketplace: 'shopee',
          title: 'Shopee Item',
          priceCents: 5000n,
          urlAffiliate: 'http://shopee.test',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(200);

      expect(response.body.id).toBe(product.id);
      expect(response.body.marketplace).toBe('shopee');
    });
  });
});
