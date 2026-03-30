import { Injectable } from '@nestjs/common';

@Injectable()
export class CaptionService {
  /**
   * Formata a legenda de um produto com suporte a preço original e desconto.
   */
  formatProductCaption(product: any, context?: any): string {
    const price = (Number(product.priceCents) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).replace(/\xa0/g, ' ');

    const originalPrice = product.originalPriceCents
      ? (Number(product.originalPriceCents) / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).replace(/\xa0/g, ' ')
      : null;

    const rating = product.rating ? `⭐ ${product.rating}` : '🔥 Novidade!';
    const tags = context?.hashtags ? context.hashtags.join(' ') : '#promo #oferta #achadinhos';

    const priceText = originalPrice 
      ? `❌ De: ~~${originalPrice}~~\n✅ **Por APENAS: ${price}**` 
      : `💰 **Por APENAS: ${price}**`;

    return `🔥 **${product.title}**\n\n${priceText}\n\n${rating}\n\n🛒 Link para compra: ${product.urlAffiliate || product.url}\n\n${tags}`;
  }
}
