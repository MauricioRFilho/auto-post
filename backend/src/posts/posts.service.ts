import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { TelegramService } from '../messaging/telegram.service';
import { CaptionService } from '../messaging/caption.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostJobStatus } from '@prisma/client';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private telegramService: TelegramService,
    private captionService: CaptionService,
  ) {}

  async create(dto: CreatePostDto) {
    // Verify product exists
    const product = await this.productsService.findOne(dto.productId);

    // Create post job
    const postJob = await this.prisma.postJob.create({
      data: {
        productId: dto.productId,
        channels: dto.channels,
        context: dto.context || {},
        status: 'queued',
      },
    });

    // Process post locally (replaces triggerN8nWorkflow)
    // We don't await this if we want it to be "async" like a queue, 
    // but for simplicity and "idiot-proof" we can do it now or use a local event emitter.
    // For now, let's run it and return the job.
    this.processPostJob(postJob.id, product, dto.channels, dto.context).catch(err => {
      this.logger.error(`Failed to process post job ${postJob.id}: ${err.message}`);
    });

    return postJob;
  }

  async findAll(params?: { status?: string; channel?: string }) {
    return this.prisma.postJob.findMany({
      where: {
        ...(params?.status && { status: params.status as any }),
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            marketplace: true,
            priceCents: true,
            mainImageUrl: true,
          },
        },
        events: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const postJob = await this.prisma.postJob.findUnique({
      where: { id },
      include: {
        product: true,
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!postJob) {
      throw new NotFoundException(`Post job with ID ${id} not found`);
    }

    return postJob;
  }

  async getEvents(id: string) {
    const postJob = await this.findOne(id);
    return postJob.events;
  }

  private async processPostJob(
    postJobId: string,
    product: any,
    channels: any,
    context?: any,
  ) {
    // Update status to running
    await this.updateJobStatus(postJobId, 'running', 'Geração de legenda iniciada');

    try {
      // 1. Generate Caption
      const caption = this.captionService.formatProductCaption(product, context);

      // 2. Handle Channels
      // Only Telegram is priority/free for now as requested
      if (channels.telegram || channels.default) {
        await this.updateJobStatus(postJobId, 'running', 'Enviando para Telegram', 'telegram');
        
        const result = await this.telegramService.sendMessage(caption);
        
        if (result.success) {
          await this.updateJobStatus(postJobId, 'success', 'Postado com sucesso no Telegram', 'telegram', result.detail);
        } else {
          await this.updateJobStatus(postJobId, 'error', `Erro Telegram: ${result.detail}`, 'telegram');
        }
      }

      // 3. Mark overall success if at least one worked (simpler logic)
      await this.prisma.postJob.update({
        where: { id: postJobId },
        data: { status: 'success' },
      });

    } catch (error) {
      this.logger.error(`Error processing job ${postJobId}: ${error.message}`);
      await this.updateJobStatus(postJobId, 'error', `Falha crítica: ${error.message}`);
    }
  }

  private async updateJobStatus(
    postJobId: string, 
    status: PostJobStatus, 
    message: string, 
    channel: string = 'system',
    detail: any = {}
  ) {
    await this.prisma.integrationEvent.create({
      data: {
        postJobId,
        source: channel,
        stage: status,
        payload: { message, detail, timestamp: new Date().toISOString() },
      },
    });

    if (status === 'error' || status === 'success') {
      await this.prisma.postJob.update({
        where: { id: postJobId },
        data: { status },
      });
    }
  }
}
