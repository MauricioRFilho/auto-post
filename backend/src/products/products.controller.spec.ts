import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll with query params', async () => {
      const search = 'test';
      const marketplace = 'amazon';
      await controller.findAll(search, marketplace);
      
      expect(service.findAll).toHaveBeenCalledWith({ search, marketplace });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const id = 'test-id';
      await controller.findOne(id);
      
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });
});
