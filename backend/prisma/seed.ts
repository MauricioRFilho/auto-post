import { PrismaClient, Marketplace, ScrapeRunStatus, PostJobStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Removendo dados antigos...');
  await prisma.postJob.deleteMany();
  await prisma.scrapeRun.deleteMany();
  await prisma.affiliateLink.deleteMany();
  await prisma.productVersion.deleteMany();
  await prisma.product.deleteMany();

  console.log('🚀 Inserindo novos dados de teste...');

  const productsData = [
    {
      title: 'iPhone 15 Apple (128GB) Preto',
      priceCents: 459900n,
      marketplace: Marketplace.mercado_livre,
      mainImageUrl: 'https://m.media-amazon.com/images/I/71657S9-6xL._AC_SL1500_.jpg',
      category: 'Smartphone',
      urlAffiliate: 'https://mercadolivre.com.br/aff/iphone15',
    },
    {
      title: 'Samsung Galaxy S24 Ultra 512GB',
      priceCents: 629900n,
      marketplace: Marketplace.magalu,
      mainImageUrl: 'https://m.media-amazon.com/images/I/71WkS9V-6xL._AC_SL1500_.jpg',
      category: 'Smartphone',
      urlAffiliate: 'https://magazineluiza.com.br/aff/s24ultra',
    },
    {
      title: 'Fritadeira Elétrica Air Fryer Mondial',
      priceCents: 34990n,
      marketplace: Marketplace.shopee,
      mainImageUrl: 'https://m.media-amazon.com/images/I/61k8S9V-6xL._AC_SL1500_.jpg',
      category: 'Cozinha',
      urlAffiliate: 'https://shopee.com.br/aff/airfryer',
    },
    {
      title: 'PlayStation 5 Console - Slim Edition',
      priceCents: 379900n,
      marketplace: Marketplace.mercado_livre,
      mainImageUrl: 'https://m.media-amazon.com/images/I/510R-1V-6xL._AC_SL1500_.jpg',
      category: 'Games',
      urlAffiliate: 'https://mercadolivre.com.br/aff/ps5',
    },
    {
      title: 'Smart TV 55" 4K LG OLED',
      priceCents: 549900n,
      marketplace: Marketplace.magalu,
      mainImageUrl: 'https://m.media-amazon.com/images/I/81S-1V-6xL._AC_SL1500_.jpg',
      category: 'TV',
      urlAffiliate: 'https://magazineluiza.com.br/aff/lgoled',
    },
  ];

  for (const data of productsData) {
    const product = await prisma.product.create({
      data: {
        ...data,
        priceCents: data.priceCents,
      },
    });

    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        productId: product.id,
        rawUrl: data.urlAffiliate,
        marketplace: data.marketplace,
        isActive: true,
      },
    });

    // Adiciona Scrape Runs
    await prisma.scrapeRun.create({
      data: {
        affiliateLinkId: affiliateLink.id,
        status: ScrapeRunStatus.success,
        startedAt: new Date(Date.now() - 3600000),
        finishedAt: new Date(),
      },
    });

    // Adiciona Jobs de Postagem (simulando histórico)
    await prisma.postJob.create({
      data: {
        productId: product.id,
        status: PostJobStatus.success,
        channels: { telegram: true },
        createdAt: new Date(Date.now() - 1800000),
      },
    });
  }

  // Adiciona alguns links pendentes/com erro para visualização
  const errorLink = await prisma.affiliateLink.create({
    data: {
      rawUrl: 'https://shopee.com.br/item-quebrado',
      marketplace: Marketplace.shopee,
      isActive: true,
    },
  });

  await prisma.scrapeRun.create({
    data: {
      affiliateLinkId: errorLink.id,
      status: ScrapeRunStatus.error,
      error: '404 Product Not Found',
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
