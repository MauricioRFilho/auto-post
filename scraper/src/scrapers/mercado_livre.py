from playwright.async_api import Browser, Page
from src.scrapers.base import BaseScraper
from src.models import ProductData
from src.logger import logger
from decimal import Decimal
import re
import json


class MercadoLivreScraper(BaseScraper):
    def __init__(self, browser: Browser):
        super().__init__(browser)

    async def scrape(self, url: str) -> ProductData:
        """Scrape Mercado Livre product"""
        page = await self.browser.new_page()

        try:
            logger.info("Scraping Mercado Livre product", url=url)

            # Navigate to page
            await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            await page.wait_for_timeout(2000)  # Wait for dynamic content

            # Extract data
            title = await self._extract_title(page)
            price_cents = await self._extract_price(page)
            images = await self._extract_images(page)
            seller_name = await self._extract_seller(page)
            rating, review_count = await self._extract_rating_and_reviews(page)
            category = await self._extract_category(page)
            canonical_id = self._extract_product_id(url)

            product_data = ProductData(
                marketplace="mercado_livre",
                canonical_product_id=canonical_id,
                title=title,
                price_cents=price_cents,
                currency="BRL",
                rating=rating,
                review_count=review_count,
                seller_name=seller_name,
                category=category,
                main_image_url=images[0] if images else None,
                images=images,
                url_affiliate=url,
                url_canonical=page.url,
            )

            logger.info("Successfully scraped Mercado Livre product", title=title)
            return product_data

        except Exception as e:
            logger.error("Failed to scrape Mercado Livre product", url=url, error=str(e))
            # Save screenshot for debugging
            try:
                await page.screenshot(path=f"error_{canonical_id or 'unknown'}.png")
            except:
                pass
            raise

        finally:
            await page.close()

    async def _extract_title(self, page: Page) -> str:
        """Extract product title"""
        selectors = [
            'h1.ui-pdp-title',
            'h1[class*="title"]',
            '.ui-pdp-title',
        ]

        for selector in selectors:
            title = await self.safe_text_content(page, selector)
            if title:
                return title

        raise ValueError("Could not extract title from Mercado Livre page")

    async def _extract_price(self, page: Page) -> int:
        """Extract product price in cents"""
        # Try JSON-LD first
        ld_json = await self.extract_ld_json(page)
        if ld_json and 'offers' in ld_json:
            offers = ld_json['offers']
            if isinstance(offers, dict) and 'price' in offers:
                try:
                    return int(float(offers['price']) * 100)
                except:
                    pass

        # Try DOM selectors
        selectors = [
            '.andes-money-amount__fraction',
            '.price-tag-fraction',
            'span[class*="price-tag-fraction"]',
        ]

        for selector in selectors:
            price_text = await self.safe_text_content(page, selector)
            if price_text:
                price_cents = self.parse_price_to_cents(price_text)
                if price_cents > 0:
                    return price_cents

        # Try to find price in page content
        try:
            content = await page.content()
            price_match = re.search(r'R\$\s*(\d+(?:[.,]\d+)?)', content)
            if price_match:
                return self.parse_price_to_cents(price_match.group(1))
        except:
            pass

        logger.warning("Could not extract price from Mercado Livre page")
        return 0

    async def _extract_images(self, page: Page) -> list[str]:
        """Extract product images"""
        images = await self.collect_images(page, [
            'img.ui-pdp-image',
            'img[class*="ui-pdp-image"]',
            'figure img',
            'img[data-zoom]',
        ])

        # Filter out tiny images and icons
        filtered = [img for img in images if not any(x in img.lower() for x in ['icon', 'logo', 'seller'])]

        return filtered[:10]  # Limit to 10 images

    async def _extract_seller(self, page: Page) -> str:
        """Extract seller name"""
        selectors = [
            '.ui-pdp-seller__link-trigger-button',
            'a[class*="seller"] span',
            '.ui-pdp-seller__header__title',
        ]

        for selector in selectors:
            seller = await self.safe_text_content(page, selector)
            if seller and len(seller) > 0:
                return seller

        return None

    async def _extract_rating_and_reviews(self, page: Page) -> tuple[Decimal, int]:
        """Extract rating and review count"""
        rating = None
        review_count = None

        # Try to find rating
        rating_selectors = [
            '.ui-pdp-review__rating',
            'span[class*="rating"]',
            '.ui-pdp-reviews__rating__average',
        ]

        for selector in rating_selectors:
            rating_text = await self.safe_text_content(page, selector)
            if rating_text:
                rating = self.parse_rating(rating_text)
                if rating:
                    break

        # Try to find review count
        review_selectors = [
            '.ui-pdp-review__amount',
            'span[class*="review"][class*="amount"]',
            '.ui-pdp-reviews__subtitle',
        ]

        for selector in review_selectors:
            review_text = await self.safe_text_content(page, selector)
            if review_text:
                review_count = self.parse_review_count(review_text)
                if review_count:
                    break

        return rating, review_count

    async def _extract_category(self, page: Page) -> str:
        """Extract product category from breadcrumb"""
        try:
            breadcrumbs = await page.query_selector_all('.andes-breadcrumb__item')
            categories = []

            for crumb in breadcrumbs:
                text = await crumb.text_content()
                if text:
                    categories.append(text.strip())

            if categories:
                return ' > '.join(categories)
        except:
            pass

        return None

    def _extract_product_id(self, url: str) -> str:
        """Extract canonical product ID from URL"""
        # ML IDs are typically in format MLB1234567890
        match = re.search(r'(MLB[\d]+)', url)
        if match:
            return match.group(1)

        # Try to extract from path
        match = re.search(r'/([^/]+)$', url.split('?')[0])
        if match:
            return match.group(1)

        return None
