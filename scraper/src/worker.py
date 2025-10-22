import asyncio
import json
from datetime import datetime
from redis import Redis
from playwright.async_api import async_playwright
from sqlalchemy.orm import Session
from src.config import settings
from src.logger import logger
from src.database import SessionLocal
from src.detector import detect_marketplace, Marketplace
from src.scrapers.mercado_livre import MercadoLivreScraper


class ScraperWorker:
    def __init__(self):
        self.redis = Redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_key = "bull:scrape:"
        self.browser = None

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
        if self.browser:
            await self.browser.close()
            logger.info("Browser closed")

    def get_scraper(self, marketplace: Marketplace):
        """Get appropriate scraper for marketplace"""
        if marketplace == Marketplace.MERCADO_LIVRE:
            return MercadoLivreScraper(self.browser)
        elif marketplace == Marketplace.MAGALU:
            # TODO: Implement Magalu scraper
            raise NotImplementedError("Magalu scraper not implemented yet")
        elif marketplace == Marketplace.SHOPEE:
            # TODO: Implement Shopee scraper
            raise NotImplementedError("Shopee scraper not implemented yet")
        else:
            raise ValueError(f"Unknown marketplace: {marketplace}")

    async def process_job(self, job_data: dict):
        """Process a scrape job"""
        affiliate_link_id = job_data.get('affiliateLinkId')
        if not affiliate_link_id:
            logger.error("No affiliateLinkId in job data")
            return

        db: Session = SessionLocal()

        try:
            # Get affiliate link from database
            result = db.execute(
                "SELECT id, raw_url, marketplace FROM affiliate_links WHERE id = :id",
                {"id": affiliate_link_id}
            )
            link = result.fetchone()

            if not link:
                logger.error("Affiliate link not found", affiliate_link_id=affiliate_link_id)
                return

            url = link[1]
            marketplace_str = link[2]

            logger.info("Processing scrape job", url=url, marketplace=marketplace_str)

            # Create/Update scrape run
            scrape_run_result = db.execute(
                """
                INSERT INTO scrape_runs (id, affiliate_link_id, status, started_at)
                VALUES (gen_random_uuid(), :link_id, 'running', :started_at)
                RETURNING id
                """,
                {"link_id": affiliate_link_id, "started_at": datetime.utcnow()}
            )
            scrape_run_id = scrape_run_result.fetchone()[0]
            db.commit()

            try:
                # Detect marketplace and get scraper
                marketplace = detect_marketplace(url)
                scraper = self.get_scraper(marketplace)

                # Scrape product
                product_data = await scraper.scrape(url)

                # Save to database
                await self.save_product(db, affiliate_link_id, product_data)

                # Update scrape run as success
                db.execute(
                    """
                    UPDATE scrape_runs
                    SET status = 'success', finished_at = :finished_at
                    WHERE id = :id
                    """,
                    {"id": scrape_run_id, "finished_at": datetime.utcnow()}
                )
                db.commit()

                logger.info("Scrape job completed successfully", affiliate_link_id=affiliate_link_id)

            except Exception as e:
                # Update scrape run as error
                db.execute(
                    """
                    UPDATE scrape_runs
                    SET status = 'error', error = :error, finished_at = :finished_at
                    WHERE id = :id
                    """,
                    {"id": scrape_run_id, "error": str(e), "finished_at": datetime.utcnow()}
                )
                db.commit()
                raise

        except Exception as e:
            logger.error("Failed to process scrape job", error=str(e), affiliate_link_id=affiliate_link_id)
            db.rollback()
        finally:
            db.close()

    async def save_product(self, db: Session, affiliate_link_id: str, product_data):
        """Save or update product in database"""
        # Check if product exists
        result = db.execute(
            """
            SELECT id FROM products
            WHERE marketplace = :marketplace
            AND canonical_product_id = :canonical_id
            """,
            {
                "marketplace": product_data.marketplace,
                "canonical_id": product_data.canonical_product_id
            }
        )
        existing = result.fetchone()

        product_dict = product_data.model_dump()

        if existing:
            # Update existing product
            product_id = existing[0]
            db.execute(
                """
                UPDATE products
                SET title = :title,
                    price_cents = :price_cents,
                    currency = :currency,
                    rating = :rating,
                    review_count = :review_count,
                    seller_name = :seller_name,
                    category = :category,
                    main_image_url = :main_image_url,
                    images = :images,
                    url_affiliate = :url_affiliate,
                    url_canonical = :url_canonical,
                    updated_at = :updated_at
                WHERE id = :id
                """,
                {
                    **product_dict,
                    "images": json.dumps(product_data.images),
                    "id": product_id,
                    "updated_at": datetime.utcnow()
                }
            )
        else:
            # Create new product
            result = db.execute(
                """
                INSERT INTO products (
                    id, marketplace, canonical_product_id, title, price_cents, currency,
                    rating, review_count, seller_name, category, main_image_url, images,
                    url_affiliate, url_canonical, created_at, updated_at
                )
                VALUES (
                    gen_random_uuid(), :marketplace, :canonical_product_id, :title, :price_cents, :currency,
                    :rating, :review_count, :seller_name, :category, :main_image_url, :images,
                    :url_affiliate, :url_canonical, :created_at, :updated_at
                )
                RETURNING id
                """,
                {
                    **product_dict,
                    "images": json.dumps(product_data.images),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )
            product_id = result.fetchone()[0]

        # Update affiliate link with product_id
        db.execute(
            "UPDATE affiliate_links SET product_id = :product_id WHERE id = :id",
            {"product_id": product_id, "id": affiliate_link_id}
        )

        # Create product version snapshot
        db.execute(
            """
            INSERT INTO product_versions (id, product_id, snapshot, scraped_at)
            VALUES (gen_random_uuid(), :product_id, :snapshot, :scraped_at)
            """,
            {
                "product_id": product_id,
                "snapshot": json.dumps(product_dict),
                "scraped_at": datetime.utcnow()
            }
        )

        db.commit()
        logger.info("Product saved to database", product_id=product_id)

    async def run(self):
        """Main worker loop"""
        logger.info("Starting scraper worker")
        await self.init_browser()

        try:
            while True:
                try:
                    # Use BRPOP to block and wait for jobs (simulating BullMQ consumer)
                    # In production, use proper BullMQ Python client
                    job = self.redis.brpop("bull:scrape:wait", timeout=5)

                    if job:
                        job_data = json.loads(job[1])
                        await self.process_job(job_data)
                    else:
                        await asyncio.sleep(1)

                except Exception as e:
                    logger.error("Error in worker loop", error=str(e))
                    await asyncio.sleep(5)

        except KeyboardInterrupt:
            logger.info("Worker interrupted by user")
        finally:
            await self.close_browser()


async def main():
    worker = ScraperWorker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
