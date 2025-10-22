import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { N8nStatusDto } from './dto/n8n-status.dto';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  validateSignature(payload: any, signature: string): boolean {
    const secret = this.configService.get('N8N_CALLBACK_SECRET');
    if (!secret) {
      return true; // Skip validation in dev if no secret
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  async handleN8nStatus(dto: N8nStatusDto) {
    // Validate signature if provided
    if (dto.signature) {
      const { signature, ...payload } = dto;
      if (!this.validateSignature(payload, signature)) {
        throw new UnauthorizedException('Invalid signature');
      }
    }

    // Create integration event
    await this.prisma.integrationEvent.create({
      data: {
        postJobId: dto.postJobId,
        source: dto.channel,
        stage: dto.stage,
        payload: {
          status: dto.status,
          detail: dto.detail || {},
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Update post job status based on events
    await this.updatePostJobStatus(dto.postJobId);

    return { success: true };
  }

  private async updatePostJobStatus(postJobId: string) {
    const events = await this.prisma.integrationEvent.findMany({
      where: { postJobId },
      orderBy: { createdAt: 'desc' },
    });

    // Check if any channel has error
    const hasError = events.some(
      (e) => e.payload['status'] === 'error',
    );

    // Check if all channels are successful
    const postJob = await this.prisma.postJob.findUnique({
      where: { id: postJobId },
    });

    const channels = postJob.channels as any;
    const activeChannels = Object.keys(channels).filter((k) => channels[k]);

    const successfulChannels = new Set(
      events
        .filter((e) => e.stage === 'posted' && e.payload['status'] === 'success')
        .map((e) => e.source),
    );

    let status: 'running' | 'success' | 'partial' | 'error' = 'running';

    if (hasError) {
      if (successfulChannels.size > 0) {
        status = 'partial';
      } else {
        status = 'error';
      }
    } else if (successfulChannels.size === activeChannels.length) {
      status = 'success';
    }

    await this.prisma.postJob.update({
      where: { id: postJobId },
      data: { status },
    });
  }
}
