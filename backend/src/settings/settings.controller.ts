import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { TelegramService } from '../messaging/telegram.service';

@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly telegramService: TelegramService
  ) {}

  @Get()
  async findAll() {
    return this.settingsService.getAllSettings();
  }

  @Post('telegram')
  async updateTelegram(@Body() body: { token: string; chatId: string }) {
    await this.settingsService.upsertSetting('TELEGRAM_BOT_TOKEN', body.token);
    await this.settingsService.upsertSetting('TELEGRAM_CHAT_ID', body.chatId);
    
    return { message: 'Configurações de Telegram salvas com sucesso!' };
  }

  @Post('test-telegram')
  async testTelegram(@Body() body: { token: string; chatId: string }) {
    this.logger.log('Testando conexão com Telegram...');
    try {
      // Usamos as credenciais passadas no corpo para testar antes de salvar, se necessário
      const success = await this.telegramService.sendMessage(
        '✅ *Teste de Conexão: Cadence Auto-Post*\n\nSeu sistema está configurado corretamente e pronto para postar!',
        body.chatId,
        body.token
      );

      return { success, message: 'Mensagem de teste enviada!' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
