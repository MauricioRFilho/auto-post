import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { search?: string; marketplace?: string }) {
    return this.prisma.product.findMany({
      where: {
        ...(params?.search && {
          title: {
            contains: params.search,
            mode: 'insensitive',
          },
        }),
        ...(params?.marketplace && { marketplace: params.marketplace as any }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { scrapedAt: 'desc' },
        },
        affiliateLinks: {
          where: { isActive: true },
        },
        postJobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            events: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async createOrUpdate(data: any) {
    const existing = await this.prisma.product.findFirst({
      where: {
        marketplace: data.marketplace,
        canonicalProductId: data.canonicalProductId,
      },
    });

    let product;

    if (existing) {
      // Update existing product
      product = await this.prisma.product.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          priceCents: data.priceCents,
          currency: data.currency || 'BRL',
          rating: data.rating,
          reviewCount: data.reviewCount,
          sellerName: data.sellerName,
          category: data.category,
          mainImageUrl: data.mainImageUrl,
          images: data.images || [],
          urlAffiliate: data.urlAffiliate,
          urlCanonical: data.urlCanonical,
        },
      });
    } else {
      // Create new product
      product = await this.prisma.product.create({
        data: {
          marketplace: data.marketplace,
          canonicalProductId: data.canonicalProductId,
          title: data.title,
          priceCents: data.priceCents,
          currency: data.currency || 'BRL',
          rating: data.rating,
          reviewCount: data.reviewCount,
          sellerName: data.sellerName,
          category: data.category,
          mainImageUrl: data.mainImageUrl,
          images: data.images || [],
          urlAffiliate: data.urlAffiliate,
          urlCanonical: data.urlCanonical,
        },
      });
    }

    // Create version snapshot
    await this.prisma.productVersion.create({
      data: {
        productId: product.id,
        snapshot: data,
      },
    });

    return product;
  }
}
