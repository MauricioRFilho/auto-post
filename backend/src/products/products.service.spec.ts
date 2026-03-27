import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { Marketplace } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productVersion: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const result = [{ id: '1', title: 'Test Product' }];
      mockPrismaService.product.findMany.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should filter by search and marketplace', async () => {
      const params = { search: 'phone', marketplace: 'amazon' };
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.findAll(params);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.any(Object),
            marketplace: 'amazon',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single product if found', async () => {
      const product = { id: '1', title: 'Test Product' };
      mockPrismaService.product.findUnique.mockResolvedValue(product);

      expect(await service.findOne('1')).toBe(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createOrUpdate', () => {
    const productData = {
      marketplace: 'mercado_livre' as Marketplace,
      canonicalProductId: 'ML123',
      title: 'New Product',
      priceCents: BigInt(1000),
      currency: 'BRL',
    };

    it('should create a new product if it does not exist', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({ id: 'new-id', ...productData });

      const result = await service.createOrUpdate(productData);

      expect(prisma.product.create).toHaveBeenCalled();
      expect(prisma.productVersion.create).toHaveBeenCalled();
      expect(result.id).toBe('new-id');
    });

    it('should update an existing product if found', async () => {
      const existing = { id: 'existing-id', ...productData };
      mockPrismaService.product.findFirst.mockResolvedValue(existing);
      mockPrismaService.product.update.mockResolvedValue({ ...existing, title: 'Updated' });

      const result = await service.createOrUpdate({ ...productData, title: 'Updated' });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-id' },
          data: expect.objectContaining({ title: 'Updated' }),
        }),
      );
      expect(result.title).toBe('Updated');
    });
  });
});
