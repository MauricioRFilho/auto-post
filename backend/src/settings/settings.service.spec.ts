import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;
  let config: ConfigService;

  const mockPrismaService = {
    systemConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'TELEGRAM_BOT_TOKEN') return 'env_token';
      if (key === 'TELEGRAM_CHAT_ID') return 'env_chat_id';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTelegramConfig', () => {
    it('should return config from database if exists (200 Scenario)', async () => {
      mockPrismaService.systemConfig.findUnique
        .mockResolvedValueOnce({ key: 'TELEGRAM_BOT_TOKEN', value: 'db_token' })
        .mockResolvedValueOnce({ key: 'TELEGRAM_CHAT_ID', value: 'db_chat_id' });

      const result = await service.getTelegramConfig();

      expect(result.token).toBe('db_token');
      expect(result.chatId).toBe('db_chat_id');
      expect(prisma.systemConfig.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should fallback to .env if database is empty (Fallback Scenario)', async () => {
      mockPrismaService.systemConfig.findUnique.mockResolvedValue(null);

      const result = await service.getTelegramConfig();

      expect(result.token).toBe('env_token');
      expect(result.chatId).toBe('env_chat_id');
    });

    it('should return null if neither DB nor .env has the keys (404/Empty Scenario)', async () => {
      mockPrismaService.systemConfig.findUnique.mockResolvedValue(null);
      mockConfigService.get.mockReturnValue(null);

      const result = await service.getTelegramConfig();

      expect(result.token).toBeNull();
      expect(result.chatId).toBeNull();
    });
  });

  describe('upsertSetting', () => {
    it('should call upsert with correct parameters (Success Scenario)', async () => {
      await service.upsertSetting('TEST_KEY', 'test_value');

      expect(prisma.systemConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'TEST_KEY' },
        update: { value: 'test_value' },
        create: { key: 'TEST_KEY', value: 'test_value' },
      });
    });

    it('should throw error if database fails (500 Scenario)', async () => {
      mockPrismaService.systemConfig.upsert.mockRejectedValue(new Error('DB failure'));

      await expect(service.upsertSetting('KEY', 'VAL')).rejects.toThrow('DB failure');
    });
  });
});
