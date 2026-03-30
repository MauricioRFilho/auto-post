"""
Scraper Worker module.
Handles consumption of scrape jobs from BullMQ/Redis and coordinates
the Playwright-based scraping process for different marketplaces.
"""
import asyncio
import json
import uuid
from datetime import datetime
from redis import Redis
from playwright.async_api import async_playwright, Browser
from sqlalchemy.orm import Session
from src.config import settings
from src.logger import logger
from src.database import SessionLocal
from src.detector import detect_marketplace
from src.models import (
    AffiliateLink, Product, ProductVersion, ScrapeRun, 
    ScrapeRunStatus, MarketplaceEnum
)


class ScraperWorker:
    def __init__(self):
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_key = "bull:scrape:"
        self.browser: Browser | None = None

    async def init_browser(self):
        """Initialize Playwright browser"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
            ]
        )
        logger.info("Browser initialized")

    async def close_browser(self):
        """Close Playwright browser"""
        if self.browser is not None:
            await self.browser.close()
            self.browser = None
            logger.info("Browser closed")

    async def get_scaler_scraper(self, marketplace_val: str):
        """Get appropriate scraper for marketplace"""
        # Dynamic import to avoid circular imports if any
        from src.scrapers.mercado_livre import MercadoLivreScraper
        from src.scrapers.magalu import MagaluScraper
        from src.scrapers.shopee import ShopeeScraper

        if marketplace_val == MarketplaceEnum.mercado_livre.value:
            return MercadoLivreScraper(self.browser)
        elif marketplace_val == MarketplaceEnum.magalu.value:
            return MagaluScraper(self.browser)
        elif marketplace_val == MarketplaceEnum.shopee.value:
            return ShopeeScraper(self.browser)
        else:
            raise ValueError(f"Unknown marketplace: {marketplace_val}")

    async def process_job(self, job_data: dict):
        """Process a scrape job"""
        affiliate_link_id = job_data.get('affiliateLinkId')
        if not affiliate_link_id:
            logger.error("No affiliateLinkId in job data")
            return

        db: Session = SessionLocal()

        try:
            # 1. Get affiliate link using ORM
            affiliate_link = db.query(AffiliateLink).filter(AffiliateLink.id == affiliate_link_id).first()

            if not affiliate_link:
                logger.error(f"Affiliate link not found: {affiliate_link_id}")
                return

            logger.info(f"Processing scrape job: {affiliate_link.raw_url}")

            # 2. Create Scrape Run
            scrape_run = ScrapeRun(
                id=str(uuid.uuid4()),
                affiliate_link_id=affiliate_link_id,
                status=ScrapeRunStatus.running,
                started_at=datetime.utcnow()
            )
            db.add(scrape_run)
            db.commit()

            try:
                # 3. Detect marketplace and get scraper
                # detector handles normalization and marketplace identification
                marketplace = detect_marketplace(affiliate_link.raw_url)
                scraper = await self.get_scaler_scraper(marketplace.value)

                # 4. Scrape product data
                product_data = await scraper.scrape(affiliate_link.raw_url)

                # 5. Save/Update product via ORM
                await self.save_product(db, affiliate_link, product_data)

                # 6. Mark Success
                scrape_run.status = ScrapeRunStatus.success
                scrape_run.finished_at = datetime.utcnow()
                db.commit()

                logger.info(f"Scrape job completed successfully: {affiliate_link_id}")

            except Exception as e:
                # Mark Error in ScrapeRun
                scrape_run.status = ScrapeRunStatus.error
                scrape_run.error = str(e)
                scrape_run.finished_at = datetime.utcnow()
                db.commit()
                logger.error(f"Error scraping URL {affiliate_link.raw_url}: {str(e)}")
                raise

        except Exception as e:
            logger.error(f"Failed to process job: {str(e)}", extra={"affiliate_link_id": affiliate_link_id})
            db.rollback()
        finally:
            db.close()

    async def save_product(self, db: Session, affiliate_link: AffiliateLink, product_data):
        """Save captured product data to DB via ORM and create version snapshot"""
        
        # Check if product already exists by Marketplace + Canonical ID
        product = db.query(Product).filter(
            Product.marketplace == MarketplaceEnum(product_data.marketplace),
            Product.canonical_product_id == product_data.canonical_product_id
        ).first()

        product_dict = product_data.model_dump()

        if product:
            # Update existing
            for key, value in product_dict.items():
                if hasattr(product, key):
                    setattr(product, key, value)
            product.updated_at = datetime.utcnow()
        else:
            # Create new
            product = Product(**product_dict)
            product.id = str(uuid.uuid4())
            db.add(product)
            db.flush() # Get product ID for relationship

        # Ensure affiliate_link points to this product
        affiliate_link.product_id = product.id

        # Create version snapshot (Always)
        version = ProductVersion(
            id=str(uuid.uuid4()),
            product_id=product.id,
            snapshot=product_dict,
            scraped_at=datetime.utcnow()
        )
        db.add(version)
        db.commit()

    async def run(self):
        """Main worker loop"""
        logger.info("Starting scraper worker (SQLAlchemy ORM)")
        await self.init_browser()

        try:
            while True:
                try:
                    # In production, use BullMQ library for Python. 
                    # For simplicity, we keep the simulated consumption.
                    job = self.redis.brpop("bull:scrape:wait", timeout=5)

                    if job:
                        job_data = json.loads(job[1])
                        await self.process_job(job_data)
                    else:
                        await asyncio.sleep(1)

                except Exception as e:
                    logger.error(f"Error in worker loop: {str(e)}")
                    await asyncio.sleep(5)

        except KeyboardInterrupt:
            logger.info("Worker interrupted")
        finally:
            await self.close_browser()


async def main():
    worker = ScraperWorker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
