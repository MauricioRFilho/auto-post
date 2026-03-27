from playwright.async_api import Browser, Page
from src.scrapers.base import BaseScraper
from src.models import ProductData
from src.logger import logger

class MagaluScraper(BaseScraper):
    async def scrape(self, url: str) -> ProductData:
        page = await self.browser.new_page()
        try:
            logger.info("Scraping Magalu product", url=url)
            await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            
            title = await self.safe_text_content(page, 'h1[data-testid="heading-product-title"]')
            price_cents = self.parse_price_to_cents(await self.safe_text_content(page, '[data-testid="price-value"]'))
            
            # Simple fallback to LD+JSON
            ld_json = await self.extract_ld_json(page)
            if ld_json:
                title = title or ld_json.get('name')
                if not price_cents and 'offers' in ld_json:
                    price_cents = int(float(ld_json['offers'].get('price', 0)) * 100)

            return ProductData(
                marketplace="magalu",
                canonical_product_id=url.split('/')[-2],
                title=title or "Unknown Magalu product",
                price_cents=price_cents,
                currency="BRL",
                url_affiliate=url,
                url_canonical=page.url,
                images=[]
            )
        finally:
            await page.close()
