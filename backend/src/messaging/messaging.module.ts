import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { CaptionService } from './caption.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SettingsModule)],
  providers: [TelegramService, CaptionService],
  exports: [TelegramService, CaptionService],
})
export class MessagingModule {}
