import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesService } from '../queues/queues.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { Marketplace } from '@prisma/client';

@Injectable()
export class LinksService {
  constructor(
    private prisma: PrismaService,
    private queuesService: QueuesService,
  ) {}

  detectMarketplace(url: string): Marketplace {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('mercadolivre') || urlLower.includes('mercadolibre')) {
      return Marketplace.mercado_livre;
    }
    if (urlLower.includes('magazineluiza') || urlLower.includes('magalu')) {
      return Marketplace.magalu;
    }
    if (urlLower.includes('shopee')) {
      return Marketplace.shopee;
    }

    throw new BadRequestException('Marketplace not supported. Only Mercado Livre, Magalu, and Shopee are supported.');
  }

  async create(dto: CreateLinkDto) {
    const marketplace = this.detectMarketplace(dto.url);

    // Create affiliate link
    const affiliateLink = await this.prisma.affiliateLink.create({
      data: {
        rawUrl: dto.url,
        marketplace,
        isActive: true,
      },
    });

    // Create scrape run record
    const scrapeRun = await this.prisma.scrapeRun.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        status: 'queued',
      },
    });

    // Add to scrape queue
    await this.queuesService.addScrapeJob({
      affiliateLinkId: affiliateLink.id,
    });

    return {
      affiliateLinkId: affiliateLink.id,
      scrapeRunId: scrapeRun.id,
      normalizedUrl: affiliateLink.normalizedUrl,
      marketplace: affiliateLink.marketplace,
    };
  }

  async findAll(params?: { marketplace?: string; isActive?: boolean }) {
    return this.prisma.affiliateLink.findMany({
      where: {
        ...(params?.marketplace && { marketplace: params.marketplace as Marketplace }),
        ...(params?.isActive !== undefined && { isActive: params.isActive }),
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            priceCents: true,
            mainImageUrl: true,
          },
        },
        scrapeRuns: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { id },
      include: {
        product: true,
        scrapeRuns: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!link) {
      throw new NotFoundException(`Affiliate link with ID ${id} not found`);
    }

    return link;
  }

  async triggerScrape(id: string) {
    const link = await this.findOne(id);

    // Create new scrape run
    const scrapeRun = await this.prisma.scrapeRun.create({
      data: {
        affiliateLinkId: link.id,
        status: 'queued',
      },
    });

    // Add to queue
    await this.queuesService.addScrapeJob({
      affiliateLinkId: link.id,
    });

    return {
      scrapeRunId: scrapeRun.id,
      status: 'queued',
    };
  }
}
