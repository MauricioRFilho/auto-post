import { Test, TestingModule } from '@nestjs/testing';
import { CaptionService } from './caption.service';

describe('CaptionService', () => {
  let service: CaptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaptionService],
    }).compile();

    service = module.get<CaptionService>(CaptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCaption', () => {
    it('should correctly format a caption with all placeholders (Success Scenario)', () => {
      const product = {
        title: 'Smartphone X',
        priceCents: BigInt(200000), // R$ 2000,00
        originalPriceCents: BigInt(250000), // R$ 2500,00
        url: 'https://example.com/p',
      };

      const caption = service.formatProductCaption(product);

      expect(caption).toContain('Smartphone X');
      expect(caption).toContain('R$ 2.500,00');
      expect(caption).toContain('R$ 2.000,00');
      expect(caption).toContain('https://example.com/p');
    });

    it('should handle missing original price gracefully', () => {
      const product = {
        title: 'Item Only',
        priceCents: BigInt(5000), // R$ 50,00
        url: 'https://link.com',
      };

      const caption = service.formatProductCaption(product);

      expect(caption).toContain('Item Only');
      expect(caption).toContain('R$ 50,00');
    });
  });
});
