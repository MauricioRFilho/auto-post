import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => SettingsService))
    private settingsService: SettingsService
  ) {}

  /**
   * Valida se um token é válido chamando o endpoint /getMe do Telegram.
   */
  async testConnection(token: string): Promise<{ success: boolean; detail?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();

      if (!data.ok) {
        return { success: false, detail: data.description };
      }

      return { success: true, detail: `Bot: ${data.result.first_name} (@${data.result.username})` };
    } catch (error) {
      this.logger.error(`Erro ao testar conexão Telegram: ${error.message}`);
      return { success: false, detail: error.message };
    }
  }

  /**
   * Envia uma mensagem via Telegram.
   * Se token ou chatId forem passados, eles ignoram as configurações salvas.
   */
  async sendMessage(
    message: string,
    chatIdOverride?: string,
    tokenOverride?: string
  ): Promise<{ success: boolean; detail?: any }> {
    
    // Buscar configurações (Prioridade: Override > Banco de Dados > .env)
    const config = await this.settingsService.getTelegramConfig();
    const token = tokenOverride || config.token;
    const chatId = chatIdOverride || config.chatId;

    if (!token || !chatId) {
      this.logger.warn('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados');
      return { success: false, detail: 'Telegram não configurado' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        this.logger.error(`Erro na API do Telegram: ${data.description}`);
        return { success: false, detail: data.description };
      }

      return { success: true, detail: data.result };
    } catch (error) {
      this.logger.error(`Falha ao enviar mensagem no Telegram: ${error.message}`);
      return { success: false, detail: error.message };
    }
  }
}
