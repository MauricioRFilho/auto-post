import { Telegraf } from 'telegraf';

/**
 * Mock da classe Telegraf para simular a API do Telegram.
 * Permite alternar entre cenários de sucesso e erro via métodos mock.
 */
export const createTelegrafMock = (scenario: 'success' | '401' | '400' | '500' = 'success') => {
  const mockTelegram = {
    sendMessage: jest.fn().mockImplementation((chatId, text) => {
      if (scenario === '401') throw new Error('401: Unauthorized');
      if (scenario === '400') throw new Error('400: Bad Request');
      if (scenario === '500') throw new Error('500: Network Error');
      return Promise.resolve({ message_id: 12345 });
    }),
    getMe: jest.fn().mockImplementation(() => {
      if (scenario === '401') throw new Error('401: Unauthorized');
      return Promise.resolve({ id: 1, is_bot: true, first_name: 'MockBot', username: 'mock_bot' });
    }),
  };

  return {
    telegram: mockTelegram,
    launch: jest.fn().mockResolvedValue(true),
    stop: jest.fn().mockResolvedValue(true),
  };
};

// Exportar para uso global no Jest
jest.mock('telegraf', () => {
  return {
    Telegraf: jest.fn().mockImplementation(() => createTelegrafMock('success')),
  };
});
