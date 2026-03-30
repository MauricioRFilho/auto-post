import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { SettingsService } from '../settings/settings.service';
import { ConfigService } from '@nestjs/config';

describe('TelegramService', () => {
  let service: TelegramService;
  let settings: SettingsService;

  const mockSettingsService = {
    getTelegramConfig: jest.fn().mockResolvedValue({
      token: 'valid_token',
      chatId: 'valid_chat_id',
    }),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Mock global fetch
    (global as any).fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    settings = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should send a message successfully (200 Scenario)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ ok: true, result: { message_id: 1 } }),
      });

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('valid_token'),
        expect.any(Object)
      );
    });

    it('should return failure on Telegram API error (400/401 Scenario)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ ok: false, description: 'Unauthorized' }),
      });

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.detail).toBe('Unauthorized');
    });

    it('should return failure on network error (500 Scenario)', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      const result = await service.sendMessage('Hello');

      expect(result.success).toBe(false);
      expect(result.detail).toBe('Network Error');
    });
  });

  describe('testConnection', () => {
    it('should return true if token is valid', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ ok: true, result: { first_name: 'Bot', username: 'bot' } }),
      });

      const result = await service.testConnection('api_token');

      expect(result.success).toBe(true);
      expect(result.detail).toContain('Bot');
    });

    it('should return false if token is invalid', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ ok: false, description: 'Not Found' }),
      });

      const result = await service.testConnection('invalid_token');

      expect(result.success).toBe(false);
    });
  });
});
