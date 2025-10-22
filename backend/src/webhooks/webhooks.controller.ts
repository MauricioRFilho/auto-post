import { Controller, Post, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { N8nStatusDto } from './dto/n8n-status.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('n8n/status')
  handleN8nStatus(@Body() n8nStatusDto: N8nStatusDto) {
    return this.webhooksService.handleN8nStatus(n8nStatusDto);
  }
}
