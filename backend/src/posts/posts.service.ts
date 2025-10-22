import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private configService: ConfigService,
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

    // Trigger n8n workflow
    await this.triggerN8nWorkflow(postJob.id, product, dto.channels, dto.context);

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

  private async triggerN8nWorkflow(
    postJobId: string,
    product: any,
    channels: any,
    context?: any,
  ) {
    const n8nBaseUrl = this.configService.get('N8N_BASE_URL');
    const n8nWebhookPath = this.configService.get('N8N_WEBHOOK_PATH');
    const backendBaseUrl = this.configService.get('BACKEND_BASE_URL') || 'http://localhost:8080';

    const payload = {
      postJobId,
      backendBaseUrl,
      channels,
      product: {
        id: product.id,
        marketplace: product.marketplace,
        title: product.title,
        priceCents: product.priceCents,
        currency: product.currency,
        rating: product.rating?.toString(),
        reviewCount: product.reviewCount,
        sellerName: product.sellerName,
        category: product.category,
        images: product.images,
        urlAffiliate: product.urlAffiliate,
      },
      context: context || {},
    };

    try {
      const response = await fetch(`${n8nBaseUrl}${n8nWebhookPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      // Log success
      await this.prisma.integrationEvent.create({
        data: {
          postJobId,
          source: 'n8n',
          stage: 'triggered',
          payload: { status: 'success', timestamp: new Date().toISOString() },
        },
      });

      // Update post job status
      await this.prisma.postJob.update({
        where: { id: postJobId },
        data: { status: 'running' },
      });
    } catch (error) {
      // Log error
      await this.prisma.integrationEvent.create({
        data: {
          postJobId,
          source: 'n8n',
          stage: 'error',
          payload: { error: error.message, timestamp: new Date().toISOString() },
        },
      });

      // Update post job status
      await this.prisma.postJob.update({
        where: { id: postJobId },
        data: { status: 'error' },
      });

      throw error;
    }
  }
}
